import { useEffect, useRef, useState, useCallback } from "react";
import * as signalR from "@microsoft/signalr";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Player {
    id: number;
    playerName: string;
    teamColor: string | null;
    isMindreader: boolean;
    isPlaying: boolean;
}

export interface CardDTO {
    word: string;
    // teamColor is null for operatives on unrevealed cards (backend hides it)
    teamColor: "Red" | "Blue" | "Neutral" | "Bomb" | null;
    isRevealed: boolean;
    position: number;
}

export interface RevealedCard {
    position: number;
    word: string;
    teamColor: string;
    isRevealed: boolean;
}

// ── SignalR payload shapes (camelCase - .NET default serialization) ───────────

interface PlayerJoinedPayload {
    userId: number;
    totalPlayers: number;
}

// Backend sends PlayerName, NewTeam, IsMindreader (no userId)
interface PlayerTeamChangedPayload {
    playerName: string;
    newTeam: string;
    isMindreader: boolean;
}

interface GameStartedPayload {
    firstTeam: string;
}

interface ReceiveCardsPayload {
    cards: CardDTO[];
}

interface HintGivenPayload {
    word: string;
    wordCount: number;
}

// ExecuteGuess broadcasts GuessExecuted to group (not GuessResult)
interface GuessExecutedPayload {
    revealedCards: RevealedCard[];
    isGameOver: boolean;
    winnerTeam: string | null;
}

// ── Public types ──────────────────────────────────────────────────────────────

export type LogEntry = {
    id: number;
    type: "info" | "success" | "error" | "hint" | "guess";
    message: string;
    time: string;
};

export interface GameState {
    started: boolean;
    firstTeam?: string;
    currentHint?: { word: string; count: number };
    winner?: string | null;
    ended: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const now = () =>
    new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });

let logIdCounter = 0;
const mkLog = (type: LogEntry["type"], message: string): LogEntry => ({
    id: ++logIdCounter, type, message, time: now(),
});

const HUB_URL = "/hubs/game";

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseGameHubOptions {
    gameCode: string | undefined;
    onPlayerTeamChanged: (playerName: string, newTeam: string, isMindreader: boolean) => void;
    onGameStarted: (firstTeam: string) => void;
    onReceiveCards: (cards: CardDTO[]) => void;
    onGuessExecuted: (revealedCards: RevealedCard[], isGameOver: boolean, winner: string | null) => void;
    onPlayerJoined?: (userId: number, totalPlayers: number) => void;
}

export const useGameHub = ({
    gameCode,
    onPlayerTeamChanged,
    onGameStarted,
    onReceiveCards,
    onGuessExecuted,
    onPlayerJoined,
}: UseGameHubOptions) => {
    const [connStatus, setConnStatus] = useState<string>("Disconnected");
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [gameState, setGameState] = useState<GameState>({ started: false, ended: false });

    const connectionRef = useRef<signalR.HubConnection | null>(null);

    const addLog = useCallback((type: LogEntry["type"], message: string) => {
        setLogs((prev) => [...prev.slice(-49), mkLog(type, message)]);
    }, []);

    useEffect(() => {
        if (!gameCode) return;

        const connection = new signalR.HubConnectionBuilder()
            .withUrl(HUB_URL, {
                accessTokenFactory: () => localStorage.getItem("token") ?? "",
            })
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.Warning)
            .build();

        connectionRef.current = connection;

        connection.onreconnecting(() => {
            setConnStatus("Reconnecting");
            addLog("error", "Connection lost - reconnecting...");
        });

        connection.onreconnected(async () => {
            setConnStatus("Connected");
            addLog("info", "Reconnected to hub");
            await connection.invoke("JoinGame", gameCode).catch(() => { });
        });

        connection.onclose(() => {
            setConnStatus("Disconnected");
            addLog("error", "Disconnected from hub");
        });

        // JoinGame -> Clients.Group -> PlayerJoined({ UserId, TotalPlayers })
        connection.on("PlayerJoined", (payload: PlayerJoinedPayload) => {
            addLog("info", `Player joined (total: ${payload.totalPlayers})`);
            onPlayerJoined?.(payload.userId, payload.totalPlayers);
        });

        // UpdateTeam -> Clients.Group -> PlayerTeamChanged({ PlayerName, NewTeam, IsMindreader })
        // Backend does NOT send PlayerId - match by playerName in consumer
        connection.on("PlayerTeamChanged", (payload: PlayerTeamChangedPayload) => {
            addLog(
                "info",
                `${payload.playerName} joined ${payload.newTeam} as ${payload.isMindreader ? "Spymaster" : "Operative"}`,
            );
            onPlayerTeamChanged(payload.playerName, payload.newTeam, payload.isMindreader);
        });

        // StartGame -> Clients.Group -> GameStarted({ FirstTeam })
        connection.on("GameStarted", (payload: GameStartedPayload) => {
            setGameState((s) => ({ ...s, started: true, firstTeam: payload.firstTeam }));
            addLog("success", `Game started! First turn: ${payload.firstTeam}`);
            onGameStarted(payload.firstTeam);
        });

        // StartGame -> Clients.Client(connectionId) -> ReceiveCards({ Cards })
        // Per-player: operatives get null teamColor on unrevealed cards
        // Spymasters get real colors on all cards
        connection.on("ReceiveCards", (payload: ReceiveCardsPayload) => {
            addLog("info", `Board received (${payload.cards?.length ?? 0} cards)`);
            if (payload.cards) {
                onReceiveCards(payload.cards);
            }
        });

        // GiveHint -> Clients.Group -> HintGiven({ Word, WordCount })
        connection.on("HintGiven", (payload: HintGivenPayload) => {
            setGameState((s) => ({
                ...s,
                currentHint: { word: payload.word, count: payload.wordCount },
            }));
            addLog("hint", `Hint: "${payload.word}" x${payload.wordCount}`);
        });

        // ExecuteGuess -> Clients.Group -> GuessExecuted({ RevealedCards, IsGameOver, Winner })
        connection.on("GuessExecuted", (payload: GuessExecutedPayload) => {

            if (payload.isGameOver && payload.winnerTeam) {
                setGameState((s) => ({ ...s, ended: true, winner: payload.winnerTeam }));
            }

            onGuessExecuted(
                payload.revealedCards ?? [],
                payload.isGameOver,
                payload.winnerTeam
            );
        });

        // Generic hub error
        connection.on("Error", (message: string) => {
            addLog("error", `Server: ${message}`);
        });

        const start = async () => {
            try {
                setConnStatus("Connecting");
                await connection.start();
                setConnStatus("Connected");
                addLog("info", "Connected to hub");
                await connection.invoke("JoinGame", gameCode);
                addLog("info", `Joined game ${gameCode}`);
            } catch (err) {
                if (connection.state === signalR.HubConnectionState.Connected) return;
                setConnStatus("Disconnected");
                addLog("error", `Failed to connect: ${String(err)}`);
            }
        };

        start();
        return () => { connection.stop(); };
    }, [gameCode, addLog]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Exposed actions ───────────────────────────────────────────────────────

    const startGame = async (code: string) => {
        if (!connectionRef.current) return;
        try {
            await connectionRef.current.invoke("StartGame", code);
        } catch {
            addLog("error", "Failed to start game");
        }
    };

    // UpdateTeam(gameCode, teamColor, isMindreader) - only works while Waiting
    const updateTeam = async (code: string, teamColor: "Red" | "Blue", isMindreader: boolean) => {
        if (!connectionRef.current) throw new Error("Not connected");
        await connectionRef.current.invoke("UpdateTeam", code, teamColor, isMindreader);
    };

    // ExecuteGuess(gameCode, [cardPosition]) - backend takes List<int>
    const executeGuess = async (code: string, cardPosition: number) => {
        if (!connectionRef.current) throw new Error("Not connected");
        await connectionRef.current.invoke("ExecuteGuess", code, [cardPosition]);
    };

    // GiveHint(gameCode, word, wordCount)
    const giveHint = async (code: string, word: string, count: number) => {
        if (!connectionRef.current) throw new Error("Not connected");
        await connectionRef.current.invoke("GiveHint", code, word, count);
    };

    return {
        connStatus,
        logs,
        gameState,
        startGame,
        updateTeam,
        executeGuess,
        giveHint,
    };
};
import { useEffect, useRef, useState, useCallback } from "react";
import * as signalR from "@microsoft/signalr";


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

interface PlayerJoinedPayload {
    userId: number;
    totalPlayers: number;
}

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
    playerUsername: string;
    word: string;
    wordCount: number;
}

interface GuessExecutedPayload {
    playerUsername: string;
    revealedCards: RevealedCard[];
    isGameOver: boolean;
    winner: string | null;
    currentTeam: string | null;
    redTeamRemainingCardsCount?: number | null;
    blueTeamRemainingCardsCount?: number | null;
}


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

//hook
interface UseGameHubOptions {
    gameCode: string | undefined;
    onPlayerTeamChanged: (playerName: string, newTeam: string, isMindreader: boolean) => void;
    onGameStarted: (firstTeam: string) => void;
    onReceiveCards: (cards: CardDTO[]) => void;
    onGuessExecuted: (
        revealedCards: RevealedCard[],
        isGameOver: boolean,
        winner: string | null,
        currentTeam: string | null,
        redRemaining: number | null,
        blueRemaining: number | null,
    ) => void;
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

        let cancelled = false;

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
            addLog("info", "Reconnected to server");
            await connection.invoke("JoinGame", gameCode).catch(() => { });
        });

        connection.onclose(() => {
            setConnStatus("Disconnected");
            addLog("error", "Disconnected from server");
        });

        connection.on("PlayerJoined", (payload: PlayerJoinedPayload) => {
            addLog("info", `${payload.totalPlayers} player${payload.totalPlayers !== 1 ? "s" : ""} in lobby`);
            onPlayerJoined?.(payload.userId, payload.totalPlayers);
        });

        connection.on("PlayerTeamChanged", (payload: PlayerTeamChangedPayload) => {
            addLog("info", `${payload.playerName} → ${payload.newTeam} ${payload.isMindreader ? "Spymaster" : "Operative"}`);
            onPlayerTeamChanged(payload.playerName, payload.newTeam, payload.isMindreader);
        });

        connection.on("GameStarted", (payload: GameStartedPayload) => {
            setGameState((s) => ({ ...s, started: true, firstTeam: payload.firstTeam }));
            addLog("success", `Game started! ${payload.firstTeam} goes first`);
            console.log(payload);
            onGameStarted(payload.firstTeam);
        });

        connection.on("ReceiveCards", (payload: ReceiveCardsPayload) => {
            if (payload.cards) {
                onReceiveCards(payload.cards);
            }
        });

        connection.on("HintGiven", (payload: HintGivenPayload) => {
            console.log(payload);
            setGameState((s) => ({
                ...s,
                currentHint: { word: payload.word, count: payload.wordCount },
            }));
            addLog("hint", `${payload.playerUsername} ${payload.word.toUpperCase()} × ${payload.wordCount}`);
        });

        connection.on("GuessExecuted", (payload: GuessExecutedPayload) => {
            console.log(payload);
            const words = payload.revealedCards?.map((c) => c.word).join(", ") ?? "?";
            addLog("guess", `${payload.playerUsername}: ${words}`);

            if (payload.isGameOver && payload.winner) {
                setGameState((s) => ({ ...s, ended: true, winner: payload.winner, currentHint: undefined }));
                addLog("success", `${payload.winner} team wins!`);
            } else {
                setGameState((s) => ({ ...s, currentHint: undefined }));
            }

            onGuessExecuted(
                payload.revealedCards ?? [],
                payload.isGameOver,
                payload.winner,
                payload.currentTeam ?? null,
                payload.redTeamRemainingCardsCount ?? null,
                payload.blueTeamRemainingCardsCount ?? null,
            );
        });

        connection.on("Error", (message: string) => {
            addLog("error", `Server: ${message}`);
        });

        const start = async () => {
            try {
                setConnStatus("Connecting");
                await connection.start();
                if (cancelled) { connection.stop(); return; }
                setConnStatus("Connected");
                await connection.invoke("JoinGame", gameCode);
            } catch (err) {
                if (cancelled) return;
                if (connection.state === signalR.HubConnectionState.Connected) return;
                setConnStatus("Disconnected");
                addLog("error", "Connection failed");
            }
        };

        start();
        return () => {
            cancelled = true;
            connection.stop();
        };
    }, [gameCode, addLog]);



    const startGame = async (code: string) => {
        if (!connectionRef.current) return;
        try {
            await connectionRef.current.invoke("StartGame", code);
        } catch {
            addLog("error", "Failed to start game");
        }
    };

    const updateTeam = async (code: string, teamColor: "Red" | "Blue", isMindreader: boolean) => {
        if (!connectionRef.current) throw new Error("Not connected");
        await connectionRef.current.invoke("UpdateTeam", code, teamColor, isMindreader);
    };

    const executeGuess = async (code: string, cardPositions: number[]) => {
        if (!connectionRef.current) throw new Error("Not connected");
        await connectionRef.current.invoke("ExecuteGuess", code, cardPositions);
    };

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
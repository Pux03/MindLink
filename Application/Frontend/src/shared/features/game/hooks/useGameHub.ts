import { useEffect, useRef, useState, useCallback } from "react";
import * as signalR from "@microsoft/signalr";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Player {
    id: number;
    playerName: string;
    teamColor: string | null;
    isMindreader: boolean;
    isPlaying: boolean;
}

// Backend sends camelCase via SignalR JSON serialization
interface PlayerJoinedPayload { userId: number; totalPlayers: number; }
interface GameStartedPayload { firstTeam: string; }
interface HintGivenPayload { word: string; wordCount: number; }
// GuessResult is sent only to Caller (not the group) — positions of the guessed cards
interface GuessResultPayload { guessedCardPositions: number[]; }
interface PlayerTeamChangedPayload {
    playerId: number;
    playerName: string;
    newTeam: string;
    isMindreader: boolean;
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
    /** Positions that were guessed (from GuessResult — only visible to guesser) */
    lastGuessedPositions?: number[];
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
    /**
     * Called when the local player's own guess result arrives.
     * Positions come from GuessResult (Caller-only).
     * Use this to reveal cards optimistically on the guesser's side.
     */
    onGuessResult: (positions: number[]) => void;
    onPlayersUpdated: (updater: (players: Player[]) => Player[]) => void;
    onGameStatusChange: (status: "Waiting" | "Playing" | "Ended") => void;
    onWinner: (winner: string | null) => void;
}

export const useGameHub = ({
    gameCode,
    onGuessResult,
    onPlayersUpdated,
    onGameStatusChange,
    onWinner,
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

        // ── Connection lifecycle ──────────────────────────────────────────────

        connection.onreconnecting(() => {
            setConnStatus("Reconnecting");
            addLog("error", "Connection lost — reconnecting…");
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

        // ── Hub event handlers — must match backend Clients.*.MethodName() ───

        /**
         * Sent to group by JoinGame hub method.
         * Payload: { UserId, TotalPlayers } — SignalR serializes to camelCase by default.
         */
        connection.on("PlayerJoined", (payload: PlayerJoinedPayload) => {
            addLog("info", `Player joined (total: ${payload.totalPlayers})`);
        });

        /**
         * Sent to group by UpdateTeam hub method.
         */
        connection.on("PlayerTeamChanged", (payload: PlayerTeamChangedPayload) => {
            addLog(
                "info",
                `${payload.playerName} → ${payload.newTeam} ${payload.isMindreader ? "(Spymaster)" : "(Operative)"}`,
            );
            onPlayersUpdated((players) =>
                players.map((p) =>
                    p.id === payload.playerId
                        ? { ...p, teamColor: payload.newTeam, isMindreader: payload.isMindreader }
                        : p,
                ),
            );
        });

        /**
         * Sent to group by StartGame hub method.
         * Payload: { FirstTeam } → camelCase: { firstTeam }
         */
        connection.on("GameStarted", (payload: GameStartedPayload) => {
            setGameState((s) => ({ ...s, started: true, firstTeam: payload.firstTeam }));
            addLog("success", `♠ Game started! First turn: ${payload.firstTeam}`);
            onGameStatusChange("Playing");
        });

        /**
         * Sent to group by GiveHint hub method.
         * Payload: { Word, WordCount } → camelCase: { word, wordCount }
         */
        connection.on("HintGiven", (payload: HintGivenPayload) => {
            setGameState((s) => ({
                ...s,
                currentHint: { word: payload.word, count: payload.wordCount },
            }));
            addLog("hint", `♦ Hint: "${payload.word}" × ${payload.wordCount}`);
        });

        /**
         * Sent ONLY to Caller by ExecuteGuess hub method.
         * Payload: { GuessedCardPositions } → camelCase: { guessedCardPositions }
         *
         * NOTE: The backend currently only sends this to the caller and does NOT
         * broadcast card reveals to the group. To reveal cards for all players,
         * the backend needs to emit a group event (e.g. Clients.Group(...).CardRevealed).
         * For now we handle the caller-side reveal here.
         */
        connection.on("GuessResult", (payload: GuessResultPayload) => {
            addLog("guess", `♣ Your guess: cards [${payload.guessedCardPositions.join(", ")}]`);
            setGameState((s) => ({ ...s, lastGuessedPositions: payload.guessedCardPositions }));
            onGuessResult(payload.guessedCardPositions);
        });

        /**
         * Generic error from the hub.
         */
        connection.on("Error", (message: string) => {
            addLog("error", `Server: ${message}`);
        });

        // ── Start connection ──────────────────────────────────────────────────

        const start = async () => {
            try {
                setConnStatus("Connecting");
                await connection.start();
                setConnStatus("Connected");
                addLog("info", "Connected to SignalR hub");
                await connection.invoke("JoinGame", gameCode);
                addLog("info", `Joined game ${gameCode}`);
            } catch (err) {
                if (connection.state === signalR.HubConnectionState.Connected) return;
                setConnStatus("Disconnected");
                addLog("error", `Failed to connect: ${String(err)}`);
            }
        };

        start();
        return () => {
            connection.stop();
        };
    }, [gameCode, addLog]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Exposed actions ───────────────────────────────────────────────────────

    /** Invokes StartGame on the hub. Only the host should call this. */
    const startGame = async (code: string) => {
        if (!connectionRef.current) return;
        try {
            await connectionRef.current.invoke("StartGame", code);
        } catch {
            addLog("error", "Failed to start game via hub");
        }
    };

    /**
     * Invokes ExecuteGuess on the hub.
     * The backend accepts List<int> cardPositions — we send an array.
     */
    const executeGuess = async (code: string, cardPosition: number) => {
        if (!connectionRef.current) throw new Error("Not connected");
        await connectionRef.current.invoke("ExecuteGuess", code, [cardPosition]);
    };

    /**
     * Invokes GiveHint on the hub.
     * Backend signature: GiveHint(string gameCode, string word, int wordCount)
     */
    const giveHint = async (code: string, word: string, count: number) => {
        if (!connectionRef.current) throw new Error("Not connected");
        await connectionRef.current.invoke("GiveHint", code, word, count);
    };

    return {
        connStatus,
        logs,
        gameState,
        startGame,
        executeGuess,
        giveHint,
    };
};
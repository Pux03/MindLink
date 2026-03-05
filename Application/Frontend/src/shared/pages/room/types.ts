// ─── Shared room types ────────────────────────────────────────────────────────

export interface Player {
    id: number;
    playerName: string;
    teamColor: string | null;
    isMindreader: boolean;
    isPlaying: boolean;
}

export interface Team {
    id: number;
    name: string;
    color: string;
    score: number;
    members: Player[];
}

export type TeamColor = "Red" | "Blue";
export type CardTeamColor = "Red" | "Blue" | "Neutral" | "Bomb" | null;

export interface CardData {
    word: string;
    teamColor: CardTeamColor;
    isRevealed: boolean;
    position: number;
}

export interface Board {
    id: number;
    size: number;
    cards: CardData[];
}

export interface GameRoom {
    code: string;
    status: "Waiting" | "Playing" | "Ended";
    currentTeam: TeamColor;
    winner: string | null;
    startTime: string;
    endTime: string | null;
    redTeam: Team;
    blueTeam: Team;
    players: Player[];
    board: Board;
}

export type LogEntry = {
    id: number;
    type: "info" | "success" | "error" | "hint" | "guess";
    message: string;
    time: string;
};
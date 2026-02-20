export interface BaseApiResponse<T = unknown> {
    success: boolean;
    message: string;
    data: T;
    errors: string[];
}

export interface CreateGameRequest {
    gameName: string;
    playerName: string;
    userId: string;
}

/* =======================
   ENUM / UNION TYPES
======================= */

export type GameStatus = "Waiting" | "Active" | "GameOver";

export type TeamColor = "Red" | "Blue";

export type CardTeamColor = "Red" | "Blue" | "Neutral" | "Bomb";


/* =======================
   CORE DTOs
======================= */

export interface PlayerDTO {
    id: number;

    playerName: string | null;

    teamColor: TeamColor | null;

    isMindreader: boolean;

    isPlaying: boolean;
}


export interface GameTeamDTO {
    id: number;

    name: string | null;

    color: TeamColor | null;

    score: number;

    members: PlayerDTO[];
}


export interface CardDTO {
    word: string;

    teamColor: CardTeamColor;

    isRevealed: boolean;

    position: number;
}


export interface BoardDTO {
    id: number;

    size: number; // default 25

    cards: CardDTO[];
}


export interface GameSessionDTO {
    id: number;

    name: string;

    status: GameStatus;

    currentTeam: TeamColor;

    winner: TeamColor | null;

    startTime: string;   // ISO date string

    endTime: string | null;

    redTeam: GameTeamDTO;

    blueTeam: GameTeamDTO;

    players: PlayerDTO[];

    board: BoardDTO;
}


export type GameSessionResponse = BaseApiResponse<GameSessionDTO>;
export type StringResponse = BaseApiResponse<string>;

import { apiClient } from "./client";
import type { CreateGameRequest, GameSessionDTO, GameSessionResponse, JoinGameRequest } from "./types";

export const gameApi = {
    createGame: async (data: CreateGameRequest) => {
        const response = await apiClient.post<GameSessionResponse>(
            "/Games/create",
            data
        );
        return response.data;
    },

    joinGame: async (code: string, data: JoinGameRequest) => {
        const response = await apiClient.post(
            `/Games/${code}/join`,
            data
        );
        return response.data;
    },

    getGame: async (gameId: string) => {
        const response = await apiClient.get<GameSessionResponse>(
            `/Games/${gameId}`
        );
        return response.data;
    },
};

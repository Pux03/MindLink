import { apiClient } from "./client";
import type { CreateGameRequest, GameSessionDTO, GameSessionResponse } from "./types";

export const gameApi = {
    createGame: async (data: CreateGameRequest) => {
        const response = await apiClient.post<GameSessionResponse>(
            "/Games/create",
            data
        );
        return response.data;
    },

    joinGame: async (gameId: number, playerName: string) => {
        const response = await apiClient.post(
            `/game/${gameId}/join`,
            { playerName }
        );
        return response.data;
    },

    getGame: async (gameId: number) => {
        const response = await apiClient.get<GameSessionDTO>(
            `/game/${gameId}`
        );
        return response.data;
    },
};

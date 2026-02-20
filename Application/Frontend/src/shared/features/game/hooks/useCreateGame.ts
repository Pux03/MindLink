import { useState } from "react";
import type { GameSessionDTO, GameSessionResponse } from "../../../api/types";
import { gameApi } from "../../../api/game.api";

export const useCreateGame = () => {
    const [loading, setLoading] = useState(false);

    const createGame = async (gameName: string, playerName?: string): Promise<GameSessionResponse | null> => {
        try {
            setLoading(true);
            const game = await gameApi.createGame({
                gameName,
                playerName: playerName ?? "Anonymous",
                userId: "2", // ili stvarni userId ako imaš auth
            });
            return game;
        } catch (err) {
            console.error("Failed to create game:", err);
            return null;
        } finally {
            setLoading(false);
        }
    };

    return { createGame, loading };
};

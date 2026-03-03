import { useState } from "react";
import type { GameSessionDTO, GameSessionResponse } from "../../../api/types";
import { gameApi } from "../../../api/game.api";

export const useGetGame = () => {
    const [loading, setLoading] = useState(false);

    const getGame = async (code: string): Promise<GameSessionResponse | null> => {
        try {
            setLoading(true);
            const game = await gameApi.getGame(code);
            return game;
        } catch (err) {
            console.error("Failed to create game:", err);
            return null;
        } finally {
            setLoading(false);
        }
    };

    return { getGame, loading };
};

import { useState } from "react";
import type { GameSessionResponse } from "../../../api/types";
import { gameApi } from "../../../api/game.api";

export const useCreateGame = () => {
    const [loading, setLoading] = useState(false);

    const createGame = async (): Promise<GameSessionResponse | null> => {
        try {
            setLoading(true);
            const game = await gameApi.createGame({
                code: null,
                redTeamName: null,
                blueTeamName: null,
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

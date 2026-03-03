import { useState } from "react";
import type { GameSessionResponse, JoinGameRequest } from "../../../api/types";
import { gameApi } from "../../../api/game.api";

export const useJoinGame = () => {
    const [loading, setLoading] = useState(false);

    const joinGame = async (code: string, data: JoinGameRequest): Promise<GameSessionResponse | null> => {
        try {
            setLoading(true);
            const game = await gameApi.joinGame(code, data);
            return game;
        } catch (err) {
            console.error("Failed to create game:", err);
            return null;
        } finally {
            setLoading(false);
        }
    };

    return { joinGame, loading };
};

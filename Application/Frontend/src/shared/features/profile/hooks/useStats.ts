import { useState } from "react";
import { statsApi } from "../../../api/stats.api";
import type { LeaderboardResponse, StatsResponse } from "../../../api/types";

export const useStats = () => {
    const [loading, setLoading] = useState(false);

    const getStats = async (): Promise<StatsResponse | null> => {
        try {
            setLoading(true);
            const stats = await statsApi.getStats();
            return stats;
        } catch (err) {
            console.error("Failed to get stats:", err);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const getLeaderboard = async (): Promise<LeaderboardResponse | null> => {
        try {
            setLoading(true);
            const stats = await statsApi.getLeaderboard();
            return stats;
        } catch (err) {
            console.error("Failed to get leaderboard:", err);
            return null;
        } finally {
            setLoading(false);
        }
    };

    return { getStats, getLeaderboard, loading };
};

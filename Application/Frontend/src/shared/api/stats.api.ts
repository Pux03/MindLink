import { apiClient } from "./client";
import type { LeaderboardResponse, StatsResponse } from "./types";

export const statsApi = {
    getStats: async () => {
        const response = await apiClient.get<StatsResponse>(
            "/Stats"
        );
        console.log(response);
        return response.data;
    },

    getLeaderboard: async () => {
        const response = await apiClient.get<LeaderboardResponse>(
            "/Stats/leaderboard"
        );
        console.log(response);
        return response.data;
    }
};

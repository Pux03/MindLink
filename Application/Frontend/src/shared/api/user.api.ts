import { apiClient } from "./client";
import type { LoginRequest, RegisterRequest, UserResponse } from "./types";

export const userApi = {
    login: async (data: LoginRequest) => {
        const response = await apiClient.post<UserResponse>(
            "/auth/login",
            data
        );
        return response.data;
    },

    register: async (data: RegisterRequest) => {
        const response = await apiClient.post<UserResponse>(
            `/auth/register`,
            data
        );
        return response.data;
    },
};

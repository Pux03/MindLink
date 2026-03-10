import { apiClient } from "./client";
import type { BaseApiResponse, LoginRequest, RegisterRequest, UserResponse } from "./types";

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

    changeUsername: async (newUsername: string) => {
        console.log({ newUsername: newUsername });
        const response = await apiClient.put<BaseApiResponse>(
            `/User/username`,
            { newUsername: newUsername }
        );
        console.log(response)
        if (response.status === 204) {
            return { success: true, message: "Username changed", data: null, errors: [] } as BaseApiResponse;
        }
        return response.data;
    },

    changePassword: async (currentPassword: string, newPassword: string) => {
        const response = await apiClient.put<BaseApiResponse>(
            `/User/password`,
            { currentPassword, newPassword }
        );
        if (response.status === 204) {
            return { success: true, message: "Password changed", data: null, errors: [] } as BaseApiResponse;
        }
        return response.data;
    }
};

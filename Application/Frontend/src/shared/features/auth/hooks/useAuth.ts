import { useState } from "react";
import type { BaseApiResponse, LoginRequest, RegisterRequest, UserResponse } from "../../../api/types";
import { userApi } from "../../../api/user.api";
export const useAuth = () => {
    const [loading, setLoading] = useState(false);

    const login = async (data: LoginRequest): Promise<UserResponse | null> => {
        try {
            setLoading(true);
            const user = await userApi.login(data);
            setToken(user.data.token);
            parseToken(user.data.token);
            return user;
        } catch (err) {
            console.error("Failed to login:", err);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const register = async (data: RegisterRequest): Promise<UserResponse | null> => {
        try {
            setLoading(true);
            const user = await userApi.register(data);
            setToken(user.data.token);
            parseToken(user.data.token);
            return user;
        } catch (err) {
            console.error("Failed to register:", err);
            return null;
        } finally {
            setLoading(false);
        }
    }

    const changeUsername = async (data: string): Promise<BaseApiResponse | null> => {
        try {
            setLoading(true);
            const response = await userApi.changeUsername(data);
            const userJson = localStorage.getItem("user");
            if (userJson) {
                const userObj = JSON.parse(userJson);

                userObj.username = data;

                localStorage.setItem("user", JSON.stringify(userObj));
            }
            return response;
        } catch (err) {
            console.error("Failed to change username: ", err);
            return null;
        } finally {
            setLoading(false);
        }
    }

    const changePassword = async (currentPassword: string, newPassword: string): Promise<BaseApiResponse | null> => {
        try {
            setLoading(true);
            const response = await userApi.changePassword(currentPassword, newPassword);
            logout();
            return response;
        } catch (err) {
            console.error("Failed to change username: ", err);
            return null;
        } finally {
            setLoading(false);
        }
    }

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("game");
    };

    const setToken = (token: string) => {
        if (token) {
            localStorage.setItem("token", token);
        }
    }
    const parseToken = (token: string) => {
        if (token) {
            const payload = JSON.parse(atob(token.split(".")[1]))
            localStorage.setItem("user", JSON.stringify(payload));
        }
    }
    return { login, register, logout, changeUsername, changePassword, loading };
};

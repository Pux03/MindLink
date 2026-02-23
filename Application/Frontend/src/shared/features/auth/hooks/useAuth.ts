import { useState } from "react";
import type { LoginRequest, RegisterRequest, UserResponse } from "../../../api/types";
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
    return { login, register, loading };
};

import { useState } from "react";
import type { LoginRequest, RegisterRequest, UserResponse } from "../../../api/types";
import { userApi } from "../../../api/user.api";
export const useAuth = () => {
    const [loading, setLoading] = useState(false);

    const login = async (data: LoginRequest): Promise<UserResponse | null> => {
        try {
            setLoading(true);
            const user = await userApi.login(data);
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
            return user;
        } catch (err) {
            console.error("Failed to register:", err);
            return null;
        } finally {
            setLoading(false);
        }
    }
    return { login, register, loading };
};

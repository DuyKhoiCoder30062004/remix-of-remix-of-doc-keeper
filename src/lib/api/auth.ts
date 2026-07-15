import { api, setAuthToken } from "./client";
import type { AuthResponse, User } from "./types";

// Endpoints under /api/v1/auth
export const authApi = {
  async register(input: { name: string; email: string; password: string }): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/auth/register", input);
    setAuthToken(data.token);
    return data;
  },

  async login(input: { email: string; password: string }): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/auth/login", input);
    setAuthToken(data.token);
    return data;
  },

  async logout(): Promise<void> {
    try {
      await api.post("/auth/logout");
    } finally {
      setAuthToken(null);
    }
  },

  async requestPasswordReset(email: string): Promise<void> {
    await api.post("/auth/password/forgot", { email });
  },

  async resetPassword(input: { token: string; password: string }): Promise<void> {
    await api.post("/auth/password/reset", input);
  },

  async me(): Promise<User> {
    const { data } = await api.get<User>("/auth/me");
    return data;
  },
};

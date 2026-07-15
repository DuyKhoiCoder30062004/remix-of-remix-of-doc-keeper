import { useCallback, useEffect, useState } from "react";
import { authApi, getAuthToken, type User } from "@/lib/api";

// Lightweight auth hook backed by the Spring Boot /api/v1/auth endpoints.
// Swap this into route guards once the backend is live.
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(!!getAuthToken());

  useEffect(() => {
    let cancelled = false;
    if (!getAuthToken()) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then((u) => !cancelled && setUser(u))
      .catch(() => !cancelled && setUser(null))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await authApi.register({ name, email, password });
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === "ADMIN",
    login,
    register,
    logout,
  };
}

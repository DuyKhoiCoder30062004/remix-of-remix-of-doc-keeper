import { api } from "./client";
import type { Role, User } from "./types";

// Endpoints under /api/v1/users (admin-only on the backend)
export const usersApi = {
  async list(params?: { q?: string }): Promise<User[]> {
    const { data } = await api.get<User[]>("/users", { params });
    return data;
  },

  async get(userId: string): Promise<User> {
    const { data } = await api.get<User>(`/users/${userId}`);
    return data;
  },

  async updateRole(userId: string, role: Role): Promise<User> {
    const { data } = await api.patch<User>(`/users/${userId}/role`, { role });
    return data;
  },

  async remove(userId: string): Promise<void> {
    await api.delete(`/users/${userId}`);
  },

  async exportAuditLogs(): Promise<Blob> {
    const { data } = await api.get(`/users/audit/export`, { responseType: "blob" });
    return data as Blob;
  },
};

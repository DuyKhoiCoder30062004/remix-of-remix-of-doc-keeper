import { api } from "./client";
import type { AccessType, Permission } from "./types";

// Endpoints under /api/v1/permissions
export const permissionsApi = {
  async listForDocument(docId: string): Promise<Permission[]> {
    const { data } = await api.get<Permission[]>("/permissions", { params: { doc_id: docId } });
    return data;
  },

  async grant(input: { doc_id: string; user_id: string; access_type: AccessType }): Promise<Permission> {
    const { data } = await api.post<Permission>("/permissions", input);
    return data;
  },

  async update(permId: string, access_type: AccessType): Promise<Permission> {
    const { data } = await api.patch<Permission>(`/permissions/${permId}`, { access_type });
    return data;
  },

  async revoke(permId: string): Promise<void> {
    await api.delete(`/permissions/${permId}`);
  },
};

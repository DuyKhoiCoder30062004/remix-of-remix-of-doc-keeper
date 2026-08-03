import { api } from "./client";
import type { AccessType, Permission } from "./types";

function normalizeAccessType(value: unknown): AccessType {
  const v = typeof value === "string" ? value.trim().toUpperCase() : "";
  if (v === "OWNER" || v === "EDITOR" || v === "VIEWER") return v;
  return "VIEWER";
}

function mapPermission(raw: any): Permission {
  return {
    perm_id: String(raw?.perm_id ?? raw?.permId ?? ""),
    doc_id: Number(raw?.doc_id ?? raw?.docId ?? 0),
    user_id: Number(raw?.user_id ?? raw?.userId ?? 0),
    user_name: raw?.user_name ?? raw?.userName,
    user_email: raw?.user_email ?? raw?.userEmail,
    access_type: normalizeAccessType(raw?.access_type ?? raw?.accessType),
  };
}

// Endpoints under /api/v1/permissions
export const permissionsApi = {
  async listForDocument(docId: string): Promise<Permission[]> {
    const { data } = await api.get<any[]>("/permissions", { params: { doc_id: docId } });
    return Array.isArray(data) ? data.map(mapPermission) : [];
  },

  async grant(input: { doc_id: string; user_id: string; access_type: AccessType }): Promise<Permission> {
    const { data } = await api.post<any>("/permissions", input);
    return mapPermission(data);
  },

  async update(permId: string, access_type: AccessType): Promise<Permission> {
    const { data } = await api.patch<any>(`/permissions/${permId}`, { access_type });
    return mapPermission(data);
  },

  async revoke(permId: string): Promise<void> {
    await api.delete(`/permissions/${permId}`);
  },
};

import { api } from "./client";
import type { SharingRequest, AccessType } from "./types";

function normalizeAccessType(value: unknown): AccessType {
  const v = typeof value === "string" ? value.trim().toUpperCase() : "";
  if (v === "OWNER" || v === "EDITOR" || v === "VIEWER") return v;
  return "VIEWER";
}

function normalizeStatus(value: unknown): SharingRequest["status"] {
  const v = typeof value === "string" ? value.trim().toUpperCase() : "";
  if (v === "PENDING" || v === "APPROVED" || v === "REJECTED") return v;
  return "PENDING";
}

function mapSharingRequest(raw: any): SharingRequest {
  const nestedRequester = raw?.requester ?? raw?.requestedBy ?? raw?.user;
  const nestedOwner = raw?.owner ?? raw?.documentOwner;

  return {
    request_id: String(raw?.request_id ?? raw?.requestId ?? ""),
    doc_id: raw?.doc_id ?? raw?.docId,
    folder_id: raw?.folder_id ?? raw?.folderId,
    document_title: raw?.document_title ?? raw?.documentTitle,
    folder_name: raw?.folder_name ?? raw?.folderName,
    requester_id: Number(raw?.requester_id ?? raw?.requesterId ?? nestedRequester?.user_id ?? nestedRequester?.userId ?? 0),
    requester_name: raw?.requester_name ?? raw?.requesterName ?? nestedRequester?.name,
    requester_email: raw?.requester_email ?? raw?.requesterEmail ?? nestedRequester?.email,
    owner_id: raw?.owner_id ?? raw?.ownerId ?? nestedOwner?.user_id ?? nestedOwner?.userId,
    owner_name: raw?.owner_name ?? raw?.ownerName ?? nestedOwner?.name,
    permission: normalizeAccessType(raw?.permission),
    status: normalizeStatus(raw?.status),
    requested_at: String(raw?.requested_at ?? raw?.requestedAt ?? new Date().toISOString()),
  };
}

// Endpoints under /api/v1/sharing-requests
export const sharingApi = {
  // Requester creates a new access request
  async request(params: { doc_id?: string; folder_id?: string; user_id: string; permission: AccessType }): Promise<SharingRequest> {
    // Backend expects requester_id as the recipient user id in this flow.
    const payload = {
      doc_id: params.doc_id,
      folder_id: params.folder_id,
      requester_id: params.user_id,
      permission: params.permission,
    };
    const { data } = await api.post<any>("/sharing-requests", payload);
    return mapSharingRequest(data);
  },

  // Owner/admin lists pending requests (optionally filter by doc)
  async listPending(params?: { doc_id?: string }): Promise<SharingRequest[]> {
    const { data } = await api.get<any[]>("/sharing-requests", {
      params: { status: "PENDING", ...params },
    });
    return Array.isArray(data) ? data.map(mapSharingRequest) : [];
  },

  // Admin can view all sharing requests for audit/log purposes.
  async listAll(params?: { doc_id?: string }): Promise<SharingRequest[]> {
    const { data } = await api.get<any[]>("/sharing-requests", {
      params,
    });
    return Array.isArray(data) ? data.map(mapSharingRequest) : [];
  },

  async approve(requestId: string): Promise<SharingRequest> {
    const { data } = await api.post<any>(`/sharing-requests/${requestId}/approve`);
    return mapSharingRequest(data);
  },

  async reject(requestId: string): Promise<SharingRequest> {
    const { data } = await api.post<any>(`/sharing-requests/${requestId}/reject`);
    return mapSharingRequest(data);
  },
};

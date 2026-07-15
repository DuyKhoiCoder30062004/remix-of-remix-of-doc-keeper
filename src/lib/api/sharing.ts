import { api } from "./client";
import type { SharingRequest } from "./types";

// Endpoints under /api/v1/sharing-requests
export const sharingApi = {
  // Requester creates a new access request
  async request(doc_id: string): Promise<SharingRequest> {
    const { data } = await api.post<SharingRequest>("/sharing-requests", { doc_id });
    return data;
  },

  // Owner/admin lists pending requests (optionally filter by doc)
  async listPending(params?: { doc_id?: string }): Promise<SharingRequest[]> {
    const { data } = await api.get<SharingRequest[]>("/sharing-requests", {
      params: { status: "PENDING", ...params },
    });
    return data;
  },

  async approve(requestId: string): Promise<SharingRequest> {
    const { data } = await api.post<SharingRequest>(`/sharing-requests/${requestId}/approve`);
    return data;
  },

  async reject(requestId: string): Promise<SharingRequest> {
    const { data } = await api.post<SharingRequest>(`/sharing-requests/${requestId}/reject`);
    return data;
  },
};

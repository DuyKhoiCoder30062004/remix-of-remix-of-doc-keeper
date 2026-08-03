import { api } from "./client";
import type { AuditLogEntry, DocumentMeta } from "./types";
import { rememberUploadedSize } from "@/lib/document-metadata";

// Endpoints under /api/v1/documents
export const documentsApi = {
  async list(params?: { folder_id?: string | null; q?: string }): Promise<DocumentMeta[]> {
    const { data } = await api.get<DocumentMeta[]>("/documents", { params });
    return data;
  },

  // Case-insensitive partial name search
  async search(q: string): Promise<DocumentMeta[]> {
    const { data } = await api.get<DocumentMeta[]>("/documents/search", { params: { q } });
    return data;
  },

  async get(docId: string): Promise<DocumentMeta> {
    const { data } = await api.get<DocumentMeta>(`/documents/${docId}`);
    return data;
  },

  async upload(input: {
    file: File;
    folder_id?: string | null;
    title?: string;
    onProgress?: (pct: number) => void;
  }): Promise<DocumentMeta> {
    const form = new FormData();
    form.append("file", input.file);
    if (input.folder_id) form.append("folder_id", input.folder_id);
    if (input.title) form.append("title", input.title);

    const { data } = await api.post<DocumentMeta>("/documents", form, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => {
        if (input.onProgress && e.total) {
          input.onProgress(Math.round((e.loaded * 100) / e.total));
        }
      },
    });
    rememberUploadedSize(data, input.file.size);
    return data;
  },

  async rename(docId: string, title: string): Promise<DocumentMeta> {
    const { data } = await api.patch<DocumentMeta>(`/documents/${docId}`, { title });
    return data;
  },

  async move(docId: string, folder_id: string | null): Promise<DocumentMeta> {
    const { data } = await api.patch<DocumentMeta>(`/documents/${docId}/move`, { folder_id });
    return data;
  },

  async remove(docId: string): Promise<void> {
    await api.delete(`/documents/${docId}`);
  },

  // Returns a blob for direct download
  async download(docId: string): Promise<Blob> {
    const { data } = await api.get(`/documents/${docId}/download`, { responseType: "blob" });
    return data as Blob;
  },

  async auditLog(docId: string): Promise<AuditLogEntry[]> {
    const { data } = await api.get<AuditLogEntry[]>(`/documents/${docId}/audit`);
    return data;
  },
};

import { api } from "./client";
import type { Folder } from "./types";

// Endpoints under /api/v1/folders
export const foldersApi = {
  async list(): Promise<Folder[]> {
    const { data } = await api.get<Folder[]>("/folders");
    return data;
  },

  async get(folderId: string): Promise<Folder> {
    const { data } = await api.get<Folder>(`/folders/${folderId}`);
    return data;
  },

  async create(name: string): Promise<Folder> {
    const { data } = await api.post<Folder>("/folders", { name });
    return data;
  },

  async rename(folderId: string, name: string): Promise<Folder> {
    const { data } = await api.patch<Folder>(`/folders/${folderId}`, { name });
    return data;
  },

  async remove(folderId: string): Promise<void> {
    await api.delete(`/folders/${folderId}`);
  },
};

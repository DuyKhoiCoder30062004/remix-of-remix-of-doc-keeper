// In-memory dataset backing the mock API adapter.
// Shape mirrors the relational schema documented in INTEGRATION_PLAN.md.
import type {
  AuditLogEntry,
  DocumentMeta,
  Folder,
  Permission,
  SharingRequest,
  User,
} from "@/lib/api/types";
import {
  mockAuditLog,
  mockDocuments,
  mockFolders,
  mockPermissions,
  mockSharingRequests,
  mockUsers,
} from "./seed-data";

export interface MockAuthUser extends User {
  password: string;
}

// Deterministic ids so screens can be linked without seeds drifting.
export const users: MockAuthUser[] = mockUsers.map((u) => ({ ...u }));
export const folders: Folder[] = mockFolders.map((f) => ({ ...f }));
export const documents: DocumentMeta[] = mockDocuments.map((d) => ({
  ...d,
  metadata: { ...d.metadata },
}));
export const permissions: Permission[] = mockPermissions.map((p) => ({ ...p }));
export const sharingRequests: SharingRequest[] = mockSharingRequests.map((r) => ({ ...r }));
export const auditLog: AuditLogEntry[] = mockAuditLog.map((entry) => ({ ...entry }));

export function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export function publicUser(u: MockAuthUser): User {
  const { password: _pw, ...rest } = u;
  return rest;
}

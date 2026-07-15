// Domain types mirroring the Spring Boot relational schema.
// These are the DTO shapes exchanged with /api/v1/* endpoints.

export type Role = "ADMIN" | "USER";
export type AccessType = "OWNER" | "EDITOR" | "VIEWER";
export type RequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface User {
  user_id: string;
  name: string;
  email: string;
  role: Role;
  created_at: string;
}

export interface Folder {
  folder_id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

export interface DocumentMeta {
  doc_id: string;
  title: string;
  owner_id: string;
  owner_name?: string;
  folder_id: string | null;
  metadata: {
    mime_type?: string;
    size_bytes?: number;
    extension?: string;
    [k: string]: unknown;
  };
  created_at: string;
  updated_at: string;
}

export interface Permission {
  perm_id: string;
  doc_id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  access_type: AccessType;
}

export interface SharingRequest {
  request_id: string;
  doc_id: string;
  requester_id: string;
  requester_name?: string;
  status: RequestStatus;
  requested_at: string;
}

export interface AuditLogEntry {
  log_id: string;
  doc_id: string;
  actor_id: string;
  actor_name?: string;
  action: string;
  occurred_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

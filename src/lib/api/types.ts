// Domain types mirroring the Spring Boot relational schema.
// These are the DTO shapes exchanged with /api/v1/* endpoints.

export type Role = "ADMIN" | "USER";
export type AccessType = "OWNER" | "EDITOR" | "VIEWER";
export type RequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface User {
  user_id: number;
  name: string;
  email: string;
  role: Role;
  created_at: string;
}

export interface Folder {
  folder_id: number;
  name: string;
  owner_id: number;
  created_at: string;
}

export interface DocumentOwner {
  userId?: number;
  user_id?: number;
  name?: string;
  email?: string;
  role?: string;
}

export interface DocumentMeta {
  // Mock / snake_case format
  doc_id?: number;
  owner_id?: number;
  owner_name?: string;
  folder_id?: number | null;
  created_at?: string;
  updated_at?: string;
  // Spring Boot / camelCase format
  docId?: number;
  updatedAt?: string | number[];
  createdAt?: string | number[];
  // owner: flat name OR nested UserManager
  owner?: DocumentOwner;
  // folder: may be nested
  folder?: { folderId?: number; folder_id?: number; name?: string } | null;
  // Common
  title: string;
  // metadata: object (mock) OR raw JSON string (Spring Boot jsonb String field)
  metadata:
    | string
    | {
        mime_type?: string;
        size_bytes?: number;
        extension?: string;
        [k: string]: unknown;
      };
}

export interface Permission {
  perm_id: string;
  doc_id: number;
  user_id: number;
  user_name?: string;
  user_email?: string;
  access_type: AccessType;
}

export interface SharingRequest {
  request_id: string;
  doc_id?: number;
  folder_id?: number;
  document_title?: string;
  folder_name?: string;
  requester_id: number;
  requester_name?: string;
  requester_email?: string;
  owner_id?: number;
  owner_name?: string;
  permission?: AccessType;
  status: RequestStatus;
  requested_at: string;
}

export interface AuditLogEntry {
  log_id: string;
  doc_id: number;
  actor_id: number;
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

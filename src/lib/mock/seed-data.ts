import type {
  AuditLogEntry,
  DocumentMeta,
  Folder,
  Permission,
  SharingRequest,
  User,
} from "@/lib/api/types";

export interface MockAuthUser extends User {
  password: string;
}

export const mockUsers: MockAuthUser[] = [
  {
    user_id: "u_admin",
    name: "Marcus Thorne",
    email: "admin@firm.com",
    role: "ADMIN",
    password: "admin123",
    created_at: "2024-01-04T09:00:00Z",
  },
  {
    user_id: "u_sarah",
    name: "Sarah Jenkins",
    email: "sarah@firm.com",
    role: "USER",
    password: "sarah123",
    created_at: "2024-02-11T09:00:00Z",
  },
  {
    user_id: "u_elena",
    name: "Elena Rodriguez",
    email: "elena@firm.com",
    role: "USER",
    password: "elena123",
    created_at: "2024-03-02T09:00:00Z",
  },
  {
    user_id: "u_david",
    name: "David Chen",
    email: "david@firm.com",
    role: "USER",
    password: "david123",
    created_at: "2024-04-19T09:00:00Z",
  },
  {
    user_id: "u_priya",
    name: "Priya Nair",
    email: "priya@firm.com",
    role: "USER",
    password: "priya123",
    created_at: "2024-05-22T09:00:00Z",
  },
];

export const mockFolders: Folder[] = [
  { folder_id: "f_finance", name: "Finance", owner_id: "u_admin", created_at: "2024-06-01T09:00:00Z" },
  { folder_id: "f_hr", name: "HR", owner_id: "u_admin", created_at: "2024-06-02T09:00:00Z" },
  { folder_id: "f_legal", name: "Legal", owner_id: "u_sarah", created_at: "2024-06-03T09:00:00Z" },
];

export const mockDocuments: DocumentMeta[] = [
  {
    doc_id: "d_1",
    title: "Q4_Audit_Report.pdf",
    owner_id: "u_sarah",
    owner_name: "Sarah Jenkins",
    folder_id: "f_finance",
    metadata: { mime_type: "application/pdf", size_bytes: 4_200_000, extension: "PDF" },
    created_at: "2024-10-08T10:00:00Z",
    updated_at: "2024-10-14T12:04:00Z",
  },
  {
    doc_id: "d_2",
    title: "Payroll_Master_Sheet_2024.xlsx",
    owner_id: "u_admin",
    owner_name: "Marcus Thorne",
    folder_id: "f_hr",
    metadata: { mime_type: "application/vnd.ms-excel", size_bytes: 1_800_000, extension: "XLS" },
    created_at: "2024-09-30T10:00:00Z",
    updated_at: "2024-10-01T10:00:00Z",
  },
  {
    doc_id: "d_3",
    title: "Service_Agreement_v4.pdf",
    owner_id: "u_sarah",
    owner_name: "Sarah Jenkins",
    folder_id: "f_legal",
    metadata: { mime_type: "application/pdf", size_bytes: 892_000, extension: "PDF" },
    created_at: "2024-10-01T10:00:00Z",
    updated_at: "2024-10-05T10:00:00Z",
  },
  {
    doc_id: "d_4",
    title: "Employee_Handbook.docx",
    owner_id: "u_elena",
    owner_name: "Elena Rodriguez",
    folder_id: "f_hr",
    metadata: { mime_type: "application/msword", size_bytes: 640_000, extension: "DOC" },
    created_at: "2024-08-15T10:00:00Z",
    updated_at: "2024-09-01T10:00:00Z",
  },
  {
    doc_id: "d_5",
    title: "Board_Meeting_Photo.png",
    owner_id: "u_admin",
    owner_name: "Marcus Thorne",
    folder_id: null,
    metadata: { mime_type: "image/png", size_bytes: 2_100_000, extension: "IMG" },
    created_at: "2024-10-10T10:00:00Z",
    updated_at: "2024-10-10T10:00:00Z",
  },
];

export const mockPermissions: Permission[] = [
  { perm_id: "p_1", doc_id: "d_3", user_id: "u_sarah", user_name: "Sarah Jenkins", user_email: "sarah@firm.com", access_type: "OWNER" },
  { perm_id: "p_2", doc_id: "d_3", user_id: "u_david", user_name: "David Chen", user_email: "david@firm.com", access_type: "EDITOR" },
  { perm_id: "p_3", doc_id: "d_3", user_id: "u_priya", user_name: "Priya Nair", user_email: "priya@firm.com", access_type: "VIEWER" },
  { perm_id: "p_4", doc_id: "d_1", user_id: "u_sarah", user_name: "Sarah Jenkins", user_email: "sarah@firm.com", access_type: "OWNER" },
  { perm_id: "p_5", doc_id: "d_2", user_id: "u_admin", user_name: "Marcus Thorne", user_email: "admin@firm.com", access_type: "OWNER" },
];

export const mockSharingRequests: SharingRequest[] = [
  {
    request_id: "sr_1",
    doc_id: "d_3",
    folder_id: undefined,
    document_title: "Service_Agreement_v4.pdf",
    folder_name: undefined,
    requester_id: "u_elena",
    requester_name: "Elena Rodriguez",
    requester_email: "elena@firm.com",
    owner_id: "u_sarah",
    owner_name: "Sarah Jenkins",
    permission: "EDITOR",
    status: "PENDING",
    requested_at: "2024-10-14T08:00:00Z",
  },
  {
    request_id: "sr_2",
    doc_id: "d_1",
    folder_id: undefined,
    document_title: "Q4_Audit_Report.pdf",
    folder_name: undefined,
    requester_id: "u_david",
    requester_name: "David Chen",
    requester_email: "david@firm.com",
    owner_id: "u_sarah",
    owner_name: "Sarah Jenkins",
    permission: "VIEWER",
    status: "APPROVED",
    requested_at: "2024-10-10T10:00:00Z",
  },
];

export const mockAuditLog: AuditLogEntry[] = [
  { log_id: "a_1", doc_id: "d_3", actor_id: "u_admin", actor_name: "Marcus Thorne", action: "MODIFIED", occurred_at: "2024-10-14T12:04:00Z" },
  { log_id: "a_2", doc_id: "d_3", actor_id: "u_elena", actor_name: "Elena Rodriguez", action: "DOWNLOADED", occurred_at: "2024-10-12T09:30:00Z" },
  { log_id: "a_3", doc_id: "d_3", actor_id: "u_sarah", actor_name: "Sarah Jenkins", action: "PERMISSION_CHANGED", occurred_at: "2024-10-10T14:20:00Z" },
  { log_id: "a_4", doc_id: "d_3", actor_id: "u_sarah", actor_name: "Sarah Jenkins", action: "UPLOADED", occurred_at: "2024-10-08T10:00:00Z" },
];

export const demoAuthAccounts = [
  { label: "Admin", email: "admin@firm.com", password: "admin123" },
  { label: "User", email: "sarah@firm.com", password: "sarah123" },
] as const;

export const defaultAuthValues = {
  email: demoAuthAccounts[0].email,
  password: demoAuthAccounts[0].password,
};

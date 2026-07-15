# VaultSystem — Mock Data Prototype

The frontend now runs end-to-end on a self-contained **mock backend** so every
MVP flow (auth, search, document CRUD, sharing, permissions, admin) is
demonstrable without a Spring Boot server. Data lives in memory and resets on
every page reload — treat it as dependency-injected placeholder state that
maps 1:1 to the relational schema.

---

## 1. How injection works

```
UI screens
   │
   ▼
src/lib/api/*        ← unchanged; screens call these
   │  (Axios)
   ▼
src/lib/mock/install.ts   ← axios-mock-adapter intercepts /api/v1/*
   │
   ▼
src/lib/mock/db.ts        ← in-memory arrays for User, Folder,
                            Document, Permission, SharingRequest, AuditLog
```

The adapter is installed once, in the browser, from `src/lib/api/client.ts`:

```ts
if (typeof window !== "undefined" && import.meta.env.VITE_USE_MOCK !== "false") {
  void import("@/lib/mock/install").then(({ installMockApi }) => installMockApi());
}
```

Set `VITE_USE_MOCK=false` in `.env.local` when the Spring Boot backend is
ready — no other frontend code changes are required.

---

## 2. Seeded accounts

| Role  | Email             | Password    |
|-------|-------------------|-------------|
| ADMIN | admin@firm.com    | admin123    |
| USER  | sarah@firm.com    | sarah123    |
| USER  | elena@firm.com    | elena123    |
| USER  | david@firm.com    | david123    |
| USER  | priya@firm.com    | priya123    |

Bearer tokens are synthesized as `mock.<user_id>` and stored in
`localStorage['vault.auth.token']`.

---

## 3. Seeded content

- **Folders:** Finance, HR, Legal
- **Documents (5):** Q4_Audit_Report.pdf, Payroll_Master_Sheet_2024.xlsx,
  Service_Agreement_v4.pdf, Employee_Handbook.docx, Board_Meeting_Photo.png
- **Permissions:** OWNER/EDITOR/VIEWER seeded on Service_Agreement_v4.pdf
- **Sharing request:** Elena → Service_Agreement_v4.pdf (PENDING)
- **Audit log:** 4 entries against Service_Agreement_v4.pdf

Every mutation (upload, rename, move, delete, permission grant/update/revoke,
share-request approve/reject, role change) updates the in-memory store and
invalidates the relevant React Query keys, so the UI reflects changes
immediately.

---

## 4. MVP flow checklist

- [x] **Auth** — register / login / logout; unauthenticated users are pushed
      to `/auth`; token in localStorage.
- [x] **Search** — dashboard search box calls `/documents?q=` with
      case-insensitive partial match (debounced 200 ms).
- [x] **Document CRUD** — upload (with progress), rename, delete from
      dashboard, delete + rename from detail view, download blob.
- [x] **Role-based UI** — Admin Panel link and route are hidden/redirected
      for non-admins.
- [x] **Sharing permissions** — OWNER row locked; EDITOR/VIEWER dropdowns
      mutate via `/permissions/{id}`.
- [x] **Access requests** — approve creates a VIEWER permission; reject
      updates the request status.
- [x] **Audit log** — rendered per document.
- [x] **Admin** — user list, role change, CSV export via blob download.

---

## 5. Wired API surface

| Module      | Endpoint hit by UI                                        | Screen                     |
|-------------|-----------------------------------------------------------|----------------------------|
| auth        | POST /auth/login, /auth/register, /auth/logout, GET /auth/me | /auth, app-shell         |
| documents   | GET /documents, /documents/{id}, /documents/{id}/audit    | /, /documents/$id          |
|             | POST /documents (multipart), GET /documents/{id}/download | /upload, /documents/$id    |
|             | PATCH /documents/{id}, DELETE /documents/{id}             | /documents/$id, /          |
| permissions | GET /permissions?doc_id=, PATCH /permissions/{id}         | /documents/$id             |
| sharing     | GET /sharing-requests?doc_id=, POST /{id}/approve /reject | /documents/$id             |
| users       | GET /users, PATCH /users/{id}/role, GET /users/audit/export | /admin                   |

Everything else in `src/lib/api/*` (folders, sharing.request,
permissions.grant, users.remove) is also mocked and ready to wire into future
UI without additional backend work.

---

## 6. Cut-over to Spring Boot

1. Copy `.env.example` → `.env.local` and set:
   ```
   VITE_USE_MOCK=false
   VITE_API_BASE_URL=http://localhost:8080
   ```
2. Ensure the Spring Boot service exposes the endpoints and DTO shapes in
   `INTEGRATION_PLAN.md` (snake_case JSON, `Authorization: Bearer <jwt>`).
3. Delete `src/lib/mock/` when you no longer want the bundle to include it
   (or leave it — it's tree-shaken when `VITE_USE_MOCK !== "true"` because
   the import is dynamic).
4. Run the test checklist in `INTEGRATION_PLAN.md §6`.

No component code needs to change during cut-over — the same
`documentsApi`, `usersApi`, etc. modules keep working; only the transport
underneath swaps.

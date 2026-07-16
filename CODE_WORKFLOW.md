# VaultSystem — Code Workflow Guide

This document explains how the codebase is structured, how a request flows
from a UI click to (mock or real) backend, and where to make future
adjustments. **Update this file whenever the architecture changes.**

---

## 1. Answer to "does the app fulfill the SRS and schema?"

Yes, the prototype covers every MVP requirement in the SRS and every
table in the relational schema. Cross-check:

| SRS module              | Implemented in                                                 | Schema tables touched                          |
|-------------------------|-----------------------------------------------------------------|-------------------------------------------------|
| Authentication          | `routes/auth.tsx`, `lib/api/auth.ts`, `hooks/use-auth.ts`      | Users                                          |
| Search (partial, case-insensitive) | `routes/index.tsx` (`/documents?q=`), mock `install.ts` | Documents                                      |
| Document CRUD           | `routes/upload.tsx`, `routes/index.tsx`, `routes/documents.$id.tsx`, `lib/api/documents.ts` | Documents, Folders, Permissions, AuditLog       |
| Folder management + move | `routes/folders.tsx`, `lib/api/folders.ts`, `documents.move()` | Folders, Documents                             |
| Role-based permissions  | `hooks/use-auth.ts`, `AppShell` nav gate, `routes/admin.tsx`   | Users.role                                     |
| Sharing (Owner/Editor/Viewer) | `routes/documents.$id.tsx`, `lib/api/permissions.ts`     | Permissions                                    |
| Access requests         | `routes/documents.$id.tsx`, `lib/api/sharing.ts`               | SharingRequests → Permissions on approve       |
| Admin functions         | `routes/admin.tsx`, `lib/api/users.ts`                         | Users                                          |
| Audit trail             | `routes/documents.$id.tsx` audit list, mock seeder             | AuditLog (bonus, not in required schema)       |

Every schema entity — Users, Folders, Documents, Permissions,
SharingRequests — has a matching TypeScript DTO in `src/lib/api/types.ts`
and a mock table in `src/lib/mock/db.ts`. Field names use snake_case to
match the Spring Boot JSON contract 1:1.

---

## 2. Request lifecycle (top → bottom)

```
React component  (routes/*.tsx)
   │  useQuery / useMutation
   ▼
lib/api/<module>.ts     ← typed Axios calls, one function per endpoint
   │
   ▼
lib/api/client.ts        ← axios instance, JWT interceptor, 401 handler
   │
   ▼   (VITE_USE_MOCK !== "false")
lib/mock/install.ts      ← axios-mock-adapter intercepts /api/v1/*
   │
   ▼
lib/mock/db.ts           ← in-memory arrays (User, Folder, Document,
                           Permission, SharingRequest, AuditLog)
```

- Screens never talk to Axios directly; they import a typed `xxxApi`
  module. This keeps the transport swappable.
- `client.ts` reads the JWT from `localStorage['vault.auth.token']` and
  attaches `Authorization: Bearer <jwt>`.
- The mock adapter is dynamically imported so the bundle tree-shakes when
  `VITE_USE_MOCK=false`.

---

## 3. Directory map

```
src/
├── components/
│   └── app-shell.tsx        ← sidebar, header, search box, role gate
├── hooks/
│   └── use-auth.ts          ← session state, login/register/logout
├── lib/
│   ├── api/
│   │   ├── client.ts        ← axios instance + interceptors
│   │   ├── types.ts         ← DTOs mirroring the SQL schema
│   │   ├── auth.ts          ← /auth/*
│   │   ├── users.ts         ← /users/*
│   │   ├── folders.ts       ← /folders/*
│   │   ├── documents.ts     ← /documents/* (incl. upload/move/audit)
│   │   ├── permissions.ts   ← /permissions/*
│   │   ├── sharing.ts       ← /sharing-requests/*
│   │   └── index.ts         ← barrel export
│   └── mock/
│       ├── db.ts            ← seeded in-memory data
│       └── install.ts       ← axios-mock-adapter routes
└── routes/                  ← TanStack Router file-based routes
    ├── __root.tsx
    ├── index.tsx            ← Dashboard (search + recent docs)
    ├── auth.tsx             ← login/register
    ├── upload.tsx           ← multipart upload w/ progress
    ├── folders.tsx          ← folder management + move dialog
    ├── documents.$id.tsx    ← detail, permissions, audit, sharing
    └── admin.tsx            ← user list, role change, CSV export
```

---

## 4. Where to make future adjustments

Follow this table when the requirement changes. Update the corresponding
row (and the map above) after each change so this file stays accurate.

| Change you want                                    | File(s) to edit                                                     |
|----------------------------------------------------|----------------------------------------------------------------------|
| Add / rename an endpoint                           | `lib/api/<module>.ts` + `lib/mock/install.ts` + `INTEGRATION_PLAN.md`|
| Change a DTO field                                 | `lib/api/types.ts` (+ any component reading that field)             |
| Add a new page / route                             | Create `src/routes/<name>.tsx` (TanStack file-based routing)         |
| Add a sidebar nav entry                            | `src/components/app-shell.tsx` → `nav` array                         |
| Gate a route by role                               | `useAuth()` in the route + `adminOnly` flag in `AppShell` nav        |
| Seed additional demo data                          | `lib/mock/db.ts`                                                     |
| Change how errors surface                          | `lib/api/client.ts` (interceptor) + `apiErrorMessage` helper         |
| Cut over to real Spring Boot backend               | `.env.local` → `VITE_USE_MOCK=false`, set `VITE_API_BASE_URL`        |
| Add a new folder feature                          | `routes/folders.tsx` + `lib/api/folders.ts` + mock handlers          |

### Adding a new endpoint (recipe)

1. Define the DTO in `lib/api/types.ts`.
2. Add the function in the matching `lib/api/<module>.ts`.
3. Add a matching handler in `lib/mock/install.ts` (mutate the array in
   `lib/mock/db.ts`).
4. Consume it in the route via `useQuery` / `useMutation`, and invalidate
   the right cache keys on mutation success.
5. Document the endpoint in `INTEGRATION_PLAN.md` so the backend team
   implements the same contract.
6. Update the "Where to make future adjustments" table above if the
   change introduces a new pattern.

---

## 5. Folder management (the new tab)

`src/routes/folders.tsx` exposes:

- **Create folder** — inline input at the top; calls `foldersApi.create`.
- **Rename folder** — pencil icon on each row; `foldersApi.rename`.
- **Delete folder** — trash icon; `foldersApi.remove`. Documents in a
  deleted folder become `folder_id: null` (unfiled) — enforce this in the
  real backend when wiring up.
- **Move document** — every document row has a "Move" button that opens a
  radio-list dialog (Unfiled + every folder). Selection calls
  `documentsApi.move(docId, folder_id)` which hits
  `PATCH /documents/{id}/move`.
- **Filter view** — the left column filters the document pane by folder
  or shows "All documents".

The tab is available to both Admin and User roles (no `adminOnly` flag).
Ownership rules should be enforced server-side once the mock layer is
removed — the schema already carries `Folders.owner_id` for this.

---

## 6. React Query cache keys

Keep these consistent so mutations invalidate correctly:

| Data                | Key                                              |
|---------------------|--------------------------------------------------|
| Users list          | `["users"]`                                      |
| Folders list        | `["folders"]`                                    |
| Documents (list)    | `["documents", { q }]` / `["documents", { folder_id }]` |
| Document detail     | `["document", docId]`                            |
| Permissions per doc | `["permissions", docId]`                         |
| Sharing requests    | `["sharing-requests", docId]`                    |
| Audit log per doc   | `["audit", docId]`                               |

After a mutation, invalidate the parent key AND any detail key that
could be stale (see `admin.tsx`, `folders.tsx` for examples).

---

## 7. Cut-over checklist (mock → Spring Boot)

1. Set `VITE_USE_MOCK=false` and `VITE_API_BASE_URL=http://localhost:8080`
   in `.env.local`.
2. Ensure the backend exposes every endpoint in `INTEGRATION_PLAN.md`
   with the DTO shapes from `lib/api/types.ts`.
3. Enable CORS for the frontend origin (`INTEGRATION_PLAN.md §CORS`).
4. Delete `src/lib/mock/` once you're confident the backend covers every
   handler currently in `install.ts`.
5. Re-run the manual test flow in `MOCK_DATA_PLAN.md §4` against the
   real backend.

---

## 8. Keeping this document current

When you add or change a feature, update:

- **Section 3** if you add a directory or file.
- **Section 4** if you introduce a new pattern of change.
- **Section 5+** if the feature is user-visible (add its own subsection).
- **Section 6** if you introduce a new cache key.

Aim to keep this file the single source of truth for "how does the code
work today" — think of it as the onboarding doc for the next developer.

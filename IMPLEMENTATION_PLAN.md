# UI-only frontend with Spring Boot + PostgreSQL backend

This document describes a practical way to keep the frontend UI as-is while moving data handling to the Spring Boot backend connected to PostgreSQL.

## Objective

The frontend should remain responsible for:
- rendering screens
- handling user interaction
- calling API endpoints

The backend should be responsible for:
- authentication
- business rules
- persistence in PostgreSQL
- returning data to the frontend

## Recommended approach

### 1. Keep the frontend UI layer unchanged
The current route files in src/routes/ should remain the main UI surface.

These pages already represent the desired UI behavior:
- /auth
- /
- /folders
- /upload
- /documents/$id
- /admin

Do not replace them with database logic. They should continue to call the API layer.

### 2. Keep the API layer as the contract boundary
The frontend API modules already provide a good boundary:
- authApi
- documentsApi
- foldersApi
- usersApi
- permissionsApi
- sharingApi

These should remain the only frontend entry points for data access.

### 3. Use the mock layer only as temporary demo data
The current mock adapter should stay available for local UI development, but it should be treated as a temporary stand-in.

The mock data should live in:
- src/lib/mock/seed-data.ts

### 4. Switch to Spring Boot by disabling mock mode
Set:
- VITE_USE_MOCK=false

Then ensure the Spring Boot app is running and reachable at the configured base URL.

### 5. Make the Spring Boot backend return the same DTO shapes
The frontend expects specific response shapes. To keep the UI working without changes, the backend should return data in the same JSON structure as the TypeScript types in src/lib/api/types.ts.

These types should be treated as the frontend contract:
- User
- Folder
- DocumentMeta
- Permission
- SharingRequest
- AuditLogEntry
- AuthResponse

## Backend implementation guidance

### Authentication
Implement these endpoints:
- POST /api/v1/auth/register
- POST /api/v1/auth/login
- POST /api/v1/auth/logout
- GET /api/v1/auth/me

### Documents
Implement these endpoints:
- GET /api/v1/documents
- GET /api/v1/documents/search
- GET /api/v1/documents/{id}
- POST /api/v1/documents
- PATCH /api/v1/documents/{id}
- PATCH /api/v1/documents/{id}/move
- DELETE /api/v1/documents/{id}
- GET /api/v1/documents/{id}/download
- GET /api/v1/documents/{id}/audit

### Folders
Implement these endpoints:
- GET /api/v1/folders
- POST /api/v1/folders
- PATCH /api/v1/folders/{id}
- DELETE /api/v1/folders/{id}

### Users
Implement these endpoints:
- GET /api/v1/users
- PATCH /api/v1/users/{id}/role
- GET /api/v1/users/audit/export

### Permissions and sharing
Implement these endpoints:
- GET /api/v1/permissions
- POST /api/v1/permissions
- PATCH /api/v1/permissions/{id}
- DELETE /api/v1/permissions/{id}
- GET /api/v1/sharing-requests
- POST /api/v1/sharing-requests
- POST /api/v1/sharing-requests/{id}/approve
- POST /api/v1/sharing-requests/{id}/reject

## PostgreSQL mapping

A practical database design would be:
- users
- folders
- documents
- permissions
- sharing_requests
- audit_logs

Each entity should map to the frontend-facing fields already defined in src/lib/api/types.ts.

## How to keep the frontend stable

To avoid rewriting the UI later:
- keep the route components unchanged
- keep the API module names unchanged
- keep the response field names unchanged
- avoid introducing frontend-only state that replaces backend data

## Suggested rollout plan

1. Leave the UI as-is
2. Make the Spring Boot backend expose the expected endpoints
3. Connect it to PostgreSQL via application.properties
4. Disable the mock adapter
5. Test each route against real backend data
6. Only adjust the backend if response shapes differ

## Rollback plan

If you want to return to the current UI-only mock version:
- re-enable the mock adapter
- keep the seed data file available
- set VITE_USE_MOCK=true

This preserves the current front-end experience without losing the mock data layer.

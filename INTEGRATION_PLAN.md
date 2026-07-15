# VaultSystem — Frontend ⇄ Spring Boot Integration Plan

This document maps the current React (TanStack Start) UI to the future
Spring Boot REST API. It defines endpoints, DTOs, CORS setup, and the
step-by-step swap from dummy data to live API calls via Axios.

Base URL convention: `http://<host>:<port>/api/v1/<module>`
Auth: JWT bearer token in `Authorization: Bearer <token>` header.

---

## 1. Module → Endpoint Map

All paths are relative to `/api/v1`.

### 1.1 Auth — `/auth`
| Method | Path                    | Body / Params                     | Response         |
|--------|-------------------------|-----------------------------------|------------------|
| POST   | `/auth/register`        | `{ name, email, password }`       | `{ token, user }`|
| POST   | `/auth/login`           | `{ email, password }`             | `{ token, user }`|
| POST   | `/auth/logout`          | —                                 | 204              |
| POST   | `/auth/password/forgot` | `{ email }`                       | 204              |
| POST   | `/auth/password/reset`  | `{ token, password }`             | 204              |
| GET    | `/auth/me`              | —                                 | `User`           |

### 1.2 Users (admin) — `/users`
| Method | Path                       | Body / Params      | Response  |
|--------|----------------------------|--------------------|-----------|
| GET    | `/users?q=`                | `q` optional       | `User[]`  |
| GET    | `/users/{id}`              | —                  | `User`    |
| PATCH  | `/users/{id}/role`         | `{ role }`         | `User`    |
| DELETE | `/users/{id}`              | —                  | 204       |
| GET    | `/users/audit/export`      | —                  | CSV blob  |

### 1.3 Folders — `/folders`
| Method | Path              | Body      | Response  |
|--------|-------------------|-----------|-----------|
| GET    | `/folders`        | —         | `Folder[]`|
| GET    | `/folders/{id}`   | —         | `Folder`  |
| POST   | `/folders`        | `{ name }`| `Folder`  |
| PATCH  | `/folders/{id}`   | `{ name }`| `Folder`  |
| DELETE | `/folders/{id}`   | —         | 204       |

### 1.4 Documents — `/documents`
| Method | Path                              | Body / Params                | Response          |
|--------|-----------------------------------|------------------------------|-------------------|
| GET    | `/documents?folder_id=&q=`        | filters                      | `Document[]`      |
| GET    | `/documents/search?q=`            | partial, case-insensitive    | `Document[]`      |
| GET    | `/documents/{id}`                 | —                            | `Document`        |
| POST   | `/documents`                      | `multipart: file, folder_id, title` | `Document` |
| PATCH  | `/documents/{id}`                 | `{ title }`                  | `Document`        |
| PATCH  | `/documents/{id}/move`            | `{ folder_id }`              | `Document`        |
| DELETE | `/documents/{id}`                 | —                            | 204               |
| GET    | `/documents/{id}/download`        | —                            | file blob         |
| GET    | `/documents/{id}/audit`           | —                            | `AuditLogEntry[]` |

### 1.5 Permissions — `/permissions`
| Method | Path                    | Body / Params                              | Response       |
|--------|-------------------------|--------------------------------------------|----------------|
| GET    | `/permissions?doc_id=`  | filter by document                         | `Permission[]` |
| POST   | `/permissions`          | `{ doc_id, user_id, access_type }`         | `Permission`   |
| PATCH  | `/permissions/{id}`     | `{ access_type }`                          | `Permission`   |
| DELETE | `/permissions/{id}`     | —                                          | 204            |

`access_type ∈ { OWNER, EDITOR, VIEWER }`

### 1.6 Sharing Requests — `/sharing-requests`
| Method | Path                                 | Body / Params            | Response           |
|--------|--------------------------------------|--------------------------|--------------------|
| GET    | `/sharing-requests?status=&doc_id=`  | filters                  | `SharingRequest[]` |
| POST   | `/sharing-requests`                  | `{ doc_id }`             | `SharingRequest`   |
| POST   | `/sharing-requests/{id}/approve`     | —                        | `SharingRequest`   |
| POST   | `/sharing-requests/{id}/reject`      | —                        | `SharingRequest`   |

---

## 2. DTO Shapes (JSON)

```ts
User            { user_id, name, email, role: "ADMIN"|"USER", created_at }
Folder          { folder_id, name, owner_id, created_at }
Document        { doc_id, title, owner_id, folder_id|null,
                  metadata:{ mime_type, size_bytes, extension }, created_at, updated_at }
Permission      { perm_id, doc_id, user_id, access_type }
SharingRequest  { request_id, doc_id, requester_id, status, requested_at }
AuditLogEntry   { log_id, doc_id, actor_id, action, occurred_at }
AuthResponse    { token, user: User }
```

Field naming uses snake_case to match the relational schema; keep the
Spring Boot Jackson config aligned (`PropertyNamingStrategy.SNAKE_CASE`).

---

## 3. Spring Boot CORS Configuration

Frontend runs on Vite dev (`http://localhost:8080` in this project) or the
deployed Lovable preview. Add a global CORS bean:

```java
// src/main/java/com/vaultsystem/config/CorsConfig.java
@Configuration
public class CorsConfig {

  @Bean
  public WebMvcConfigurer corsConfigurer() {
    return new WebMvcConfigurer() {
      @Override
      public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/v1/**")
            .allowedOrigins(
                "http://localhost:8080",
                "http://localhost:5173",
                "https://*.lovable.app"
            )
            .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
            .allowedHeaders("Authorization", "Content-Type", "Accept", "Origin")
            .exposedHeaders("Content-Disposition")
            .allowCredentials(false)  // bearer tokens; no cookies
            .maxAge(3600);
      }
    };
  }
}
```

Spring Security must also permit preflight and allow `Authorization`:

```java
http.cors(Customizer.withDefaults())
    .csrf(csrf -> csrf.disable())
    .authorizeHttpRequests(auth -> auth
        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
        .requestMatchers("/api/v1/auth/**").permitAll()
        .requestMatchers("/api/v1/users/**").hasRole("ADMIN")
        .anyRequest().authenticated())
    .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
```

**Do not** combine `allowCredentials(true)` with `allowedOrigins("*")` —
either list explicit origins or use `allowedOriginPatterns`.

---

## 4. Frontend Wiring (already scaffolded)

Installed: `axios`.

New files:

```
src/lib/api/
  client.ts        # Axios instance, JWT interceptor, error helper
  types.ts         # DTOs mirroring the schema
  auth.ts          # authApi
  users.ts         # usersApi (admin)
  folders.ts       # foldersApi
  documents.ts     # documentsApi (incl. upload progress + download blob)
  permissions.ts   # permissionsApi
  sharing.ts       # sharingApi
  index.ts         # barrel export
src/hooks/use-auth.ts   # useAuth() — login/register/logout/me
.env.example            # VITE_API_BASE_URL
```

Configure once:

```bash
# .env.local
VITE_API_BASE_URL=http://localhost:8080
```

Usage:

```ts
import { documentsApi, apiErrorMessage } from "@/lib/api";

const docs = await documentsApi.search("audit");
```

The interceptor auto-attaches `Authorization: Bearer <token>` from
`localStorage['vault.auth.token']` and clears it on 401.

---

## 5. Dummy-Data → Live-API Migration Steps

Do this per screen. Each step is small enough to ship independently.

### Step 1 — Auth (`src/routes/auth.tsx`)
- Replace the static form submit with `useAuth().login(...)` / `.register(...)`.
- Add a `/reset-password` route that calls `authApi.resetPassword`.
- On success `navigate({ to: "/" })`.

### Step 2 — Route guard
- Create `src/routes/_authenticated.tsx` (pathless layout) that reads
  `useAuth()` and redirects to `/auth` when not authenticated.
- Move `/`, `/documents/$id`, `/upload`, `/admin` under `_authenticated/`
  (delete the current `src/routes/index.tsx` in the same commit to avoid
  a duplicate `/` route).

### Step 3 — Dashboard (`routes/index.tsx`)
- Replace the `rows` array with:
  ```ts
  const { data: docs = [] } = useQuery({
    queryKey: ["documents", { folder_id: null, q }],
    queryFn: () => documentsApi.list({ folder_id: null, q }),
  });
  ```
- Wire the AppShell search box to a debounced `q` state.

### Step 4 — Document detail (`routes/documents.$id.tsx`)
- `documentsApi.get(id)` for the header/metadata block.
- `permissionsApi.listForDocument(id)` for the sharing panel;
  `permissionsApi.update / revoke / grant` for the row controls.
- `sharingApi.listPending({ doc_id: id })` for the "Access Requests"
  block; approve/reject buttons call `sharingApi.approve/reject`.
- `documentsApi.auditLog(id)` for the black audit-log card.
- Download button calls `documentsApi.download(id)` and triggers a
  `URL.createObjectURL` anchor click.
- Rename/Move/Delete buttons call the matching endpoints and
  `router.invalidate()` on success.

### Step 5 — Upload (`routes/upload.tsx`)
- Wire the drop zone / file input to `documentsApi.upload({ file, onProgress })`.
- Push each in-flight file into local state to render the progress rows.
- On completion invalidate the `["documents"]` query.

### Step 6 — Admin (`routes/admin.tsx`)
- Load users with `usersApi.list({ q })`.
- Role `<select>` calls `usersApi.updateRole(id, role)`.
- "Export logs" button calls `usersApi.exportAuditLogs()` and saves the CSV blob.
- Gate the whole route: redirect if `!useAuth().isAdmin`.

### Step 7 — Search
- Add a global search command that calls `documentsApi.search(q)`;
  reuse the AppShell input.

---

## 6. Test Checklist

- [ ] Register → auto-login → dashboard loads
- [ ] Login/logout round-trip; 401 clears token and redirects to `/auth`
- [ ] Non-admin cannot reach `/admin` (client redirect + server 403)
- [ ] Upload shows progress and appears in the dashboard on completion
- [ ] Rename / move / delete reflect immediately after mutation
- [ ] Search returns case-insensitive partial matches
- [ ] Access request → owner approves → requester's permission appears
- [ ] Preflight `OPTIONS` succeeds from the deployed origin (check devtools)

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

---

## 7. Spring Boot Implementation — DTO / Repository / Service / Controller

Every module (Users, Folders, Documents, Permissions, SharingRequests)
follows the same 4-layer pattern. Below is the canonical recipe using
**Folders** as the worked example — replicate it for the other modules.

Package layout:

```
com.vaultsystem
├── config/           ← CorsConfig, SecurityConfig, JwtFilter
├── auth/             ← AuthController, AuthService, JwtService
├── users/            ← User entity + repo + service + controller + DTOs
├── folders/          ← Folder entity + repo + service + controller + DTOs
├── documents/        ← Document entity + repo + service + controller + DTOs
├── permissions/      ← Permission entity + repo + service + controller + DTOs
├── sharing/          ← SharingRequest entity + repo + service + controller + DTOs
└── common/           ← ApiError, GlobalExceptionHandler, BaseEntity
```

### 7.1 Entity (JPA) — maps to the SQL table

```java
// folders/Folder.java
@Entity
@Table(name = "folders")
public class Folder {
  @Id @GeneratedValue(strategy = GenerationType.UUID)
  @Column(name = "folder_id")
  private UUID folderId;

  @Column(nullable = false)
  private String name;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "owner_id")
  private User owner;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt = Instant.now();

  // getters / setters
}
```

### 7.2 DTO — the JSON contract sent to the frontend

Keep DTOs separate from entities. The frontend types in
`src/lib/api/types.ts` are the source of truth; DTO field names must
match one-for-one (snake_case via Jackson).

```java
// folders/dto/FolderDto.java
public record FolderDto(
    UUID folder_id,
    String name,
    UUID owner_id,
    Instant created_at
) {
  public static FolderDto from(Folder f) {
    return new FolderDto(
        f.getFolderId(), f.getName(),
        f.getOwner().getUserId(), f.getCreatedAt());
  }
}

// folders/dto/CreateFolderRequest.java
public record CreateFolderRequest(@NotBlank String name) {}
public record RenameFolderRequest(@NotBlank String name) {}
```

Global Jackson config so all responses use snake_case:

```java
// config/JacksonConfig.java
@Bean
public Jackson2ObjectMapperBuilderCustomizer snakeCase() {
  return b -> b.propertyNamingStrategy(PropertyNamingStrategies.SNAKE_CASE);
}
```

### 7.3 Repository — Spring Data JPA

```java
// folders/FolderRepository.java
public interface FolderRepository extends JpaRepository<Folder, UUID> {
  List<Folder> findByOwnerUserIdOrderByCreatedAtDesc(UUID ownerId);
  boolean existsByFolderIdAndOwnerUserId(UUID folderId, UUID ownerId);
}
```

Custom queries — use derived method names when possible, `@Query` for
joins / partial search:

```java
@Query("select d from Document d where lower(d.title) like lower(concat('%', :q, '%'))")
List<Document> search(@Param("q") String q);
```

### 7.4 Service — business rules, transactions, authorization

The service is the ONLY place that touches multiple repositories and the
only place that enforces "owner vs editor vs viewer" logic. Controllers
stay thin.

```java
// folders/FolderService.java
@Service
@RequiredArgsConstructor
public class FolderService {
  private final FolderRepository folders;
  private final UserRepository users;

  @Transactional(readOnly = true)
  public List<FolderDto> listForUser(UUID userId) {
    return folders.findByOwnerUserIdOrderByCreatedAtDesc(userId)
        .stream().map(FolderDto::from).toList();
  }

  @Transactional
  public FolderDto create(UUID userId, CreateFolderRequest req) {
    User owner = users.findById(userId)
        .orElseThrow(() -> new NotFoundException("user"));
    Folder f = new Folder();
    f.setName(req.name());
    f.setOwner(owner);
    return FolderDto.from(folders.save(f));
  }

  @Transactional
  public FolderDto rename(UUID userId, UUID folderId, RenameFolderRequest req) {
    Folder f = folders.findById(folderId)
        .orElseThrow(() -> new NotFoundException("folder"));
    if (!f.getOwner().getUserId().equals(userId))
      throw new ForbiddenException();
    f.setName(req.name());
    return FolderDto.from(f);       // dirty checking flushes on commit
  }

  @Transactional
  public void delete(UUID userId, UUID folderId) {
    Folder f = folders.findById(folderId)
        .orElseThrow(() -> new NotFoundException("folder"));
    if (!f.getOwner().getUserId().equals(userId))
      throw new ForbiddenException();
    folders.delete(f);
  }
}
```

### 7.5 Controller — HTTP surface, matches Section 1 exactly

```java
// folders/FolderController.java
@RestController
@RequestMapping("/api/v1/folders")
@RequiredArgsConstructor
public class FolderController {
  private final FolderService service;

  @GetMapping
  public List<FolderDto> list(@AuthenticationPrincipal AuthUser me) {
    return service.listForUser(me.userId());
  }

  @PostMapping
  public FolderDto create(@AuthenticationPrincipal AuthUser me,
                          @Valid @RequestBody CreateFolderRequest req) {
    return service.create(me.userId(), req);
  }

  @PatchMapping("/{id}")
  public FolderDto rename(@AuthenticationPrincipal AuthUser me,
                          @PathVariable UUID id,
                          @Valid @RequestBody RenameFolderRequest req) {
    return service.rename(me.userId(), id, req);
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@AuthenticationPrincipal AuthUser me,
                     @PathVariable UUID id) {
    service.delete(me.userId(), id);
  }
}
```

### 7.6 Cross-cutting pieces

- **Global exception handler** — `@ControllerAdvice` maps
  `NotFoundException → 404`, `ForbiddenException → 403`,
  `MethodArgumentNotValidException → 400`, everything else → 500. All
  bodies use `ApiError { message, code, details }` to match the frontend
  `apiErrorMessage()` helper.
- **JWT filter** — parses the `Authorization: Bearer` header, loads the
  user, sets the `SecurityContext`, and exposes `AuthUser` as the
  `@AuthenticationPrincipal`.
- **File storage for Documents** — store binary bytes on disk (or S3) and
  save only `path`, `mime_type`, `size_bytes` on the `Document` row. The
  upload controller consumes `multipart/form-data`; the download
  controller streams via `ResponseEntity<Resource>` with
  `Content-Disposition: attachment; filename="..."`.

### 7.7 Repeat for the other modules

| Module           | Entity           | Repository extras                                   | Key service rules |
|------------------|------------------|-----------------------------------------------------|-------------------|
| Users            | `User`           | `findByEmail`, `existsByEmail`                      | Admin-only role change, password BCrypt hash |
| Documents        | `Document`       | `search(q)`, `findByFolder_FolderId`, `findByOwner` | Owner check for rename/move/delete, permission check for view/edit |
| Permissions      | `Permission`     | `findByDocument_DocId`, `findByDocAndUser`          | Only OWNER can grant/revoke; cannot demote self |
| SharingRequests  | `SharingRequest` | `findByDocument_DocIdAndStatus`                     | Approve creates a `Permission(VIEWER)`; reject flips status |
| AuditLog         | `AuditLogEntry`  | `findByDocument_DocId`                              | Written from a Spring AOP aspect around service methods |

---

## 8. ERD Entities — status vs current codebase

The relational schema in §3 defines **five required entities**. Below is
what the current app already exercises and what is missing.

### 8.1 Entities implemented (mock + UI wired)

| Entity          | DTO in `types.ts`  | Mock table (`lib/mock/db.ts`) | UI screens using it                              |
|-----------------|--------------------|-------------------------------|--------------------------------------------------|
| Users           | `User`             | `users`                       | `auth.tsx`, `admin.tsx`, `app-shell.tsx`         |
| Folders         | `Folder`           | `folders`                     | `folders.tsx`, `index.tsx` (filter), move dialog |
| Documents       | `DocumentMeta`     | `documents`                   | `index.tsx`, `upload.tsx`, `documents.$id.tsx`   |
| Permissions     | `Permission`       | `permissions`                 | `documents.$id.tsx` (sharing panel)              |
| SharingRequests | `SharingRequest`   | `sharingRequests`             | `documents.$id.tsx` (access requests block)      |

### 8.2 Entity NOT in the required schema but present in the app

- **AuditLog** (`AuditLogEntry`) — used in `documents.$id.tsx` and
  `admin.tsx` (CSV export). It's a **bonus** entity: not in the SRS
  schema, but needed to satisfy "Admin monitors system" and to power the
  audit-trail card. When implementing the backend, add it as a real
  table (`audit_log`) with `log_id, doc_id, actor_id, action,
  occurred_at`. It doesn't break the SRS — it extends it.

### 8.3 Entity fields still missing / to add on the backend

- `Users.password_hash` — the frontend never sees it, but the schema
  requires `password`. Store BCrypt hash; never expose in DTOs.
- `Documents.storage_path` — the mock stores no binary. Add
  `storage_path VARCHAR NOT NULL` plus a `file_hash` for dedupe.
- `Permissions` unique constraint `(doc_id, user_id)` — the mock enforces
  it in code; add a DB `UNIQUE` index in the migration.
- `SharingRequests.decided_at` and `decided_by` — currently only
  `requested_at` + `status`; add these two columns so approve/reject is
  auditable.

### 8.4 Functionality → entity map (what breaks if an entity is missing)

| App feature                             | Entities touched                          |
|-----------------------------------------|-------------------------------------------|
| Login / register / me                   | Users                                     |
| Sidebar role gate + `/admin`            | Users                                     |
| Dashboard list + search                 | Documents, Permissions (visibility filter)|
| Upload                                  | Documents, Folders (optional), AuditLog   |
| Rename / delete / move                  | Documents, Folders, AuditLog              |
| Folder tab                              | Folders, Documents                        |
| Share panel (grant/revoke/change role)  | Permissions, Users                        |
| "Request access" button                 | SharingRequests                           |
| Owner approves / rejects                | SharingRequests → Permissions, AuditLog   |
| Admin CSV export                        | Users, AuditLog                           |

---

## 9. From hard-coded mock → PostgreSQL (Spring Boot `application.properties`)

Currently the frontend runs entirely against the in-memory mock adapter
(`VITE_USE_MOCK` unset or `!== "false"`). The cut-over has two sides:

### 9.1 Backend — wire Spring Boot to PostgreSQL

`src/main/resources/application.properties`:

```properties
# --- Datasource ---
spring.datasource.url=jdbc:postgresql://localhost:5432/vaultsystem
spring.datasource.username=vault
spring.datasource.password=${DB_PASSWORD}
spring.datasource.driver-class-name=org.postgresql.Driver

# --- JPA / Hibernate ---
spring.jpa.hibernate.ddl-auto=validate          # use Flyway/Liquibase for schema
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.open-in-view=false
spring.jpa.properties.hibernate.jdbc.time_zone=UTC

# --- Jackson (snake_case DTOs) ---
spring.jackson.property-naming-strategy=SNAKE_CASE
spring.jackson.default-property-inclusion=non_null

# --- Flyway migrations (recommended) ---
spring.flyway.enabled=true
spring.flyway.locations=classpath:db/migration

# --- File storage ---
vault.storage.dir=${VAULT_STORAGE_DIR:./var/documents}
vault.storage.max-file-size=25MB
spring.servlet.multipart.max-file-size=25MB
spring.servlet.multipart.max-request-size=25MB

# --- JWT ---
vault.jwt.secret=${JWT_SECRET}
vault.jwt.expires-minutes=120

# --- Server ---
server.port=8080
server.servlet.context-path=/
```

`pom.xml` additions: `spring-boot-starter-data-jpa`,
`spring-boot-starter-web`, `spring-boot-starter-security`,
`spring-boot-starter-validation`, `postgresql`, `flyway-core`,
`flyway-database-postgresql`, `jjwt-api`/`impl`/`jackson`, `lombok`.

Flyway migration `V1__init.sql` — one `CREATE TABLE` per entity in §3
plus the additions in §8.3, matching the JPA column names exactly.

### 9.2 Frontend — flip the mock switch

```bash
# .env.local
VITE_USE_MOCK=false
VITE_API_BASE_URL=http://localhost:8080
```

`src/lib/api/client.ts` already reads these:

```ts
if (import.meta.env.VITE_USE_MOCK !== "false") {
  import("../mock/install").then(m => m.installMockAdapter(api));
}
```

Once the backend is reachable, no component code needs to change — the
Axios instance simply stops being intercepted.

Deletion order after cut-over: run the manual test flow, then remove
`src/lib/mock/` and the `axios-mock-adapter` dev dependency.

---

## 10. End-to-end logic — Frontend side vs Backend side

Same feature, two responsibilities. Read this side-by-side when
implementing any endpoint.

### 10.1 Frontend logic (React + TanStack + Axios)

For every user action:

1. **UI event** — component in `src/routes/*.tsx` fires a handler.
2. **Validation (soft)** — form-level checks (required, length,
   confirm-password match). This is UX only; never trust the client.
3. **API call** — call the typed function in `src/lib/api/<module>.ts`.
   Never build URLs inline in components.
4. **State via React Query** —
   - Reads: `useQuery({ queryKey, queryFn })` — see cache keys in
     `CODE_WORKFLOW.md §6`.
   - Writes: `useMutation({ mutationFn, onSuccess })` and
     `queryClient.invalidateQueries({ queryKey })` for anything that
     could now be stale.
5. **Auth** — `client.ts` interceptor attaches
   `Authorization: Bearer <token>` from `localStorage`. On 401 it clears
   the token and the route guard bounces to `/auth`.
6. **Role gating** — `useAuth().isAdmin` hides admin nav; the real check
   still happens on the backend (defense in depth).
7. **Error surface** — `apiErrorMessage(err)` extracts the `ApiError`
   body and feeds it to a toast; the component stays declarative.
8. **Optimistic UI (optional)** — for rename/move, snapshot the cache in
   `onMutate`, roll back in `onError`.

### 10.2 Backend logic (Spring Boot)

For every incoming request:

1. **Filter chain** — CORS filter → JWT filter validates the token and
   populates the `SecurityContext` with `AuthUser`.
2. **Authorization (coarse)** — Spring Security rules in
   `SecurityConfig` (`/api/v1/auth/** permitAll`,
   `/api/v1/users/** hasRole('ADMIN')`, everything else
   `authenticated()`).
3. **Controller** — binds path variables and validates the body with
   `@Valid`; delegates immediately to the service. No business logic
   here.
4. **Service** — the brain:
   - Loads entities via the repository.
   - Enforces **fine-grained rules** (owner-only rename, permission
     check for view/edit, "cannot demote yourself", etc.).
   - Mutates entities inside `@Transactional`; JPA dirty-checking
     flushes on commit.
   - Writes an `AuditLog` row for every state change (via AOP or
     explicit call).
5. **Repository** — Spring Data JPA. Prefer derived query methods; use
   `@Query` for search / joins.
6. **Response mapping** — service returns DTOs, never entities. Jackson
   serializes with snake_case so the JSON matches
   `src/lib/api/types.ts` exactly.
7. **Errors** — throw domain exceptions
   (`NotFoundException`, `ForbiddenException`, `ConflictException`);
   `@ControllerAdvice` converts them to the shared `ApiError` body.
8. **File I/O for Documents** — controller streams the multipart to
   `vault.storage.dir/<uuid>`; the service records `storage_path` +
   `size_bytes` + `mime_type` on the row. Download streams the file back
   with `Content-Disposition`.

### 10.3 Contract between the two sides

The single source of truth is **§1 endpoint map + §2 DTO shapes**. As
long as both sides honor those, frontend and backend can be built and
tested independently. Any DTO field change must land in
`src/lib/api/types.ts` and the matching Java record in the same PR.

# VaultSystem Architecture Diagrams

## 1) Use Case Diagram

```mermaid
flowchart LR
    actor User
    actor Admin
    actor System

    User --> UC1[POST /api/v1/auth/register]
    User --> UC2[POST /api/v1/auth/login]
    User --> UC3[GET /api/v1/auth/me]
    User --> UC4[POST /api/v1/auth/logout]
    User --> UC5[GET /api/v1/folders]
    User --> UC6[POST /api/v1/folders]
    User --> UC7[PATCH /api/v1/folders/:id]
    User --> UC8[DELETE /api/v1/folders/:id]
    User --> UC9[POST /api/v1/documents/upload]
    User --> UC10[GET /api/v1/documents]
    User --> UC11[GET /api/v1/documents/:id]
    User --> UC12[PATCH /api/v1/documents/:id]
    User --> UC13[POST /api/v1/documents/:id/move]
    User --> UC14[DELETE /api/v1/documents/:id]
    User --> UC15[GET /api/v1/permissions]
    User --> UC16[POST /api/v1/sharing-requests]
    User --> UC17[GET /api/v1/sharing-requests]
    User --> UC18[PATCH /api/v1/sharing-requests/:id/approve]
    User --> UC19[PATCH /api/v1/sharing-requests/:id/reject]
    User --> UC20[GET /api/v1/users]
    User --> UC21[PATCH /api/v1/users/:id/role]
    User --> UC22[GET /api/v1/users/audit/export]

    Admin --> UC23[Admin-only role enforcement]
    Admin --> UC24[User governance and role changes]
    Admin --> UC25[Audit log export]

    System --> UC26[JWT bearer validation]
    System --> UC27[Permission checks on document access]
    System --> UC28[Database persistence in PostgreSQL]
```

## 2) Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Frontend as Vite React Frontend
    participant API as Spring Boot API
    participant Auth as AuthService / JwtService
    participant DB as PostgreSQL Database

    User->>Frontend: Enter email/password
    Frontend->>API: POST /api/v1/auth/register
    API->>Auth: Validate registration input
    Auth->>DB: Check if email exists
    DB-->>Auth: User status
    Auth->>DB: Insert new user record
    Auth-->>API: JWT token + user profile
    API-->>Frontend: AuthResponse
    Frontend->>Frontend: Save token to localStorage

    User->>Frontend: Login
    Frontend->>API: POST /api/v1/auth/login
    API->>Auth: Validate credentials
    Auth->>DB: Fetch user by email
    DB-->>Auth: User row
    Auth-->>API: JWT token
    API-->>Frontend: AuthResponse

    User->>Frontend: Upload document
    Frontend->>API: POST /api/v1/documents/upload (Bearer token)
    API->>Auth: Validate bearer token
    API->>DB: Save document + metadata + owner
    DB-->>API: Created document row
    API-->>Frontend: Document payload

    User->>Frontend: Create folder
    Frontend->>API: POST /api/v1/folders (Bearer token)
    API->>DB: Save folder with owner_id
    API-->>Frontend: Folder response

    User->>Frontend: Request sharing
    Frontend->>API: POST /api/v1/sharing-requests (Bearer token)
    API->>DB: Create pending sharing request
    DB-->>API: Request saved
    API-->>Frontend: Sharing request status

    User->>Frontend: Approve request
    Frontend->>API: PATCH /api/v1/sharing-requests/:id/approve (Bearer token)
    API->>DB: Update status to Approved
    API->>DB: Upsert permission record
    API-->>Frontend: Approved response

    Admin->>Frontend: View users
    Frontend->>API: GET /api/v1/users (Bearer token)
    API->>Auth: Validate role
    API->>DB: Query all users
    API-->>Frontend: User list

    Admin->>Frontend: Export audit logs
    Frontend->>API: GET /api/v1/users/audit/export (Bearer token)
    API-->>Frontend: CSV file
```

## 3) Class Diagram

```mermaid
classDiagram
    class AuthController {
        +POST /api/v1/auth/register
        +POST /api/v1/auth/login
        +GET /api/v1/auth/me
        +POST /api/v1/auth/logout
    }

    class UserManager {
        +Integer userId
        +String name
        +String email
        +String password
        +String role
        +LocalDateTime createdAt
        +List<DocumentManage> documents
        +List<FolderManager> folders
        +List<PermissionManager> permissions
        +List<SharingRequestManager> sharingRequests
    }

    class FolderController {
        +GET /api/v1/folders
        +POST /api/v1/folders
        +PATCH /api/v1/folders/:id
        +DELETE /api/v1/folders/:id
    }

    class FolderManager {
        +Integer folderId
        +String name
        +LocalDateTime createdAt
        +UserManager owner
        +List<DocumentManage> documents
    }

    class DocumentController {
        +GET /api/v1/documents
        +GET /api/v1/documents/:id
        +POST /api/v1/documents/upload
        +PATCH /api/v1/documents/:id
        +POST /api/v1/documents/:id/move
        +DELETE /api/v1/documents/:id
    }

    class DocumentManage {
        +Integer docId
        +String title
        +Map metadata
        +LocalDateTime createdAt
        +LocalDateTime updatedAt
        +byte[] fileData
        +String originalFilename
        +String contentType
        +UserManager owner
        +FolderManager folder
        +List<PermissionManager> permissions
        +List<SharingRequestManager> sharingRequests
    }

    class PermissionController {
        +GET /api/v1/permissions
        +PATCH /api/v1/permissions/:id
        +DELETE /api/v1/permissions/:id
    }

    class PermissionManager {
        +Integer permId
        +String accessType
        +DocumentManage document
        +UserManager user
    }

    class SharingRequestController {
        +GET /api/v1/sharing-requests
        +POST /api/v1/sharing-requests
        +PATCH /api/v1/sharing-requests/:id/approve
        +PATCH /api/v1/sharing-requests/:id/reject
    }

    class SharingRequestManager {
        +Integer sharingReqId
        +String accessType
        +String status
        +LocalDateTime createdAt
        +LocalDateTime updatedAt
        +DocumentManage document
        +UserManager user
        +UserManager sharingUser
    }

    class UserController {
        +GET /api/v1/users
        +GET /api/v1/users/:id
        +PATCH /api/v1/users/:id/role
        +DELETE /api/v1/users/:id
        +GET /api/v1/users/audit/export
    }

    class AuthService {
        +register(request)
        +login(request)
        +getCurrentUser(token)
        +logout(token)
    }

    class JwtService {
        +generateToken(user)
        +extractUserId(token)
        +extractRole(token)
        +isTokenValid(token)
    }

    class DocumentManageService {
        +getDocuments(userId, folderId, q)
        +createDocument(file, folderId, title, userId)
        +moveDocument(id, folderId, userId)
        +deleteDocumentById(id, userId)
    }

    class SharingRequestManagerService {
        +createSharingRequest(docId, recipientUserId, permission, actorUserId)
        +approveSharingRequest(id, actorUserId)
        +rejectSharingRequest(id, actorUserId)
    }

    class UserManagerService {
        +getAllUsers()
        +getUserById(id)
        +updateUser(id, user)
        +deleteUserById(id)
    }

    AuthController --> AuthService
    AuthService --> JwtService
    UserController --> UserManagerService
    FolderController --> FolderManager
    DocumentController --> DocumentManageService
    SharingRequestController --> SharingRequestManagerService
    PermissionController --> PermissionManager

    UserManager "1" --> "0..*" DocumentManage
    UserManager "1" --> "0..*" FolderManager
    UserManager "1" --> "0..*" PermissionManager
    UserManager "1" --> "0..*" SharingRequestManager

    FolderManager "1" --> "0..*" DocumentManage
    DocumentManage "1" --> "0..*" PermissionManager
    DocumentManage "1" --> "0..*" SharingRequestManager
```

## 4) Activity Diagram

```mermaid
flowchart TD
    A[User opens app] --> B{Authenticated?}
    B -- No --> C[POST /api/v1/auth/register or POST /api/v1/auth/login]
    C --> D[Submit credentials]
    D --> E[Generate JWT token]
    E --> F[Store token in frontend]
    F --> G[Redirect to dashboard]

    B -- Yes --> G
    G --> H[GET /api/v1/folders or GET /api/v1/documents]
    H --> I{Action?}

    I -- Upload document --> J[POST /api/v1/documents/upload]
    J --> K[Validate file and owner permissions]
    K --> L[Save document to database]
    L --> M[Create owner permission entry]

    I -- Create folder --> N[POST /api/v1/folders]
    N --> O[Validate folder owner]
    O --> P[Create folder record]

    I -- Share document --> Q[POST /api/v1/sharing-requests]
    Q --> R[Await approval]
    R --> S{Request approved?}
    S -- Yes --> T[PATCH /api/v1/sharing-requests/:id/approve]
    T --> U[Create permission grant]
    S -- No --> V[PATCH /api/v1/sharing-requests/:id/reject]

    I -- Change role --> W[PATCH /api/v1/users/:id/role]
    W --> X[Admin checks role update]
    X --> Y[Update user role record]

    I -- Download document --> Z[GET /api/v1/documents/:id]
    Z --> AA[Check permission and access rights]
    AA --> AB[Return file bytes]

    I -- Logout --> AC[POST /api/v1/auth/logout]
    AC --> AD[Clear token from client]
    AD --> AE[End session]
```

## 5) High-Level App Context

```mermaid
flowchart LR
    Frontend[React + Vite Frontend] --> AuthAPI[POST /api/v1/auth/register\nPOST /api/v1/auth/login\nGET /api/v1/auth/me]
    Frontend --> FolderAPI[GET /api/v1/folders\nPOST /api/v1/folders]
    Frontend --> DocAPI[GET /api/v1/documents\nPOST /api/v1/documents/upload\nPATCH /api/v1/documents/:id]
    Frontend --> ShareAPI[POST /api/v1/sharing-requests\nPATCH /api/v1/sharing-requests/:id/approve]
    Frontend --> UserAPI[GET /api/v1/users\nPATCH /api/v1/users/:id/role]

    AuthAPI --> API[Spring Boot Backend]
    FolderAPI --> API
    DocAPI --> API
    ShareAPI --> API
    UserAPI --> API

    API --> DB[PostgreSQL RDS]
    API --> Files[Document bytea storage + metadata]
    API --> JWT[JWT bearer token validation]
```

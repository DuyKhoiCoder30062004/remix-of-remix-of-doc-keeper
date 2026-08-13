# Sơ đồ kiến trúc VaultSystem

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
    actor NguoiDung as Người dùng
    participant Frontend as Frontend React + Vite
    participant API as Backend Spring Boot
    participant Auth as AuthService / JwtService
    participant TaiLieu as DocumentManageService
    participant ThuMuc as FolderManagerService
    participant ChiaSe as SharingRequestManagerService
    participant Quyen as PermissionManagerService
    participant CSDL as PostgreSQL

    NguoiDung->>Frontend: Nhập thông tin đăng ký / đăng nhập
    Frontend->>API: POST /api/v1/auth/register hoặc POST /api/v1/auth/login
    API->>Auth: Kiểm tra dữ liệu và xác thực mật khẩu
    Auth->>CSDL: Tìm người dùng theo email / lưu người dùng mới
    CSDL-->>Auth: Trả về bản ghi người dùng
    Auth-->>API: Trả về JWT token và thông tin người dùng
    API-->>Frontend: AuthResponseDto
    Frontend->>Frontend: Lưu token vào localStorage

    NguoiDung->>Frontend: Mở trang thư mục / tài liệu
    Frontend->>API: GET /api/v1/folders hoặc GET /api/v1/documents
    API->>Auth: Giải mã token và lấy user hiện tại
    API->>ThuMuc: Lấy danh sách thư mục theo owner
    API->>TaiLieu: Lấy danh sách tài liệu theo quyền truy cập
    ThuMuc-->>API: Danh sách thư mục
    TaiLieu-->>API: Danh sách tài liệu
    API-->>Frontend: Dữ liệu để hiển thị giao diện

    NguoiDung->>Frontend: Upload file
    Frontend->>API: POST /api/v1/documents/upload (multipart/form-data)
    API->>Auth: Kiểm tra JWT Bearer
    API->>TaiLieu: Tạo tài liệu mới, gán owner và metadata
    TaiLieu->>CSDL: Lưu file_data, metadata, folder_id, owner_id
    TaiLieu->>Quyen: Tạo quyền Owner cho người upload
    Quyen->>CSDL: Lưu bản ghi permissions
    API-->>Frontend: Thông tin tài liệu vừa tạo

    NguoiDung->>Frontend: Gửi yêu cầu chia sẻ
    Frontend->>API: POST /api/v1/sharing-requests
    API->>ChiaSe: Tạo yêu cầu chia sẻ ở trạng thái Pending
    ChiaSe->>CSDL: Lưu sharing request
    API-->>Frontend: Phản hồi trạng thái yêu cầu

    NguoiDung->>Frontend: Duyệt hoặc từ chối yêu cầu
    Frontend->>API: POST /api/v1/sharing-requests/:id/approve hoặc /reject
    API->>ChiaSe: Cập nhật trạng thái Approved / Rejected
    ChiaSe->>Quyen: Tạo hoặc cập nhật quyền truy cập tương ứng
    Quyen->>CSDL: Lưu quyền mới
    API-->>Frontend: Kết quả xử lý

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
        -AuthService authService
        -JwtService jwtService
        +register(request) ResponseEntity
        +login(request) ResponseEntity
        +getCurrentUser(authHeader) ResponseEntity
        +logout(authHeader) ResponseEntity
        +forgotPassword(body) ResponseEntity
        +resetPassword(body) ResponseEntity
        -extractToken(authHeader) String
    }

    class AuthService {
        -UserManagerRepository userRepository
        -JwtService jwtService
        -PasswordEncoder passwordEncoder
        +register(request) AuthResponseDto
        +login(request) AuthResponseDto
        +getCurrentUser(token) UserManager
        +logout(token) void
        -toUserManager(user) UserManager
    }

    class JwtService {
        -String jwtSecret
        -long jwtExpirationMs
        +generateToken(user) String
        +extractUserId(token) Integer
        +extractRole(token) String
        +isTokenValid(token) boolean
        -extractAllClaims(token) Claims
        -getSigningKey() SecretKey
    }

    class FolderManagerController {
        -FolderManagerService folderManagerService
        -AuthService authService
        -JwtService jwtService
        +getAllFolders(authorization) List~FolderManager~
        +getFolderById(id, authorization) FolderManager
        +createFolder(folder, authorization) FolderManager
        +updateFolder(id, folder, authorization) FolderManager
        +deleteFolder(id, authorization) void
        -extractToken(authHeader) String
        -currentUserIdFromHeader(authorization) Integer
    }

    class FolderManagerService {
        -FolderManagerRepository folderManagerRepository
        -UserManagerRepository userManagerRepository
        +getAllFolders(currentUserId) List~FolderManager~
        +getFolderById(id, currentUserId) FolderManager
        +createFolder(folder, currentUserId) FolderManager
        +updateFolder(id, updatedFolder, currentUserId) FolderManager
        +deleteFolderById(id, currentUserId) void
    }

    class PermissionManagerController {
        -PermissionManagerService permissionManagerService
        +getPermissions(docId, userId) List~PermissionResponseDto~
        +getPermissionById(id) PermissionResponseDto
        +createPermission(request) PermissionResponseDto
        +updatePermission(id, request) PermissionResponseDto
        +deletePermission(id) void
    }

    class PermissionManagerService {
        -PermissionManagerRepository permissionManagerRepository
        -DocumentManageRepository documentManageRepository
        -UserManagerRepository userManagerRepository
        +getAllPermissions() List~PermissionManager~
        +getPermissionsByDocumentId(docId) List~PermissionManager~
        +getPermissionByDocumentAndUser(docId, userId) Optional~PermissionManager~
        +getPermissions(docId, userId) List~PermissionManager~
        +getPermissionById(id) PermissionManager
        +createPermission(docId, userId, accessType) PermissionManager
        +updatePermission(id, accessType) PermissionManager
        +deletePermissionById(id) void
        +toDto(permission) PermissionResponseDto
        -normalizeAccessType(raw) String
    }

    class SharingRequestManagerController {
        -SharingRequestManagerService sharingRequestManagerService
        -JwtService jwtService
        +getSharingRequests(authHeader, status, docId) List~SharingRequestResponseDto~
        +getSharingRequestById(id) SharingRequestResponseDto
        +createSharingRequest(authHeader, request) SharingRequestResponseDto
        +approveSharingRequest(authHeader, id) SharingRequestResponseDto
        +rejectSharingRequest(authHeader, id) SharingRequestResponseDto
        +handleIllegalArgument(ex) ResponseEntity
        -extractToken(authHeader) String
    }

    class SharingRequestManagerService {
        -SharingRequestManagerRepository sharingRequestManagerRepository
        -DocumentManageRepository documentManageRepository
        -UserManagerRepository userManagerRepository
        -PermissionManagerRepository permissionManagerRepository
        +getAllSharingRequests() List~SharingRequestManager~
        +getSharingRequestsByStatus(status) List~SharingRequestManager~
        +getSharingRequestsByDocumentId(docId) List~SharingRequestManager~
        +getSharingRequestsByStatusAndDocumentId(status, docId) List~SharingRequestManager~
        +getIncomingRequests(actorUserId, status, docId) List~SharingRequestManager~
        +getSharingRequestById(id) SharingRequestManager
        +createSharingRequest(docId, recipientUserId, permission, actorUserId) SharingRequestManager
        +approveSharingRequest(id, actorUserId) SharingRequestManager
        +rejectSharingRequest(id, actorUserId) SharingRequestManager
        +toDto(request) SharingRequestResponseDto
        -normalizeStatus(raw) String
        -normalizeAccessType(raw) String
    }

    class UserManagerController {
        -UserManagerService userManagerService
        +getAllUsers(q) List~UserManager~
        +getUserById(id) UserManager
        +exportAuditLogs() ResponseEntity
        +updateUserRole(id, user) UserManager
        +deleteUser(id) void
    }

    class UserManagerService {
        -UserManagerRepository userManagerRepository
        +getAllUsers() List~UserManager~
        +getUserById(id) UserManager
        +createUser(user) UserManager
        +updateUser(id, updatedUser) UserManager
        +deleteUserById(id) void
    }

    class DocumentManageService {
        -DocumentManageRepository documentManageRepository
        -FolderManagerRepository folderManagerRepository
        -UserManagerRepository userManagerRepository
        -PermissionManagerRepository permissionManagerRepository
        +getDocuments(currentUserId, folderId, q) List~DocumentManage~
        +searchDocuments(currentUserId, q) List~DocumentManage~
        +getDocumentById(id, currentUserId) DocumentManage
        +createDocument(file, folderId, title, currentUserId) DocumentManage
        +updateDocument(id, updatedDocument, currentUserId) DocumentManage
        +moveDocument(id, folderId, currentUserId) DocumentManage
        +deleteDocumentById(id, currentUserId) void
        -resolveAccessType(doc, userId) String
        -requireCanView(doc, userId) void
        -requireCanEdit(doc, userId) void
        -requireIsOwner(doc, userId) void
        -isAdmin(user) boolean
    }

    class UserManager {
        +Integer userId
        +String name
        +String email
        +String password
        +String role
        +LocalDateTime createdAt
        +List~DocumentManage~ documents
        +List~FolderManager~ folders
        +List~PermissionManager~ permissions
        +List~SharingRequestManager~ sharingRequests
    }

    class FolderManager {
        +Integer folderId
        +String name
        +LocalDateTime createdAt
        +UserManager owner
        +List~DocumentManage~ documents
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
        +List~PermissionManager~ permissions
        +List~SharingRequestManager~ sharingRequests
    }

    class PermissionManager {
        +Integer permId
        +String accessType
        +DocumentManage document
        +UserManager user
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

    AuthController --> AuthService
    AuthController --> JwtService

    FolderManagerController --> FolderManagerService
    FolderManagerController --> AuthService
    FolderManagerController --> JwtService

    PermissionManagerController --> PermissionManagerService

    SharingRequestManagerController --> SharingRequestManagerService
    SharingRequestManagerController --> JwtService

    UserManagerController --> UserManagerService

    DocumentManageService --> DocumentManage

    AuthService --> UserManager
    AuthService --> JwtService

    FolderManagerService --> FolderManager
    FolderManagerService --> UserManager

    PermissionManagerService --> PermissionManager
    PermissionManagerService --> DocumentManage
    PermissionManagerService --> UserManager

    SharingRequestManagerService --> SharingRequestManager
    SharingRequestManagerService --> DocumentManage
    SharingRequestManagerService --> UserManager
    SharingRequestManagerService --> PermissionManager

    UserManagerService --> UserManager

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

    A["User opens application"] --> B{"Authenticated?"}

    B -- "No" --> C["POST /api/v1/auth/register<br/>or<br/>POST /api/v1/auth/login"]
    C --> D["Enter registration or login information"]
    D --> E["Backend creates JWT token"]
    E --> F["Store token in frontend"]
    F --> G["Go to dashboard"]

    B -- "Yes" --> G

    G --> H["GET /api/v1/folders<br/>or<br/>GET /api/v1/documents"]

    H --> I{"User action"}

    I -- "Upload document" --> J["POST /api/v1/documents/upload"]
    J --> K["Validate file and ownership"]
    K --> L["Save file and metadata to database"]
    L --> M["Create Owner permission"]

    I -- "Create folder" --> N["POST /api/v1/folders"]
    N --> O["Check folder creation permission"]
    O --> P["Save new folder"]

    I -- "Share document" --> Q["POST /api/v1/sharing-requests"]
    Q --> R["Wait for recipient approval"]
    R --> S{"Request approved?"}

    S -- "Yes" --> T["POST /api/v1/sharing-requests/:id/approve"]
    T --> U["Create or update access permission"]

    S -- "No" --> V["POST /api/v1/sharing-requests/:id/reject"]

    I -- "Change role" --> W["PATCH /api/v1/users/:id/role"]
    W --> X["Administrator validates and updates role"]
    X --> Y["Save new role"]

    I -- "Download document" --> Z["GET /api/v1/documents/:id"]
    Z --> AA["Check access permission"]
    AA --> AB["Return file data"]

    I -- "Logout" --> AC["POST /api/v1/auth/logout"]
    AC --> AD["Remove token from frontend"]
    AD --> AE["End session"]
```

## 5) High-Level App Context

```mermaid
flowchart LR

    Frontend["Frontend React + Vite + TypeScript"]

    AuthAPI["Authentication API<br/>POST /api/v1/auth/register<br/>POST /api/v1/auth/login<br/>GET /api/v1/auth/me<br/>POST /api/v1/auth/logout"]

    FolderAPI["Folder API<br/>GET /api/v1/folders<br/>POST /api/v1/folders<br/>PATCH /api/v1/folders/:id<br/>DELETE /api/v1/folders/:id"]

    DocAPI["Document API<br/>GET /api/v1/documents<br/>POST /api/v1/documents/upload<br/>GET /api/v1/documents/:id<br/>PATCH /api/v1/documents/:id<br/>POST /api/v1/documents/:id/move<br/>DELETE /api/v1/documents/:id"]

    ShareAPI["Sharing API<br/>GET /api/v1/sharing-requests<br/>POST /api/v1/sharing-requests<br/>POST /api/v1/sharing-requests/:id/approve<br/>POST /api/v1/sharing-requests/:id/reject"]

    UserAPI["User API<br/>GET /api/v1/users<br/>PATCH /api/v1/users/:id/role<br/>GET /api/v1/users/audit/export"]

    Backend["Backend Spring Boot"]
    Database[("PostgreSQL RDS")]
    FileStore["File Storage<br/>File Content and Metadata"]
    JWT["JWT Authentication"]

    Frontend --> AuthAPI
    Frontend --> FolderAPI
    Frontend --> DocAPI
    Frontend --> ShareAPI
    Frontend --> UserAPI

    AuthAPI --> Backend
    FolderAPI --> Backend
    DocAPI --> Backend
    ShareAPI --> Backend
    UserAPI --> Backend

    Backend --> Database
    Backend --> FileStore
    Backend --> JWT
```

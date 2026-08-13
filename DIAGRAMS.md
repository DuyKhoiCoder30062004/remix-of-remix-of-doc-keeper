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
        +register(request: RegisterRequest) ResponseEntity
        +login(request: LoginRequest) ResponseEntity
        +getCurrentUser(authHeader: String) ResponseEntity
        +logout(authHeader: String) ResponseEntity
        +forgotPassword(body: Map~String,String~) ResponseEntity
        +resetPassword(body: Map~String,String~) ResponseEntity
        -extractToken(authHeader: String) String
    }

    class AuthService {
        -UserManagerRepository userRepository
        -JwtService jwtService
        -PasswordEncoder passwordEncoder
        +register(request: RegisterRequest) AuthResponseDto
        +login(request: LoginRequest) AuthResponseDto
        +getCurrentUser(token: String) UserManager
        +logout(token: String) void
        -toUserManager(user: UserManager) UserManager
    }

    class JwtService {
        -String jwtSecret
        -long jwtExpirationMs
        +generateToken(user: UserManager) String
        +extractUserId(token: String) Integer
        +extractRole(token: String) String
        +isTokenValid(token: String) boolean
        -extractAllClaims(token: String) Claims
        -getSigningKey() SecretKey
    }

    class FolderManagerController {
        -FolderManagerService folderManagerService
        -AuthService authService
        -JwtService jwtService
        +getAllFolders(authorization: String) List~FolderManager~
        +getFolderById(id: Integer, authorization: String) FolderManager
        +createFolder(folder: FolderManager, authorization: String) FolderManager
        +updateFolder(id: Integer, folder: FolderManager, authorization: String) FolderManager
        +deleteFolder(id: Integer, authorization: String) void
        -extractToken(authHeader: String) String
        -currentUserIdFromHeader(authorization: String) Integer
    }

    class FolderManagerService {
        -FolderManagerRepository folderManagerRepository
        -UserManagerRepository userManagerRepository
        +getAllFolders(currentUserId: Integer) List~FolderManager~
        +getFolderById(id: Integer, currentUserId: Integer) FolderManager
        +createFolder(folder: FolderManager, currentUserId: Integer) FolderManager
        +updateFolder(id: Integer, updatedFolder: FolderManager, currentUserId: Integer) FolderManager
        +deleteFolderById(id: Integer, currentUserId: Integer) void
    }

    class PermissionManagerController {
        -PermissionManagerService permissionManagerService
        +getPermissions(docId: Integer, userId: Integer) List~PermissionResponseDto~
        +getPermissionById(id: Integer) PermissionResponseDto
        +createPermission(request: PermissionCreateRequest) PermissionResponseDto
        +updatePermission(id: Integer, request: PermissionUpdateRequest) PermissionResponseDto
        +deletePermission(id: Integer) void
    }

    class PermissionManagerService {
        -PermissionManagerRepository permissionManagerRepository
        -DocumentManageRepository documentManageRepository
        -UserManagerRepository userManagerRepository
        +getAllPermissions() List~PermissionManager~
        +getPermissionsByDocumentId(docId: Integer) List~PermissionManager~
        +getPermissionByDocumentAndUser(docId: Integer, userId: Integer) Optional~PermissionManager~
        +getPermissions(docId: Integer, userId: Integer) List~PermissionManager~
        +getPermissionById(id: Integer) PermissionManager
        +createPermission(docId: Integer, userId: Integer, accessType: String) PermissionManager
        +updatePermission(id: Integer, accessType: String) PermissionManager
        +deletePermissionById(id: Integer) void
        +toDto(p: PermissionManager) PermissionResponseDto
        -normalizeAccessType(raw: String) String
    }

    class SharingRequestManagerController {
        -SharingRequestManagerService sharingRequestManagerService
        -JwtService jwtService
        +getSharingRequests(authHeader: String, status: String, docId: Integer) List~SharingRequestResponseDto~
        +getSharingRequestById(id: Integer) SharingRequestResponseDto
        +createSharingRequest(authHeader: String, request: SharingRequestCreateRequest) SharingRequestResponseDto
        +approveSharingRequest(authHeader: String, id: Integer) SharingRequestResponseDto
        +rejectSharingRequest(authHeader: String, id: Integer) SharingRequestResponseDto
        +handleIllegalArgument(ex: IllegalArgumentException) ResponseEntity
        -extractToken(authHeader: String) String
    }

    class SharingRequestManagerService {
        -SharingRequestManagerRepository sharingRequestManagerRepository
        -DocumentManageRepository documentManageRepository
        -UserManagerRepository userManagerRepository
        -PermissionManagerRepository permissionManagerRepository
        +getAllSharingRequests() List~SharingRequestManager~
        +getSharingRequestsByStatus(status: String) List~SharingRequestManager~
        +getSharingRequestsByDocumentId(docId: Integer) List~SharingRequestManager~
        +getSharingRequestsByStatusAndDocumentId(status: String, docId: Integer) List~SharingRequestManager~
        +getIncomingRequests(actorUserId: Integer, status: String, docId: Integer) List~SharingRequestManager~
        +getSharingRequestById(id: Integer) SharingRequestManager
        +createSharingRequest(docId: Integer, recipientUserId: Integer, permission: String, actorUserId: Integer) SharingRequestManager
        +approveSharingRequest(id: Integer, actorUserId: Integer) SharingRequestManager
        +rejectSharingRequest(id: Integer, actorUserId: Integer) SharingRequestManager
        +toDto(r: SharingRequestManager) SharingRequestResponseDto
        -normalizeStatus(raw: String) String
        -normalizeAccessType(raw: String) String
    }

    class UserManagerController {
        -UserManagerService userManagerService
        +getAllUsers(q: String) List~UserManager~
        +getUserById(id: Integer) UserManager
        +exportAuditLogs() ResponseEntity
        +updateUserRole(id: Integer, user: UserManager) UserManager
        +deleteUser(id: Integer) void
    }

    class UserManagerService {
        -UserManagerRepository userManagerRepository
        +getAllUsers() List~UserManager~
        +getUserById(id: Integer) UserManager
        +createUser(user: UserManager) UserManager
        +updateUser(id: Integer, updatedUser: UserManager) UserManager
        +deleteUserById(id: Integer) void
    }

    class DocumentManageService {
        -DocumentManageRepository documentManageRepository
        -FolderManagerRepository folderManagerRepository
        -UserManagerRepository userManagerRepository
        -PermissionManagerRepository permissionManagerRepository
        +getDocuments(currentUserId: Integer, folderId: Integer, q: String) List~DocumentManage~
        +searchDocuments(currentUserId: Integer, q: String) List~DocumentManage~
        +getDocumentById(id: Integer, currentUserId: Integer) DocumentManage
        +createDocument(file: MultipartFile, folderId: Integer, title: String, currentUserId: Integer) DocumentManage
        +updateDocument(id: Integer, updatedDocument: DocumentManage, currentUserId: Integer) DocumentManage
        +moveDocument(id: Integer, folderId: Integer, currentUserId: Integer) DocumentManage
        +deleteDocumentById(id: Integer, currentUserId: Integer) void
        -resolveAccessType(doc: DocumentManage, userId: Integer) String
        -requireCanView(doc: DocumentManage, userId: Integer) void
        -requireCanEdit(doc: DocumentManage, userId: Integer) void
        -requireIsOwner(doc: DocumentManage, userId: Integer) void
        -isAdmin(user: UserManager) boolean
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
        +UserManager()
        +UserManager(userId: Integer, name: String, email: String, role: String, createdAt: LocalDateTime)
        +UserManager(name: String, email: String, password: String, role: String)
        +getUserId() Integer
        +setUserId(userId: Integer) void
        +getName() String
        +setName(name: String) void
        +getEmail() String
        +setEmail(email: String) void
        +getPassword() String
        +setPassword(password: String) void
        +getRole() String
        +setRole(role: String) void
        +getCreatedAt() LocalDateTime
        +setCreatedAt(createdAt: LocalDateTime) void
        +getDocuments() List~DocumentManage~
        +setDocuments(documents: List~DocumentManage~) void
        +getFolders() List~FolderManager~
        +setFolders(folders: List~FolderManager~) void
        +getPermissions() List~PermissionManager~
        +setPermissions(permissions: List~PermissionManager~) void
        +getSharingRequests() List~SharingRequestManager~
        +setSharingRequests(sharingRequests: List~SharingRequestManager~) void
    }

    class FolderManager {
        +Integer folderId
        +String name
        +LocalDateTime createdAt
        +UserManager owner
        +List~DocumentManage~ documents
        +FolderManager()
        +FolderManager(name: String, owner: UserManager)
        +getFolderId() Integer
        +setFolderId(folderId: Integer) void
        +getName() String
        +setName(name: String) void
        +getCreatedAt() LocalDateTime
        +setCreatedAt(createdAt: LocalDateTime) void
        +getOwner() UserManager
        +setOwner(owner: UserManager) void
        +getDocuments() List~DocumentManage~
        +setDocuments(documents: List~DocumentManage~) void
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
        +DocumentManage()
        +DocumentManage(title: String, metadata: Map, owner: UserManager)
        +getDocId() Integer
        +setDocId(docId: Integer) void
        +getTitle() String
        +setTitle(title: String) void
        +getMetadata() Map
        +setMetadata(metadata: Map) void
        +getCreatedAt() LocalDateTime
        +setCreatedAt(createdAt: LocalDateTime) void
        +getUpdatedAt() LocalDateTime
        +setUpdatedAt(updatedAt: LocalDateTime) void
        +getOwner() UserManager
        +setOwner(owner: UserManager) void
        +getFolder() FolderManager
        +setFolder(folder: FolderManager) void
        +getPermissions() List~PermissionManager~
        +setPermissions(permissions: List~PermissionManager~) void
        +getSharingRequests() List~SharingRequestManager~
        +setSharingRequests(sharingRequests: List~SharingRequestManager~) void
    }

    class PermissionManager {
        +Integer permId
        +String accessType
        +DocumentManage document
        +UserManager user
        +PermissionManager()
        +PermissionManager(accessType: String, document: DocumentManage, user: UserManager)
        +getPermId() Integer
        +setPermId(permId: Integer) void
        +getAccessType() String
        +setAccessType(accessType: String) void
        +getDocument() DocumentManage
        +setDocument(document: DocumentManage) void
        +getUser() UserManager
        +setUser(user: UserManager) void
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
        +SharingRequestManager()
        +SharingRequestManager(accessType: String, document: DocumentManage, user: UserManager, sharingUser: UserManager)
        +getSharingReqId() Integer
        +setSharingReqId(sharingReqId: Integer) void
        +getAccessType() String
        +setAccessType(accessType: String) void
        +getStatus() String
        +setStatus(status: String) void
        +getCreatedAt() LocalDateTime
        +setCreatedAt(createdAt: LocalDateTime) void
        +getUpdatedAt() LocalDateTime
        +setUpdatedAt(updatedAt: LocalDateTime) void
        +getDocument() DocumentManage
        +setDocument(document: DocumentManage) void
        +getUser() UserManager
        +setUser(user: UserManager) void
        +getSharingUser() UserManager
        +setSharingUser(sharingUser: UserManager) void
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
    A[Người dùng mở ứng dụng] --> B{Đã xác thực chưa?}
    B -- Chưa --> C[POST /api/v1/auth/register hoặc POST /api/v1/auth/login]
    C --> D[Nhập thông tin đăng nhập / đăng ký]
    D --> E[Backend tạo JWT token]
    E --> F[Lưu token vào frontend]
    F --> G[Đi tới dashboard]

    B -- Rồi --> G
    G --> H[GET /api/v1/folders hoặc GET /api/v1/documents]
    H --> I{Người dùng chọn hành động gì?}

    I -- Upload tài liệu --> J[POST /api/v1/documents/upload]
    J --> K[Kiểm tra file và quyền sở hữu]
    K --> L[Lưu file và metadata vào database]
    L --> M[Tạo quyền Owner cho người upload]

    I -- Tạo thư mục --> N[POST /api/v1/folders]
    N --> O[Kiểm tra quyền tạo thư mục]
    O --> P[Lưu thư mục mới]

    I -- Chia sẻ tài liệu --> Q[POST /api/v1/sharing-requests]
    Q --> R[Chờ người nhận duyệt]
    R --> S{Yêu cầu được duyệt không?}
    S -- Có --> T[POST /api/v1/sharing-requests/:id/approve]
    T --> U[Tạo hoặc cập nhật quyền truy cập]
    S -- Không --> V[POST /api/v1/sharing-requests/:id/reject]

    I -- Đổi vai trò --> W[PATCH /api/v1/users/:id/role]
    W --> X[Quản trị viên kiểm tra và cập nhật role]
    X --> Y[Lưu role mới]

    I -- Tải tài liệu --> Z[GET /api/v1/documents/:id]
    Z --> AA[Kiểm tra quyền truy cập]
    AA --> AB[Trả về dữ liệu file]

    I -- Đăng xuất --> AC[POST /api/v1/auth/logout]
    AC --> AD[Xóa token ở frontend]
    AD --> AE[Kết thúc phiên làm việc]
```

## 5) High-Level App Context

```mermaid
flowchart LR
    Frontend[Frontend React + Vite + TypeScript] --> AuthAPI[POST /api/v1/auth/register\nPOST /api/v1/auth/login\nGET /api/v1/auth/me\nPOST /api/v1/auth/logout]
    Frontend --> FolderAPI[GET /api/v1/folders\nPOST /api/v1/folders\nPATCH /api/v1/folders/:id\nDELETE /api/v1/folders/:id]
    Frontend --> DocAPI[GET /api/v1/documents\nPOST /api/v1/documents/upload\nGET /api/v1/documents/:id\nPATCH /api/v1/documents/:id\nPOST /api/v1/documents/:id/move\nDELETE /api/v1/documents/:id]
    Frontend --> ShareAPI[GET /api/v1/sharing-requests\nPOST /api/v1/sharing-requests\nPOST /api/v1/sharing-requests/:id/approve\nPOST /api/v1/sharing-requests/:id/reject]
    Frontend --> UserAPI[GET /api/v1/users\nPATCH /api/v1/users/:id/role\nGET /api/v1/users/audit/export]

    AuthAPI --> Backend[Backend Spring Boot]
    FolderAPI --> Backend
    DocAPI --> Backend
    ShareAPI --> Backend
    UserAPI --> Backend

    Backend --> Database[(PostgreSQL RDS)]
    Backend --> FileStore[Lưu nội dung file / metadata]
    Backend --> JWT[Xác thực JWT Bearer]
```

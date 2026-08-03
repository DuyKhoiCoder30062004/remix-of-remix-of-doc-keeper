# ⚠️ IMPLEMENTATION GUIDE - Circular Reference Fix

## Problem Summary
Your Spring Boot backend crashes with:
```
Document nesting depth (501) exceeds the maximum allowed (500)
```

**Cause:** JPA entities have circular references that cause infinite JSON serialization loops.

---

## Solution: Replace 5 Entity Files

### Step 1: Add Import Statement
All fixed files now include:
```java
import com.fasterxml.jackson.annotation.JsonIgnore;
```

This tells Jackson to skip serializing certain fields to prevent circular references.

---

## Step 2: Update Entity Files (Copy-Paste)

| # | Original File | FIXED File |
|---|---|---|
| 1 | `UserManager.java` | `UserManager_FIXED.java` |
| 2 | `DocumentManage.java` | `DocumentManage_FIXED.java` |
| 3 | `PermissionManager.java` | `PermissionManager_FIXED.java` |
| 4 | `FolderManager.java` | `FolderManager_FIXED.java` |
| 5 | `SharingRequestManager.java` | `SharingRequestManager_FIXED.java` |

### Instructions:
1. **For each file above:**
   - Open the original file in your IDE
   - Delete all its content
   - Copy-paste content from the FIXED version
   - Save

2. **Or use Maven/Gradle refresh** to reload changes

---

## Step 3: What Changed (Highlighted)

### UserManager.java
**Added:**
```java
import com.fasterxml.jackson.annotation.JsonIgnore;

@JsonIgnore  // ⭐ NEW - Prevents circular document serialization
@OneToMany(mappedBy = "owner", cascade = CascadeType.ALL, orphanRemoval = true)
private List<DocumentManage> documents = new ArrayList<>();

@JsonIgnore  // ⭐ NEW - Prevents circular folder serialization
@OneToMany(mappedBy = "owner", cascade = CascadeType.ALL, orphanRemoval = true)
private List<FolderManager> folders = new ArrayList<>();

@JsonIgnore  // ⭐ NEW - Breaks permission reference cycles
@OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
private List<PermissionManager> permissions = new ArrayList<>();

@JsonIgnore  // ⭐ NEW - Breaks sharing request cycles
@OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
private List<SharingRequestManager> sharingRequests = new ArrayList<>();
```

### DocumentManage.java
**Added:**
```java
import com.fasterxml.jackson.annotation.JsonIgnore;

@JsonIgnore  // ⭐ NEW - Prevents UserManager → documents → owner → infinite loop
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "owner_id")
private UserManager owner;
```

### PermissionManager.java
**Added:**
```java
import com.fasterxml.jackson.annotation.JsonIgnore;

@JsonIgnore  // ⭐ NEW - Breaks document reference cycle
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "doc_id")
private DocumentManage document;

@JsonIgnore  // ⭐ NEW - Breaks user reference cycle
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "user_id")
private UserManager user;
```

### FolderManager.java
**Added:**
```java
import com.fasterxml.jackson.annotation.JsonIgnore;

@JsonIgnore  // ⭐ NEW - Prevents UserManager → folders → owner → infinite loop
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "owner_id")
private UserManager owner;

@JsonIgnore  // ⭐ NEW - Prevents nested document serialization
@OneToMany(mappedBy = "folder", cascade = CascadeType.ALL, orphanRemoval = true)
private List<DocumentManage> documents = new ArrayList<>();
```

### SharingRequestManager.java
**Added:**
```java
import com.fasterxml.jackson.annotation.JsonIgnore;

@JsonIgnore  // ⭐ NEW - Breaks document reference cycle
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "doc_id")
private DocumentManage document;

@JsonIgnore  // ⭐ NEW - Breaks user reference cycle
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "user_id")
private UserManager user;

@JsonIgnore  // ⭐ NEW - Breaks sharing_user reference cycle
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "sharing_user_id")
private UserManager sharingUser;
```

---

## Step 4: Verify & Test

### Recompile:
```bash
mvn clean compile
# or
gradle clean build
```

### Restart Spring Boot:
```bash
mvn spring-boot:run
# or
gradle bootRun
```

### Test Login Again:
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"marcus@company.com","password":"password123"}'
```

**Expected Response (no nesting depth error):**
```json
{
  "token": "mock.{uuid}",
  "user": {
    "userId": 1,
    "name": "Marcus",
    "email": "marcus@company.com",
    "role": "Admin",
    "createdAt": "2026-07-20T10:30:00"
  }
}
```

---

## Step 5: Test Dashboard Fetch

From your React frontend (should now work):
```bash
# Login token from above
TOKEN="mock.{uuid}"

# Get documents
curl -X GET http://localhost:8080/api/v1/documents \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:** Clean JSON array of documents WITHOUT circular nesting

---

## Why This Works

### Before (@JsonIgnore applied):
```
UserManager
├── documents: [DocumentManage]
│   └── owner: UserManager  ← CIRCULAR! Includes owner field
│       ├── documents: [DocumentManage]  ← Tries to serialize again
│       │   └── owner: UserManager  ← Infinite loop
│       │       ├── documents...
│       │       │   └── owner...
│       │       │       └── documents...  [501 depth exceeded]
```

### After (@JsonIgnore applied):
```
UserManager
├── documents: [null/skipped]  ← @JsonIgnore prevents serialization
├── folders: [null/skipped]    ← @JsonIgnore prevents serialization
├── permissions: [null/skipped]  ← @JsonIgnore prevents serialization
└── sharingRequests: [null/skipped]  ← @JsonIgnore prevents serialization

DocumentManage
├── title: "Q4_Audit_Report.pdf"
├── metadata: {...}
├── owner: [null/skipped]  ← @JsonIgnore prevents circular reference
└── createdAt: "2026-07-20T10:30:00"
```

The collections/references are **still there** in memory (database works fine), but JSON serialization **skips them** to prevent infinite loops.

---

## Future Enhancement (Optional)

If frontend needs owner/user details, create **DTOs** instead:

```java
// DocumentResponseDto.java
public class DocumentResponseDto {
    private Integer docId;
    private String title;
    private String metadata;
    private LocalDateTime createdAt;
    private Integer ownerId;  // ⭐ Just the ID, not full object
    private String ownerName;  // ⭐ Just the name
    private LocalDateTime updatedAt;
    
    // No circular references!
}
```

Then return `DocumentResponseDto` instead of `DocumentManage` in controllers.

---

## Checklist

- [ ] Replace UserManager.java
- [ ] Replace DocumentManage.java
- [ ] Replace PermissionManager.java
- [ ] Replace FolderManager.java
- [ ] Replace SharingRequestManager.java
- [ ] Run `mvn clean compile`
- [ ] Restart Spring Boot
- [ ] Test login endpoint
- [ ] Test GET /api/v1/documents
- [ ] Verify frontend receives data without errors

**Status:** Ready to implement! 🚀

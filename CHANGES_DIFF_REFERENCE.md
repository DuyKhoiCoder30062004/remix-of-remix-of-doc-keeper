# 📋 QUICK REFERENCE - All Changes at a Glance

## File 1: UserManager.java

```diff
  import jakarta.persistence.*;
+ import com.fasterxml.jackson.annotation.JsonIgnore;
  import java.time.LocalDateTime;

  @Entity
  @Table(name = "users")
  public class UserManager {
      
-     @OneToMany(mappedBy = "owner", cascade = CascadeType.ALL, orphanRemoval = true)
+     @JsonIgnore
+     @OneToMany(mappedBy = "owner", cascade = CascadeType.ALL, orphanRemoval = true)
      private List<DocumentManage> documents = new ArrayList<>();

-     @OneToMany(mappedBy = "owner", cascade = CascadeType.ALL, orphanRemoval = true)
+     @JsonIgnore
+     @OneToMany(mappedBy = "owner", cascade = CascadeType.ALL, orphanRemoval = true)
      private List<FolderManager> folders = new ArrayList<>();

-     @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
+     @JsonIgnore
+     @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
      private List<PermissionManager> permissions = new ArrayList<>();

-     @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
+     @JsonIgnore
+     @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
      private List<SharingRequestManager> sharingRequests = new ArrayList<>();
  }
```

**Changes:** Added `@JsonIgnore` before **4 @OneToMany** annotations
**Location:** Lines with OneToMany relationships

---

## File 2: DocumentManage.java

```diff
  import jakarta.persistence.*;
+ import com.fasterxml.jackson.annotation.JsonIgnore;
  import java.time.LocalDateTime;

  @Entity
  @Table(name = "documents")
  public class DocumentManage {
      
-     @ManyToOne(fetch = FetchType.LAZY)
+     @JsonIgnore
+     @ManyToOne(fetch = FetchType.LAZY)
      @JoinColumn(name = "owner_id")
      private UserManager owner;
  }
```

**Changes:** Added `@JsonIgnore` before **1 @ManyToOne** annotation (owner field)
**Location:** ManyToOne relationship to UserManager

---

## File 3: PermissionManager.java

```diff
  import jakarta.persistence.*;
+ import com.fasterxml.jackson.annotation.JsonIgnore;
  import java.util.Objects;

  @Entity
  @Table(name = "permissions")
  public class PermissionManager {
      
-     @ManyToOne(fetch = FetchType.LAZY)
+     @JsonIgnore
+     @ManyToOne(fetch = FetchType.LAZY)
      @JoinColumn(name = "doc_id")
      private DocumentManage document;

-     @ManyToOne(fetch = FetchType.LAZY)
+     @JsonIgnore
+     @ManyToOne(fetch = FetchType.LAZY)
      @JoinColumn(name = "user_id")
      private UserManager user;
  }
```

**Changes:** Added `@JsonIgnore` before **2 @ManyToOne** annotations
**Locations:** document and user fields

---

## File 4: FolderManager.java

```diff
  import jakarta.persistence.*;
+ import com.fasterxml.jackson.annotation.JsonIgnore;
  import java.time.LocalDateTime;

  @Entity
  @Table(name = "folders")
  public class FolderManager {
      
-     @ManyToOne(fetch = FetchType.LAZY)
+     @JsonIgnore
+     @ManyToOne(fetch = FetchType.LAZY)
      @JoinColumn(name = "owner_id")
      private UserManager owner;

-     @OneToMany(mappedBy = "folder", cascade = CascadeType.ALL, orphanRemoval = true)
+     @JsonIgnore
+     @OneToMany(mappedBy = "folder", cascade = CascadeType.ALL, orphanRemoval = true)
      private List<DocumentManage> documents = new ArrayList<>();
  }
```

**Changes:** Added `@JsonIgnore` before **1 @ManyToOne** and **1 @OneToMany** annotations
**Locations:** owner and documents fields

---

## File 5: SharingRequestManager.java

```diff
  import jakarta.persistence.*;
+ import com.fasterxml.jackson.annotation.JsonIgnore;
  import java.time.LocalDateTime;

  @Entity
  @Table(name = "sharing_requests")
  public class SharingRequestManager {
      
-     @ManyToOne(fetch = FetchType.LAZY)
+     @JsonIgnore
+     @ManyToOne(fetch = FetchType.LAZY)
      @JoinColumn(name = "doc_id")
      private DocumentManage document;

-     @ManyToOne(fetch = FetchType.LAZY)
+     @JsonIgnore
+     @ManyToOne(fetch = FetchType.LAZY)
      @JoinColumn(name = "user_id")
      private UserManager user;

-     @ManyToOne(fetch = FetchType.LAZY)
+     @JsonIgnore
+     @ManyToOne(fetch = FetchType.LAZY)
      @JoinColumn(name = "sharing_user_id")
      private UserManager sharingUser;
  }
```

**Changes:** Added `@JsonIgnore` before **3 @ManyToOne** annotations
**Locations:** document, user, and sharingUser fields

---

## Summary of All Modifications

| File | Field | Annotation Count | Action |
|------|-------|------------------|--------|
| UserManager.java | documents, folders, permissions, sharingRequests | 4 | Add @JsonIgnore |
| DocumentManage.java | owner | 1 | Add @JsonIgnore |
| PermissionManager.java | document, user | 2 | Add @JsonIgnore |
| FolderManager.java | owner, documents | 2 | Add @JsonIgnore |
| SharingRequestManager.java | document, user, sharingUser | 3 | Add @JsonIgnore |
| **TOTAL** | **12 relationships** | **12** | **Add @JsonIgnore** |

**All files also need:** `import com.fasterxml.jackson.annotation.JsonIgnore;` at the top

---

## What Gets Ignored in JSON Response

When serializing to JSON, these fields will be completely excluded:

```java
// UserManager serialization now SKIPS:
// - documents (entire list)
// - folders (entire list)
// - permissions (entire list)
// - sharingRequests (entire list)

// DocumentManage serialization now SKIPS:
// - owner (entire UserManager object)

// PermissionManager serialization now SKIPS:
// - document (entire DocumentManage object)
// - user (entire UserManager object)

// FolderManager serialization now SKIPS:
// - owner (entire UserManager object)
// - documents (entire list)

// SharingRequestManager serialization now SKIPS:
// - document (entire DocumentManage object)
// - user (entire UserManager object)
// - sharingUser (entire UserManager object)
```

**Database operations:** Not affected - relations still work in code
**REST API Responses:** Clean JSON without circular references
**Frontend:** Receives valid JSON and can parse correctly

---

## Revert Instructions (if needed)

If you want to revert these changes:
1. Remove `@JsonIgnore` annotations from all fields
2. Remove `import com.fasterxml.jackson.annotation.JsonIgnore;`
3. Rebuild and restart

Note: This will bring back the nesting depth error unless you implement DTOs.

---

**Implementation Status: Ready ✅**

All 5 fixed files are in the workspace. Copy them to your actual Spring Boot project now!

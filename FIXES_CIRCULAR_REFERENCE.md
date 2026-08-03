# ✅ CIRCULAR REFERENCE FIX - JSON Serialization Issue

## Problem Identified
**Error:** `Document nesting depth (501) exceeds the maximum allowed (500)`

**Root Cause:** Circular references in JPA entity relationships cause infinite JSON serialization loops:
```
UserManager → Documents (owner) → UserManager (back-ref) → Documents → ... [infinite recursion]
```

## Solution Applied
Added `@JsonIgnore` annotations to break serialization cycles on these relationships:

| Entity | Field | Annotation | Reason |
|--------|-------|-----------|---------|
| **UserManager** | documents, folders, permissions, sharingRequests | @JsonIgnore | Prevent serializing entire object graphs when returning users |
| **DocumentManage** | owner | @JsonIgnore | Prevent back-reference to UserManager during document serialization |
| **PermissionManager** | document, user | @JsonIgnore | Break bidirectional reference cycles |
| **FolderManager** | owner, documents | @JsonIgnore | Prevent nested serialization chains |
| **SharingRequestManager** | document, user, sharingUser | @JsonIgnore | Break all circular paths |

## Files Modified

### 1. **UserManager.java** ⭐
```
ADDED: import com.fasterxml.jackson.annotation.JsonIgnore;
MODIFIED: @OneToMany collections → Add @JsonIgnore before each
- documents
- folders  
- permissions
- sharingRequests
```

### 2. **DocumentManage.java** ⭐
```
ADDED: import com.fasterxml.jackson.annotation.JsonIgnore;
MODIFIED: @ManyToOne owner field → Add @JsonIgnore
REASON: Prevents UserManager serialization during document response
```

### 3. **PermissionManager.java** ⭐
```
ADDED: import com.fasterxml.jackson.annotation.JsonIgnore;
MODIFIED: document, user fields → Add @JsonIgnore
REASON: Breaks bidirectional reference loops
```

### 4. **FolderManager.java** ⭐
```
ADDED: import com.fasterxml.jackson.annotation.JsonIgnore;
MODIFIED: owner, documents fields → Add @JsonIgnore
REASON: Prevent nested object graph serialization
```

### 5. **SharingRequestManager.java** ⭐
```
ADDED: import com.fasterxml.jackson.annotation.JsonIgnore;
MODIFIED: document, user, sharingUser fields → Add @JsonIgnore
REASON: Break all circular reference paths
```

## Testing
After applying fixes:
1. ✓ Login should work without nesting depth error
2. ✓ GET /api/v1/documents should return clean JSON
3. ✓ Frontend will receive data without stack overflow

## Note
If frontend needs nested object details (e.g., owner info), create **DTOs (Data Transfer Objects)** instead of serializing full entities. This provides better control and performance.

---
**Status:** Ready to implement in actual Spring Boot project

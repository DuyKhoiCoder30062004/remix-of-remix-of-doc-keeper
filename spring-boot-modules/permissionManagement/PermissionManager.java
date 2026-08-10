package com.saigontechnologyintern.document_management.permissionManagement;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.saigontechnologyintern.document_management.documentManagement.DocumentManage;
import com.saigontechnologyintern.document_management.userManagement.UserManager;
import jakarta.persistence.*;
import java.util.Objects;

@Entity
@Table(name = "permissions")
public class PermissionManager {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "perm_id")
    private Integer permId;

    @Column(name = "access_type", nullable = false, length = 20)
    private String accessType;

    // ⭐ MODIFICATION: Added @JsonIgnore to break circular reference
    // Prevents: PermissionManager → document → permissions → document → infinite loop
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doc_id")
    private DocumentManage document;

    // ⭐ MODIFICATION: Added @JsonIgnore to break circular reference
    // Prevents: PermissionManager → user → permissions → user → infinite loop
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private UserManager user;

    public PermissionManager() {
    }

    public PermissionManager(String accessType, DocumentManage document, UserManager user) {
        this.accessType = accessType;
        this.document = document;
        this.user = user;
    }

    public Integer getPermId() {
        return permId;
    }

    public void setPermId(Integer permId) {
        this.permId = permId;
    }

    public String getAccessType() {
        return accessType;
    }

    public void setAccessType(String accessType) {
        this.accessType = accessType;
    }

    public DocumentManage getDocument() {
        return document;
    }

    public void setDocument(DocumentManage document) {
        this.document = document;
    }

    public UserManager getUser() {
        return user;
    }

    public void setUser(UserManager user) {
        this.user = user;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof PermissionManager that)) return false;
        return Objects.equals(permId, that.permId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(permId);
    }
}
package com.saigontechnologyintern.document_management.userManagement;

import com.saigontechnologyintern.document_management.documentManagement.DocumentManage;
import com.saigontechnologyintern.document_management.folderManagement.FolderManager;
import com.saigontechnologyintern.document_management.permissionManagement.PermissionManager;
import com.saigontechnologyintern.document_management.sharingRequestManagement.SharingRequestManager;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Entity
@Table(name = "users")
public class UserManager {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Integer userId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(unique = true, nullable = false, length = 255)
    private String email;

    @Column(nullable = false, length = 255)
    private String password;

    @Column(nullable = false, length = 50)
    private String role;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // ⭐ MODIFICATION: Added @JsonIgnore to break circular serialization
    // Prevents: UserManager → documents → owner (UserManager) → infinite loop
    @JsonIgnore
    @OneToMany(mappedBy = "owner", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DocumentManage> documents = new ArrayList<>();

    // ⭐ MODIFICATION: Added @JsonIgnore
    // Prevents nested FolderManager serialization when returning UserManager
    @JsonIgnore
    @OneToMany(mappedBy = "owner", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<FolderManager> folders = new ArrayList<>();

    // ⭐ MODIFICATION: Added @JsonIgnore
    // Prevents PermissionManager → user → permissions → user → infinite recursion
    @JsonIgnore
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PermissionManager> permissions = new ArrayList<>();

    // ⭐ MODIFICATION: Added @JsonIgnore
    // Prevents SharingRequestManager circular references
    @JsonIgnore
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SharingRequestManager> sharingRequests = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }

    public UserManager() {
    }

    public UserManager(String name, String email, String password, String role) {
        this.name = name;
        this.email = email;
        this.password = password;
        this.role = role;
    }

    public UserManager(Integer userId, String name, String email, String role, LocalDateTime createdAt) {
        this.userId = userId;
        this.name = name;
        this.email = email;
        this.role = role;
        this.createdAt = createdAt;
    }

    // Getters and Setters
    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public List<DocumentManage> getDocuments() {
        return documents;
    }

    public void setDocuments(List<DocumentManage> documents) {
        this.documents = documents;
    }

    public List<FolderManager> getFolders() {
        return folders;
    }

    public void setFolders(List<FolderManager> folders) {
        this.folders = folders;
    }

    public List<PermissionManager> getPermissions() {
        return permissions;
    }

    public void setPermissions(List<PermissionManager> permissions) {
        this.permissions = permissions;
    }

    public List<SharingRequestManager> getSharingRequests() {
        return sharingRequests;
    }

    public void setSharingRequests(List<SharingRequestManager> sharingRequests) {
        this.sharingRequests = sharingRequests;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        UserManager that = (UserManager) o;
        return Objects.equals(userId, that.userId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId);
    }
}

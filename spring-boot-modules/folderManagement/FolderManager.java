package com.saigontechnologyintern.document_management.folderManagement;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.saigontechnologyintern.document_management.documentManagement.DocumentManage;
import com.saigontechnologyintern.document_management.userManagement.UserManager;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Entity
@Table(name = "folders")
public class FolderManager {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "folder_id")
    private Integer folderId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // ⭐ MODIFICATION: Added @JsonIgnore to break circular reference
    // Prevents: UserManager → folders → owner (UserManager) → infinite loop
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private UserManager owner;

    // ⭐ MODIFICATION: Added @JsonIgnore
    // Prevents: Nested serialization of all documents when returning folder
    @JsonIgnore
    @OneToMany(mappedBy = "folder", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DocumentManage> documents = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public FolderManager() {
    }

    public FolderManager(String name, UserManager owner) {
        this.name = name;
        this.owner = owner;
    }

    public Integer getFolderId() {
        return folderId;
    }

    public void setFolderId(Integer folderId) {
        this.folderId = folderId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public UserManager getOwner() {
        return owner;
    }

    public void setOwner(UserManager owner) {
        this.owner = owner;
    }

    public List<DocumentManage> getDocuments() {
        return documents;
    }

    public void setDocuments(List<DocumentManage> documents) {
        this.documents = documents;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof FolderManager that)) return false;
        return Objects.equals(folderId, that.folderId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(folderId);
    }
}
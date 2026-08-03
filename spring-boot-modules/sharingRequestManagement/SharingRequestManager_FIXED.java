package com.saigontechnologyintern.document_management.sharingRequestManagement;

import com.saigontechnologyintern.document_management.documentManagement.DocumentManage;
import com.saigontechnologyintern.document_management.userManagement.UserManager;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "sharing_requests")
public class SharingRequestManager {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "sharing_req_id")
    private Integer sharingReqId;

    @Column(name = "access_type", nullable = false, length = 20)
    private String accessType;

    @Column(nullable = false, length = 20)
    private String status; // Pending, Approved, Rejected

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ⭐ MODIFICATION: Added @JsonIgnore to break circular reference
    // Prevents: SharingRequestManager → document → sharingRequests → document → infinite loop
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doc_id")
    private DocumentManage document;

    // ⭐ MODIFICATION: Added @JsonIgnore to break circular reference
    // Prevents: SharingRequestManager → user → sharingRequests → user → infinite loop
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private UserManager user;

    // ⭐ MODIFICATION: Added @JsonIgnore for sharing_user reference
    // Prevents: Circular reference chain through multiple user references
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sharing_user_id")
    private UserManager sharingUser;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.updatedAt == null) {
            this.updatedAt = LocalDateTime.now();
        }
        if (this.status == null) {
            this.status = "Pending";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public SharingRequestManager() {
    }

    public SharingRequestManager(String accessType, DocumentManage document, UserManager user, UserManager sharingUser) {
        this.accessType = accessType;
        this.document = document;
        this.user = user;
        this.sharingUser = sharingUser;
        this.status = "Pending";
    }

    public Integer getSharingReqId() {
        return sharingReqId;
    }

    public void setSharingReqId(Integer sharingReqId) {
        this.sharingReqId = sharingReqId;
    }

    public String getAccessType() {
        return accessType;
    }

    public void setAccessType(String accessType) {
        this.accessType = accessType;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
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

    public UserManager getSharingUser() {
        return sharingUser;
    }

    public void setSharingUser(UserManager sharingUser) {
        this.sharingUser = sharingUser;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        SharingRequestManager that = (SharingRequestManager) o;
        return Objects.equals(sharingReqId, that.sharingReqId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(sharingReqId);
    }
}

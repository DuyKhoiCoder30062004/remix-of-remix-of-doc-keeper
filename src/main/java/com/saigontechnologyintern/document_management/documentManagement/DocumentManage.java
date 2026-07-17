package com.saigontechnologyintern.document_management.documentManagement;

import com.saigontechnologyintern.document_management.folderManagement.FolderManager;
import com.saigontechnologyintern.document_management.permissionManagement.PermissionManager;
import com.saigontechnologyintern.document_management.sharingRequestManagement.SharingRequestManager;
import com.saigontechnologyintern.document_management.userManagement.UserManager;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Entity
@Table(name = "documents")
public class DocumentManage {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "doc_id")
  private Integer docId;

  @Column(nullable = false, length = 255)
  private String title;

  @Column(columnDefinition = "jsonb")
  private String metadata;

  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @Column(name = "updated_at")
  private LocalDateTime updatedAt;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "owner_id")
  private UserManager owner;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "folder_id")
  private FolderManager folder;

  @OneToMany(mappedBy = "document", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<PermissionManager> permissions = new ArrayList<>();

  @OneToMany(mappedBy = "document", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<SharingRequestManager> sharingRequests = new ArrayList<>();

  @PrePersist
  protected void onCreate() {
    createdAt = LocalDateTime.now();
    updatedAt = createdAt;
  }

  @PreUpdate
  protected void onUpdate() {
    updatedAt = LocalDateTime.now();
  }

  public DocumentManage() {}

  public DocumentManage(String title, String metadata, UserManager owner) {
    this.title = title;
    this.metadata = metadata;
    this.owner = owner;
  }

  public Integer getDocId() {
    return docId;
  }

  public void setDocId(Integer docId) {
    this.docId = docId;
  }

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public String getMetadata() {
    return metadata;
  }

  public void setMetadata(String metadata) {
    this.metadata = metadata;
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

  public UserManager getOwner() {
    return owner;
  }

  public void setOwner(UserManager owner) {
    this.owner = owner;
  }

  public FolderManager getFolder() {
    return folder;
  }

  public void setFolder(FolderManager folder) {
    this.folder = folder;
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
    if (!(o instanceof DocumentManage that)) return false;
    return Objects.equals(docId, that.docId);
  }

  @Override
  public int hashCode() {
    return Objects.hash(docId);
  }
}

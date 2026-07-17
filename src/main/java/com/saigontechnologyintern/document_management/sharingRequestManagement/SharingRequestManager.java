package com.saigontechnologyintern.document_management.sharingRequestManagement;

import com.saigontechnologyintern.document_management.documentManagement.DocumentManage;
import com.saigontechnologyintern.document_management.userManagement.UserManager;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "sharing_requests")
public class SharingRequestManager {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "request_id")
  private Integer requestId;

  @Column(length = 20)
  private String status;

  @Column(name = "requested_at", nullable = false, updatable = false)
  private LocalDateTime requestedAt;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "doc_id")
  private DocumentManage document;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "requester_id")
  private UserManager requester;

  @PrePersist
  protected void onCreate() {
    requestedAt = LocalDateTime.now();
  }

  public SharingRequestManager() {}

  public SharingRequestManager(String status, DocumentManage document, UserManager requester) {
    this.status = status;
    this.document = document;
    this.requester = requester;
  }

  public Integer getRequestId() {
    return requestId;
  }

  public void setRequestId(Integer requestId) {
    this.requestId = requestId;
  }

  public String getStatus() {
    return status;
  }

  public void setStatus(String status) {
    this.status = status;
  }

  public LocalDateTime getRequestedAt() {
    return requestedAt;
  }

  public void setRequestedAt(LocalDateTime requestedAt) {
    this.requestedAt = requestedAt;
  }

  public DocumentManage getDocument() {
    return document;
  }

  public void setDocument(DocumentManage document) {
    this.document = document;
  }

  public UserManager getRequester() {
    return requester;
  }

  public void setRequester(UserManager requester) {
    this.requester = requester;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (!(o instanceof SharingRequestManager that)) return false;
    return Objects.equals(requestId, that.requestId);
  }

  @Override
  public int hashCode() {
    return Objects.hash(requestId);
  }
}

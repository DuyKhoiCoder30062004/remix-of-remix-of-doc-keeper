package com.saigontechnologyintern.document_management.documentManagement;

import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class DocumentManageService {
  private final DocumentManageRepository documentManageRepository;

  public DocumentManageService(DocumentManageRepository documentManageRepository) {
    this.documentManageRepository = documentManageRepository;
  }

  public List<DocumentManage> getAllDocuments() {
    return documentManageRepository.findAll();
  }

  public List<DocumentManage> getDocuments(Integer folderId, String q) {
    if (folderId != null) {
      if (q != null && !q.isBlank()) {
        return documentManageRepository.findByFolder_FolderId(folderId).stream()
            .filter(doc -> doc.getTitle() != null && doc.getTitle().toLowerCase().contains(q.toLowerCase()))
            .toList();
      }
      return documentManageRepository.findByFolder_FolderId(folderId);
    }
    return searchDocuments(q);
  }

  public List<DocumentManage> searchDocuments(String q) {
    if (q == null || q.isBlank()) {
      return documentManageRepository.findAll();
    }
    return documentManageRepository.findByTitleContainingIgnoreCase(q);
  }

  public DocumentManage getDocumentById(Integer id) {
    return documentManageRepository
        .findById(id)
        .orElseThrow(() -> new IllegalArgumentException("Document not found with id: " + id));
  }

  public DocumentManage createDocument(DocumentManage document) {
    return documentManageRepository.save(document);
  }

  public DocumentManage updateDocument(Integer id, DocumentManage updatedDocument) {
    DocumentManage existing = getDocumentById(id);
    if (updatedDocument.getTitle() != null) {
      existing.setTitle(updatedDocument.getTitle());
    }
    if (updatedDocument.getMetadata() != null) {
      existing.setMetadata(updatedDocument.getMetadata());
    }
    if (updatedDocument.getOwner() != null) {
      existing.setOwner(updatedDocument.getOwner());
    }
    if (updatedDocument.getFolder() != null) {
      existing.setFolder(updatedDocument.getFolder());
    }
    return documentManageRepository.save(existing);
  }

  public DocumentManage moveDocument(Integer id, DocumentManage updatedDocument) {
    DocumentManage existing = getDocumentById(id);
    existing.setFolder(updatedDocument.getFolder());
    return documentManageRepository.save(existing);
  }

  public void deleteDocumentById(Integer id) {
    if (!documentManageRepository.existsById(id)) {
      throw new IllegalArgumentException("Document not found with id: " + id);
    }
    documentManageRepository.deleteById(id);
  }
}

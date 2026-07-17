package com.saigontechnologyintern.document_management.documentManagement;

import java.util.List;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/documents")
@CrossOrigin(
    origins = {"http://localhost:5173", "http://localhost:8080", "https://*.lovable.app"},
    allowedHeaders = {"Authorization", "Content-Type", "Accept", "Origin"},
    methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PATCH, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class DocumentManageController {
  private final DocumentManageService documentManageService;

  public DocumentManageController(DocumentManageService documentManageService) {
    this.documentManageService = documentManageService;
  }

  @GetMapping
  public List<DocumentManage> getDocuments(
      @RequestParam(value = "folder_id", required = false) Integer folderId,
      @RequestParam(value = "q", required = false) String q) {
    return documentManageService.getDocuments(folderId, q);
  }

  @GetMapping("/search")
  public List<DocumentManage> searchDocuments(@RequestParam("q") String q) {
    return documentManageService.searchDocuments(q);
  }

  @GetMapping("/{id}")
  public DocumentManage getDocumentById(@PathVariable Integer id) {
    return documentManageService.getDocumentById(id);
  }

  @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public DocumentManage createDocument(
      @RequestParam("file") MultipartFile file,
      @RequestParam(value = "folder_id", required = false) Integer folderId,
      @RequestParam(value = "title", required = false) String title) {
    DocumentManage document = new DocumentManage();
    document.setTitle(title != null && !title.isBlank() ? title : file.getOriginalFilename());
    document.setMetadata(file.getContentType());
    return documentManageService.createDocument(document);
  }

  @PatchMapping("/{id}")
  public DocumentManage updateDocument(@PathVariable Integer id, @RequestBody DocumentManage document) {
    return documentManageService.updateDocument(id, document);
  }

  @PatchMapping("/{id}/move")
  public DocumentManage moveDocument(@PathVariable Integer id, @RequestBody DocumentManage document) {
    return documentManageService.moveDocument(id, document);
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteDocument(@PathVariable Integer id) {
    documentManageService.deleteDocumentById(id);
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/{id}/download")
  public ResponseEntity<byte[]> downloadDocument(@PathVariable Integer id) {
    return ResponseEntity.ok().body(new byte[] {1, 2, 3});
  }

  @GetMapping("/{id}/audit")
  public List<String> auditLog(@PathVariable Integer id) {
    return List.of("placeholder-audit");
  }
}

package com.saigontechnologyintern.document_management;

import java.time.Instant;
import java.util.UUID;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

public class DocumentDomainSkeleton {
  public static class Document {
    private UUID docId;
    private String title;
    private UUID ownerId;
    private UUID folderId;
    private Instant createdAt;
    private Instant updatedAt;
  }

  public interface DocumentRepository {}

  public static class DocumentService {
    private final DocumentRepository repository;

    public DocumentService(DocumentRepository repository) {
      this.repository = repository;
    }
  }

  @RestController
  @RequestMapping("/api/v1/documents")
  @CrossOrigin(
      allowedOriginPatterns = {"http://localhost:*", "http://127.0.0.1:*", "https://*.lovable.app"},
      allowedHeaders = {"Authorization", "Content-Type", "Accept", "Origin"},
      methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.PATCH, RequestMethod.DELETE, RequestMethod.OPTIONS})
  public static class DocumentController {
    private final DocumentService service;

    public DocumentController(DocumentService service) {
      this.service = service;
    }

    @GetMapping
    public String listDocuments(@RequestParam(required = false) String folderId, @RequestParam(required = false) String q) {
      return "placeholder documents response";
    }

    @GetMapping("/search")
    public String searchDocuments(@RequestParam String q) {
      return "placeholder search response";
    }

    @GetMapping("/{id}")
    public String getDocument(@PathVariable String id) {
      return "placeholder document detail";
    }

    @PostMapping
    public String createDocument(@RequestBody Document payload) {
      return "placeholder document create";
    }

    @PatchMapping("/{id}")
    public String updateDocument(@PathVariable String id, @RequestBody Document payload) {
      return "placeholder document update";
    }

    @PatchMapping("/{id}/move")
    public String moveDocument(@PathVariable String id, @RequestBody Document payload) {
      return "placeholder document move";
    }

    @DeleteMapping("/{id}")
    public String deleteDocument(@PathVariable String id) {
      return "placeholder document delete";
    }
  }
}

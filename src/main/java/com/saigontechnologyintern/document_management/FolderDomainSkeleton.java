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
import org.springframework.web.bind.annotation.RestController;

public class FolderDomainSkeleton {
  public static class Folder {
    private UUID folderId;
    private String name;
    private UUID ownerId;
    private Instant createdAt;
  }

  public interface FolderRepository {}

  public static class FolderService {
    private final FolderRepository repository;

    public FolderService(FolderRepository repository) {
      this.repository = repository;
    }
  }

  @RestController
  @RequestMapping("/api/v1/folders")
  @CrossOrigin(
      allowedOriginPatterns = {"http://localhost:*", "http://127.0.0.1:*", "https://*.lovable.app"},
      allowedHeaders = {"Authorization", "Content-Type", "Accept", "Origin"},
      methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.PATCH, RequestMethod.DELETE, RequestMethod.OPTIONS})
  public static class FolderController {
    private final FolderService service;

    public FolderController(FolderService service) {
      this.service = service;
    }

    @GetMapping
    public String listFolders() {
      return "placeholder folders response";
    }

    @GetMapping("/{id}")
    public String getFolder(@PathVariable String id) {
      return "placeholder folder detail";
    }

    @PostMapping
    public String createFolder(@RequestBody Folder payload) {
      return "placeholder folder create";
    }

    @PatchMapping("/{id}")
    public String updateFolder(@PathVariable String id, @RequestBody Folder payload) {
      return "placeholder folder update";
    }

    @DeleteMapping("/{id}")
    public String deleteFolder(@PathVariable String id) {
      return "placeholder folder delete";
    }
  }
}

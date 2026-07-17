package com.saigontechnologyintern.document_management;

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

public class PermissionDomainSkeleton {
  public static class Permission {
    private UUID permId;
    private UUID docId;
    private UUID userId;
    private String accessType;
  }

  public interface PermissionRepository {}

  public static class PermissionService {
    private final PermissionRepository repository;

    public PermissionService(PermissionRepository repository) {
      this.repository = repository;
    }
  }

  @RestController
  @RequestMapping("/api/v1/permissions")
  @CrossOrigin(
      allowedOriginPatterns = {"http://localhost:*", "http://127.0.0.1:*", "https://*.lovable.app"},
      allowedHeaders = {"Authorization", "Content-Type", "Accept", "Origin"},
      methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.PATCH, RequestMethod.DELETE, RequestMethod.OPTIONS})
  public static class PermissionController {
    private final PermissionService service;

    public PermissionController(PermissionService service) {
      this.service = service;
    }

    @GetMapping
    public String listPermissions(@RequestParam(required = false) String docId) {
      return "placeholder permissions response";
    }

    @PostMapping
    public String createPermission(@RequestBody Permission payload) {
      return "placeholder permission create";
    }

    @PatchMapping("/{id}")
    public String updatePermission(@PathVariable String id, @RequestBody Permission payload) {
      return "placeholder permission update";
    }

    @DeleteMapping("/{id}")
    public String deletePermission(@PathVariable String id) {
      return "placeholder permission delete";
    }
  }
}

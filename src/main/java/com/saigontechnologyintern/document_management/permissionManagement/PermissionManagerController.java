package com.saigontechnologyintern.document_management.permissionManagement;

import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/permissions")
@CrossOrigin(
    origins = {"http://localhost:5173", "http://localhost:8080", "https://*.lovable.app"},
    allowedHeaders = {"Authorization", "Content-Type", "Accept", "Origin"},
    methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PATCH, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class PermissionManagerController {
  private final PermissionManagerService permissionManagerService;

  public PermissionManagerController(PermissionManagerService permissionManagerService) {
    this.permissionManagerService = permissionManagerService;
  }

  @GetMapping
  public List<PermissionManager> getPermissions(@RequestParam(value = "doc_id", required = false) Integer docId) {
    if (docId != null) {
      return permissionManagerService.getPermissionsByDocumentId(docId);
    }
    return permissionManagerService.getAllPermissions();
  }

  @GetMapping("/{id}")
  public PermissionManager getPermissionById(@PathVariable Integer id) {
    return permissionManagerService.getPermissionById(id);
  }

  @PostMapping
  public PermissionManager createPermission(@RequestBody PermissionCreateRequest request) {
    PermissionManager permission = new PermissionManager();
    permission.setAccessType(request.getAccess_type());
    return permissionManagerService.createPermission(permission);
  }

  @PatchMapping("/{id}")
  public PermissionManager updatePermission(@PathVariable Integer id, @RequestBody PermissionUpdateRequest request) {
    PermissionManager permission = new PermissionManager();
    permission.setAccessType(request.getAccess_type());
    return permissionManagerService.updatePermission(id, permission);
  }

  public static class PermissionCreateRequest {
    private Integer doc_id;
    private Integer user_id;
    private String access_type;

    public Integer getDoc_id() {
      return doc_id;
    }

    public void setDoc_id(Integer doc_id) {
      this.doc_id = doc_id;
    }

    public Integer getUser_id() {
      return user_id;
    }

    public void setUser_id(Integer user_id) {
      this.user_id = user_id;
    }

    public String getAccess_type() {
      return access_type;
    }

    public void setAccess_type(String access_type) {
      this.access_type = access_type;
    }
  }

  public static class PermissionUpdateRequest {
    private String access_type;

    public String getAccess_type() {
      return access_type;
    }

    public void setAccess_type(String access_type) {
      this.access_type = access_type;
    }
  }

  @DeleteMapping("/{id}")
  public void deletePermission(@PathVariable Integer id) {
    permissionManagerService.deletePermissionById(id);
  }
}

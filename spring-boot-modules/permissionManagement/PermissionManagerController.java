package com.saigontechnologyintern.document_management.permissionManagement;

import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/permissions")
@CrossOrigin(origins = "*")
public class PermissionManagerController {
    private final PermissionManagerService permissionManagerService;

    public PermissionManagerController(PermissionManagerService permissionManagerService) {
        this.permissionManagerService = permissionManagerService;
    }

    @GetMapping
    public List<PermissionResponseDto> getPermissions(
            @RequestParam(value = "doc_id", required = false) Integer docId,
            @RequestParam(value = "user_id", required = false) Integer userId) {

        List<PermissionManager> data = permissionManagerService.getPermissions(docId, userId);
        return data.stream().map(permissionManagerService::toDto).toList();
    }
    @GetMapping("/{id}")
    public PermissionResponseDto getPermissionById(@PathVariable Integer id) {
        return permissionManagerService.toDto(permissionManagerService.getPermissionById(id));
    }

    @PostMapping
    public PermissionResponseDto createPermission(@RequestBody PermissionCreateRequest request) {
        PermissionManager created = permissionManagerService.createPermission(
                request.getDoc_id(),
                request.getUser_id(),
                request.getAccess_type());
        return permissionManagerService.toDto(created);
    }

    @PatchMapping("/{id}")
    public PermissionResponseDto updatePermission(@PathVariable Integer id, @RequestBody PermissionUpdateRequest request) {
        PermissionManager updated = permissionManagerService.updatePermission(id, request.getAccess_type());
        return permissionManagerService.toDto(updated);
    }

    @DeleteMapping("/{id}")
    public void deletePermission(@PathVariable Integer id) {
        permissionManagerService.deletePermissionById(id);
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
}

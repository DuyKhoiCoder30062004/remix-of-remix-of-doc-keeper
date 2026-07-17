package com.saigontechnologyintern.document_management.permissionManagement;

import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class PermissionManagerService {
  private final PermissionManagerRepository permissionManagerRepository;

  public PermissionManagerService(PermissionManagerRepository permissionManagerRepository) {
    this.permissionManagerRepository = permissionManagerRepository;
  }

  public List<PermissionManager> getAllPermissions() {
    return permissionManagerRepository.findAll();
  }

  public List<PermissionManager> getPermissionsByDocumentId(Integer docId) {
    return permissionManagerRepository.findByDocument_DocId(docId);
  }

  public PermissionManager getPermissionById(Integer id) {
    return permissionManagerRepository
        .findById(id)
        .orElseThrow(() -> new IllegalArgumentException("Permission not found with id: " + id));
  }

  public PermissionManager createPermission(PermissionManager permission) {
    return permissionManagerRepository.save(permission);
  }

  public PermissionManager updatePermission(Integer id, PermissionManager updatedPermission) {
    PermissionManager existing = getPermissionById(id);
    if (updatedPermission.getAccessType() != null) {
      existing.setAccessType(updatedPermission.getAccessType());
    }
    if (updatedPermission.getDocument() != null) {
      existing.setDocument(updatedPermission.getDocument());
    }
    if (updatedPermission.getUser() != null) {
      existing.setUser(updatedPermission.getUser());
    }
    return permissionManagerRepository.save(existing);
  }

  public void deletePermissionById(Integer id) {
    if (!permissionManagerRepository.existsById(id)) {
      throw new IllegalArgumentException("Permission not found with id: " + id);
    }
    permissionManagerRepository.deleteById(id);
  }
}

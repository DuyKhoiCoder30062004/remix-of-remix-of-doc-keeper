package com.saigontechnologyintern.document_management.permissionManagement;

import com.saigontechnologyintern.document_management.documentManagement.DocumentManage;
import com.saigontechnologyintern.document_management.documentManagement.DocumentManageRepository;
import com.saigontechnologyintern.document_management.userManagement.UserManager;
import com.saigontechnologyintern.document_management.userManagement.UserManagerRepository;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

@Service
public class PermissionManagerService {
    private final PermissionManagerRepository permissionManagerRepository;
    private final DocumentManageRepository documentManageRepository;
    private final UserManagerRepository userManagerRepository;

    public PermissionManagerService(
            PermissionManagerRepository permissionManagerRepository,
            DocumentManageRepository documentManageRepository,
            UserManagerRepository userManagerRepository) {
        this.permissionManagerRepository = permissionManagerRepository;
        this.documentManageRepository = documentManageRepository;
        this.userManagerRepository = userManagerRepository;
    }

    public List<PermissionManager> getAllPermissions() {
        return permissionManagerRepository.findAll();
    }

    public List<PermissionManager> getPermissionsByDocumentId(Integer docId) {
        return permissionManagerRepository.findByDocument_DocId(docId);
    }
    public Optional<PermissionManager> getPermissionByDocumentAndUser(Integer docId, Integer userId) {
        return permissionManagerRepository.findByDocument_DocIdAndUser_UserId(docId, userId);
    }
    public List<PermissionManager> getPermissions(Integer docId, Integer userId) {
        if (docId != null && userId != null) {
            return permissionManagerRepository
                    .findByDocument_DocIdAndUser_UserId(docId, userId)
                    .stream()
                    .toList();
        }
        if (docId != null) {
            return permissionManagerRepository.findByDocument_DocId(docId);
        }
        if (userId != null) {
            return permissionManagerRepository.findByUser_UserId(userId);
        }
        return permissionManagerRepository.findAll();
    }

    public PermissionManager getPermissionById(Integer id) {
        return permissionManagerRepository
                .findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Permission not found with id: " + id));
    }

    public PermissionManager createPermission(Integer docId, Integer userId, String accessType) {
        DocumentManage document = documentManageRepository
                .findById(docId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found with id: " + docId));

        UserManager user = userManagerRepository
                .findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));

        PermissionManager permission = new PermissionManager();
        permission.setDocument(document);
        permission.setUser(user);
        permission.setAccessType(normalizeAccessType(accessType));

        return permissionManagerRepository.save(permission);
    }

    public PermissionManager updatePermission(Integer id, String accessType) {
        PermissionManager existing = getPermissionById(id);
        existing.setAccessType(normalizeAccessType(accessType));
        return permissionManagerRepository.save(existing);
    }

    public void deletePermissionById(Integer id) {
        if (!permissionManagerRepository.existsById(id)) {
            throw new IllegalArgumentException("Permission not found with id: " + id);
        }
        permissionManagerRepository.deleteById(id);
    }

    public PermissionResponseDto toDto(PermissionManager p) {
        Integer docId = p.getDocument() != null ? p.getDocument().getDocId() : null;
        Integer userId = p.getUser() != null ? p.getUser().getUserId() : null;
        String userName = p.getUser() != null ? p.getUser().getName() : null;
        String userEmail = p.getUser() != null ? p.getUser().getEmail() : null;

        return new PermissionResponseDto(
                p.getPermId(),
                docId,
                userId,
                userName,
                userEmail,
                normalizeAccessType(p.getAccessType()));
    }

    private String normalizeAccessType(String raw) {
        String value = raw.trim().toLowerCase();
        if ("owner".equals(value)) return "Owner";
        if ("editor".equals(value)) return "Editor";
        if ("viewer".equals(value)) return "Viewer";
        return "Viewer";
    }
}

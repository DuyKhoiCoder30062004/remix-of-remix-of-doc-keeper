package com.saigontechnologyintern.document_management.documentManagement;

import com.saigontechnologyintern.document_management.folderManagement.FolderManager;
import com.saigontechnologyintern.document_management.folderManagement.FolderManagerRepository;
import com.saigontechnologyintern.document_management.permissionManagement.PermissionManager;
import com.saigontechnologyintern.document_management.permissionManagement.PermissionManagerRepository;
import com.saigontechnologyintern.document_management.userManagement.UserManager;
import com.saigontechnologyintern.document_management.userManagement.UserManagerRepository;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class DocumentManageService {
    private final DocumentManageRepository documentManageRepository;
    private final FolderManagerRepository folderManagerRepository;
    private final UserManagerRepository userManagerRepository;
    private final PermissionManagerRepository permissionManagerRepository;

    public DocumentManageService(
            DocumentManageRepository documentManageRepository,
            FolderManagerRepository folderManagerRepository,
            UserManagerRepository userManagerRepository,PermissionManagerRepository permissionManagerRepository ) {
        this.documentManageRepository = documentManageRepository;
        this.folderManagerRepository = folderManagerRepository;
        this.userManagerRepository = userManagerRepository;
        this.permissionManagerRepository = permissionManagerRepository;
    }

    public List<DocumentManage> getDocuments(Integer currentUserId, Integer folderId, String q) {
        String keyword = (q == null || q.isBlank()) ? null : q;
        if (folderId != null || keyword != null) {
            return documentManageRepository.findVisibleDocumentsForUserFiltered(currentUserId, folderId, keyword);
        }
        return documentManageRepository.findVisibleDocumentsForUser(currentUserId);
    }

    public List<DocumentManage> searchDocuments(Integer currentUserId, String q) {
        String keyword = (q == null || q.isBlank()) ? null : q;
        if (keyword == null) {
            return documentManageRepository.findVisibleDocumentsForUser(currentUserId);
        }
        return documentManageRepository.findVisibleDocumentsForUserFiltered(currentUserId, null, keyword);
    }

    public DocumentManage getDocumentById(Integer id, Integer currentUserId) {
        DocumentManage doc = documentManageRepository
                .findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Document not found with id: " + id));
        requireCanView(doc, currentUserId);
        return doc;
    }

    public DocumentManage createDocument(MultipartFile file, Integer folderId, String title, Integer currentUserId) {
        try {
            UserManager actor = userManagerRepository
                    .findById(currentUserId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + currentUserId));

            DocumentManage document = new DocumentManage();
            document.setOwner(actor);

            String originalFilename = file.getOriginalFilename();
            String resolvedTitle = (title != null && !title.isBlank()) ? title : originalFilename;
            document.setTitle(resolvedTitle != null ? resolvedTitle : "Untitled");

            String extension = "FILE";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf('.') + 1).toUpperCase();
            }

            String mime = (file.getContentType() == null || file.getContentType().isBlank())
                    ? "application/octet-stream"
                    : file.getContentType();

            document.setMetadata(Map.of(
                    "extension", extension,
                    "mime_type", mime,
                    "size_bytes", file.getSize()));
            document.setOriginalFilename(originalFilename);
            document.setContentType(mime);
            document.setFileData(file.getBytes());

            if (folderId != null) {
                FolderManager folder = folderManagerRepository.findById(folderId)
                        .orElseThrow(() -> new IllegalArgumentException("Folder not found with id: " + folderId));

                Integer folderOwnerId = folder.getOwner() != null ? folder.getOwner().getUserId() : null;
                boolean ownerMatch = folderOwnerId != null && folderOwnerId.equals(currentUserId);
                boolean adminBypass = isAdmin(actor); // set false if you do not want admin bypass

                if (!ownerMatch && !adminBypass) {
                    throw new IllegalArgumentException(
                            "Upload denied: actor=" + currentUserId
                                    + ", role=" + actor.getRole()
                                    + ", folder_id=" + folderId
                                    + ", folder_owner=" + folderOwnerId);
                }

                document.setFolder(folder);
            }

            DocumentManage saved = documentManageRepository.save(document);

            permissionManagerRepository.findByDocument_DocIdAndUser_UserId(saved.getDocId(), currentUserId)
                    .ifPresentOrElse(
                            p -> {
                                p.setAccessType("Owner");
                                permissionManagerRepository.save(p);
                            },
                            () -> {
                                PermissionManager p = new PermissionManager();
                                p.setDocument(saved);
                                p.setUser(actor);
                                p.setAccessType("Owner");
                                permissionManagerRepository.save(p);
                            }
                    );

            return saved;
        } catch (IOException e) {
            throw new RuntimeException("Failed to read uploaded file content", e);
        }
    }
    public DocumentManage updateDocument(Integer id, DocumentManage updatedDocument, Integer currentUserId) {
        DocumentManage existing = documentManageRepository
                .findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Document not found with id: " + id));

        requireCanEdit(existing, currentUserId);

        if (updatedDocument.getTitle() != null) {
            existing.setTitle(updatedDocument.getTitle());
        }
        if (updatedDocument.getMetadata() != null) {
            existing.setMetadata(updatedDocument.getMetadata());
        }

        if (updatedDocument.getFolder() != null) {
            requireIsOwner(existing, currentUserId);

            FolderManager target = updatedDocument.getFolder();
            if (target.getFolderId() == null) {
                throw new IllegalArgumentException("folder_id is required in folder object");
            }

            FolderManager realFolder = folderManagerRepository.findById(target.getFolderId())
                    .orElseThrow(() -> new IllegalArgumentException("Folder not found with id: " + target.getFolderId()));

            boolean folderOwnedByCurrent = realFolder.getOwner() != null
                    && realFolder.getOwner().getUserId().equals(currentUserId);
            if (!folderOwnedByCurrent) {
                throw new IllegalArgumentException("You can only move to your own folders");
            }
            existing.setFolder(realFolder);
        }

        return documentManageRepository.save(existing);
    }

    public DocumentManage moveDocument(Integer id, Integer folderId, Integer currentUserId) {
        if (folderId == null) {
            throw new IllegalArgumentException("folder_id is required");
        }

        UserManager actor = userManagerRepository
                .findById(currentUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + currentUserId));

        DocumentManage doc = documentManageRepository
                .findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Document not found with id: " + id));

        Integer docOwnerId = doc.getOwner() != null ? doc.getOwner().getUserId() : null;
        boolean actorIsDocOwner = docOwnerId != null && docOwnerId.equals(currentUserId);
        boolean adminBypass = isAdmin(actor); // set false if you do not want admin bypass

        if (!actorIsDocOwner && !adminBypass) {
            throw new IllegalArgumentException(
                    "Move denied (doc ownership): actor=" + currentUserId
                            + ", role=" + actor.getRole()
                            + ", doc_id=" + id
                            + ", doc_owner=" + docOwnerId);
        }

        FolderManager target = folderManagerRepository
                .findById(folderId)
                .orElseThrow(() -> new IllegalArgumentException("Folder not found with id: " + folderId));

        Integer folderOwnerId = target.getOwner() != null ? target.getOwner().getUserId() : null;
        boolean actorOwnsFolder = folderOwnerId != null && folderOwnerId.equals(currentUserId);

        if (!actorOwnsFolder && !adminBypass) {
            throw new IllegalArgumentException(
                    "Move denied (folder ownership): actor=" + currentUserId
                            + ", role=" + actor.getRole()
                            + ", folder_id=" + folderId
                            + ", folder_owner=" + folderOwnerId
                            + ", doc_id=" + id
                            + ", doc_owner=" + docOwnerId);
        }

        doc.setFolder(target);
        return documentManageRepository.save(doc);
    }

    public void deleteDocumentById(Integer id, Integer currentUserId) {
        DocumentManage existing = documentManageRepository
                .findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Document not found with id: " + id));
        requireIsOwner(existing, currentUserId);
        documentManageRepository.delete(existing);
    }

    private String resolveAccessType(DocumentManage doc, Integer userId) {
        if (doc.getOwner() != null && doc.getOwner().getUserId().equals(userId)) return "Owner";
        return permissionManagerRepository
                .findByDocument_DocIdAndUser_UserId(doc.getDocId(), userId)
                .map(PermissionManager::getAccessType)
                .orElse(null);
    }
    private void requireCanView(DocumentManage doc, Integer userId) {
        String role = resolveAccessType(doc, userId);
        if (role == null) throw new IllegalArgumentException("Document not found with id: " + doc.getDocId());
    }
    private void requireCanEdit(DocumentManage doc, Integer userId) {
        String role = resolveAccessType(doc, userId);
        if (!"Owner".equals(role) && !"Editor".equals(role)) {
            throw new IllegalArgumentException("You do not have permission to edit this document");
        }
    }
    private void requireIsOwner(DocumentManage doc, Integer userId) {
        String role = resolveAccessType(doc, userId);
        if (!"Owner".equals(role)) {
            throw new IllegalArgumentException("You do not have permission to perform this action");
        }
    }
    private boolean isAdmin(UserManager user) {
        return user != null && user.getRole() != null && "ADMIN".equalsIgnoreCase(user.getRole());
    }
}

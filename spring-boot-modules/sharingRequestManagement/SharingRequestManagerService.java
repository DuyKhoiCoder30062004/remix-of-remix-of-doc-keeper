package com.saigontechnologyintern.document_management.sharingRequestManagement;

import com.saigontechnologyintern.document_management.documentManagement.DocumentManage;
import com.saigontechnologyintern.document_management.documentManagement.DocumentManageRepository;
import com.saigontechnologyintern.document_management.permissionManagement.PermissionManager;
import com.saigontechnologyintern.document_management.permissionManagement.PermissionManagerRepository;
import com.saigontechnologyintern.document_management.userManagement.UserManager;
import com.saigontechnologyintern.document_management.userManagement.UserManagerRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class SharingRequestManagerService {
    private final SharingRequestManagerRepository sharingRequestManagerRepository;
    private final DocumentManageRepository documentManageRepository;
    private final UserManagerRepository userManagerRepository;
    private final PermissionManagerRepository permissionManagerRepository;

    public SharingRequestManagerService(
            SharingRequestManagerRepository sharingRequestManagerRepository,
            DocumentManageRepository documentManageRepository,
            UserManagerRepository userManagerRepository,
            PermissionManagerRepository permissionManagerRepository) {
        this.sharingRequestManagerRepository = sharingRequestManagerRepository;
        this.documentManageRepository = documentManageRepository;
        this.userManagerRepository = userManagerRepository;
        this.permissionManagerRepository = permissionManagerRepository;
    }

    public List<SharingRequestManager> getAllSharingRequests() {
        return sharingRequestManagerRepository.findAll();
    }

    public List<SharingRequestManager> getSharingRequestsByStatus(String status) {
        return sharingRequestManagerRepository.findByStatus(normalizeStatus(status));
    }

    public List<SharingRequestManager> getSharingRequestsByDocumentId(Integer docId) {
        return sharingRequestManagerRepository.findByDocument_DocId(docId);
    }

    public List<SharingRequestManager> getSharingRequestsByStatusAndDocumentId(String status, Integer docId) {
        return sharingRequestManagerRepository.findByStatusAndDocument_DocId(normalizeStatus(status), docId);
    }

    public List<SharingRequestManager> getIncomingRequests(Integer actorUserId, String status, Integer docId) {
        if (status != null && docId != null) {
            return sharingRequestManagerRepository
                    .findByRequester_UserIdAndStatus(actorUserId, normalizeStatus(status))
                    .stream()
                    .filter(r -> r.getDocument() != null && docId.equals(r.getDocument().getDocId()))
                    .toList();
        }
        if (status != null) {
            return sharingRequestManagerRepository.findByRequester_UserIdAndStatus(actorUserId, normalizeStatus(status));
        }
        if (docId != null) {
            return sharingRequestManagerRepository.findByRequester_UserId(actorUserId).stream()
                    .filter(r -> r.getDocument() != null && docId.equals(r.getDocument().getDocId()))
                    .toList();
        }
        return sharingRequestManagerRepository.findByRequester_UserId(actorUserId);
    }

    public SharingRequestManager getSharingRequestById(Integer id) {
        return sharingRequestManagerRepository
                .findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Sharing request not found with id: " + id));
    }

    public SharingRequestManager createSharingRequest(
            Integer docId,
            Integer recipientUserId,
            String permission,
            Integer actorUserId) {

        DocumentManage document = documentManageRepository
                .findById(docId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found with id: " + docId));

        if (document.getOwner() == null || !document.getOwner().getUserId().equals(actorUserId)) {
            throw new IllegalArgumentException("Only document owner can share this document");
        }

        UserManager recipient = userManagerRepository
                .findById(recipientUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + recipientUserId));

        SharingRequestManager entity = new SharingRequestManager();
        entity.setDocument(document);
        entity.setRequester(recipient);
        entity.setStatus("Pending");
        entity.setPermission(normalizeAccessType(permission));

        return sharingRequestManagerRepository.save(entity);
    }

    public SharingRequestManager approveSharingRequest(Integer id, Integer actorUserId) {
        SharingRequestManager request = getSharingRequestById(id);

        if (request.getRequester() == null || !request.getRequester().getUserId().equals(actorUserId)) {
            throw new IllegalArgumentException("Only recipient can approve this request");
        }

        request.setStatus("Approved");
        SharingRequestManager saved = sharingRequestManagerRepository.save(request);

        if (request.getDocument() != null && request.getRequester() != null) {
            Integer docId = request.getDocument().getDocId();
            Integer userId = request.getRequester().getUserId();

            PermissionManager permission = permissionManagerRepository
                    .findByDocument_DocIdAndUser_UserId(docId, userId)
                    .orElseGet(() -> {
                        PermissionManager p = new PermissionManager();
                        p.setDocument(request.getDocument());
                        p.setUser(request.getRequester());
                        return p;
                    });

            permission.setAccessType(normalizeAccessType(request.getPermission()));
            permissionManagerRepository.save(permission);
        }

        return saved;
    }

    public SharingRequestManager rejectSharingRequest(Integer id, Integer actorUserId) {
        SharingRequestManager request = getSharingRequestById(id);

        if (request.getRequester() == null || !request.getRequester().getUserId().equals(actorUserId)) {
            throw new IllegalArgumentException("Only recipient can reject this request");
        }

        request.setStatus("Rejected");
        return sharingRequestManagerRepository.save(request);
    }

    public SharingRequestResponseDto toDto(SharingRequestManager r) {
        Integer docId = r.getDocument() != null ? r.getDocument().getDocId() : null;
        Integer requesterId = r.getRequester() != null ? r.getRequester().getUserId() : null;
        String requesterName = r.getRequester() != null ? r.getRequester().getName() : null;
        String requesterEmail = r.getRequester() != null ? r.getRequester().getEmail() : null;

        return new SharingRequestResponseDto(
                r.getRequestId(),
                docId,
                requesterId,
                requesterName,
                requesterEmail,
                normalizeAccessType(r.getPermission()),
                normalizeStatus(r.getStatus()),
                r.getRequestedAt());
    }

    private String normalizeStatus(String raw) {
        if (raw == null) return "Pending";
        String value = raw.trim().toLowerCase();
        if ("pending".equals(value)) return "Pending";
        if ("approved".equals(value)) return "Approved";
        if ("rejected".equals(value)) return "Rejected";
        return "Pending";
    }

    private String normalizeAccessType(String raw) {
        if (raw == null) return "Viewer";
        String value = raw.trim().toLowerCase();
        if ("owner".equals(value)) return "Owner";
        if ("editor".equals(value)) return "Editor";
        if ("viewer".equals(value)) return "Viewer";
        return "Viewer";
    }
}
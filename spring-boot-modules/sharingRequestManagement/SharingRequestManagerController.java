package com.saigontechnologyintern.document_management.sharingRequestManagement;

import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.saigontechnologyintern.document_management.authManagement.JwtService;

@RestController
@RequestMapping("/api/v1/sharing-requests")
@CrossOrigin(origins = "*")
public class SharingRequestManagerController {

    private final SharingRequestManagerService sharingRequestManagerService;
    private final JwtService jwtService;

    public SharingRequestManagerController(
            SharingRequestManagerService sharingRequestManagerService,
            JwtService jwtService) {
        this.sharingRequestManagerService = sharingRequestManagerService;
        this.jwtService = jwtService;
    }

    @GetMapping
    public List<SharingRequestResponseDto> getSharingRequests(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "doc_id", required = false) Integer docId) {

        String token = extractToken(authHeader);
        Integer currentUserId = jwtService.extractUserId(token);
        String role = jwtService.extractRole(token);

        List<SharingRequestManager> data;
        if (role != null && "ADMIN".equalsIgnoreCase(role)) {
            if (status != null && docId != null) {
                data = sharingRequestManagerService.getSharingRequestsByStatusAndDocumentId(status, docId);
            } else if (status != null) {
                data = sharingRequestManagerService.getSharingRequestsByStatus(status);
            } else if (docId != null) {
                data = sharingRequestManagerService.getSharingRequestsByDocumentId(docId);
            } else {
                data = sharingRequestManagerService.getAllSharingRequests();
            }
        } else {
            data = sharingRequestManagerService.getIncomingRequests(currentUserId, status, docId);
        }

        return data.stream().map(sharingRequestManagerService::toDto).toList();
    }

    @GetMapping("/{id}")
    public SharingRequestResponseDto getSharingRequestById(@PathVariable Integer id) {
        return sharingRequestManagerService.toDto(sharingRequestManagerService.getSharingRequestById(id));
    }

    @PostMapping
    public SharingRequestResponseDto createSharingRequest(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody SharingRequestCreateRequest request) {

        String token = extractToken(authHeader);
        Integer currentUserId = jwtService.extractUserId(token);

        SharingRequestManager created = sharingRequestManagerService.createSharingRequest(
                request.getDoc_id(),
                request.getRequester_id(),
                request.getPermission(),
                currentUserId);

        return sharingRequestManagerService.toDto(created);
    }

    @PostMapping("/{id}/approve")
    public SharingRequestResponseDto approveSharingRequest(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Integer id) {

        String token = extractToken(authHeader);
        Integer currentUserId = jwtService.extractUserId(token);

        SharingRequestManager approved = sharingRequestManagerService.approveSharingRequest(id, currentUserId);
        return sharingRequestManagerService.toDto(approved);
    }

    @PostMapping("/{id}/reject")
    public SharingRequestResponseDto rejectSharingRequest(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Integer id) {

        String token = extractToken(authHeader);
        Integer currentUserId = jwtService.extractUserId(token);

        SharingRequestManager rejected = sharingRequestManagerService.rejectSharingRequest(id, currentUserId);
        return sharingRequestManagerService.toDto(rejected);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", ex.getMessage()));
    }

    private String extractToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new IllegalArgumentException("Invalid authorization header");
        }
        String token = authHeader.substring(7).trim();
        if (!jwtService.isTokenValid(token)) {
            throw new IllegalArgumentException("Invalid or expired token");
        }
        return token;
    }

    public static class SharingRequestCreateRequest {
        private Integer doc_id;
        private Integer requester_id;
        private String permission;

        public Integer getDoc_id() {
            return doc_id;
        }

        public void setDoc_id(Integer doc_id) {
            this.doc_id = doc_id;
        }

        public Integer getRequester_id() {
            return requester_id;
        }

        public void setRequester_id(Integer requester_id) {
            this.requester_id = requester_id;
        }

        public String getPermission() {
            return permission;
        }

        public void setPermission(String permission) {
            this.permission = permission;
        }
    }
}

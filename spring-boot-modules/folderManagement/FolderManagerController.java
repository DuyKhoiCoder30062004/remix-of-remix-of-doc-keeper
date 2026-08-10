package com.saigontechnologyintern.document_management.folderManagement;

import com.saigontechnologyintern.document_management.authManagement.AuthService;
import com.saigontechnologyintern.document_management.authManagement.JwtService;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/folders")
@CrossOrigin(origins = "*")
public class FolderManagerController {
    private final FolderManagerService folderManagerService;
    private final AuthService authService;
    private final JwtService jwtService;

    public FolderManagerController(
            FolderManagerService folderManagerService,
            AuthService authService,
            JwtService jwtService) {
        this.folderManagerService = folderManagerService;
        this.authService = authService;
        this.jwtService = jwtService;
    }

    @GetMapping
    public List<FolderManager> getAllFolders(@RequestHeader("Authorization") String authorization) {
        Integer currentUserId = currentUserIdFromHeader(authorization);
        return folderManagerService.getAllFolders(currentUserId);
    }

    @GetMapping("/{id}")
    public FolderManager getFolderById(
            @PathVariable Integer id,
            @RequestHeader("Authorization") String authorization) {
        Integer currentUserId = currentUserIdFromHeader(authorization);
        return folderManagerService.getFolderById(id, currentUserId);
    }

    @PostMapping
    public FolderManager createFolder(
            @RequestBody FolderManager folder,
            @RequestHeader("Authorization") String authorization) {
        Integer currentUserId = currentUserIdFromHeader(authorization);
        return folderManagerService.createFolder(folder, currentUserId);
    }

    @PatchMapping("/{id}")
    public FolderManager updateFolder(
            @PathVariable Integer id,
            @RequestBody FolderManager folder,
            @RequestHeader("Authorization") String authorization) {
        Integer currentUserId = currentUserIdFromHeader(authorization);
        return folderManagerService.updateFolder(id, folder, currentUserId);
    }

    @DeleteMapping("/{id}")
    public void deleteFolder(
            @PathVariable Integer id,
            @RequestHeader("Authorization") String authorization) {
        Integer currentUserId = currentUserIdFromHeader(authorization);
        folderManagerService.deleteFolderById(id, currentUserId);
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

    private Integer currentUserIdFromHeader(String authorization) {
        String token = extractToken(authorization);
        return authService.getCurrentUser(token).getUserId();
    }
}
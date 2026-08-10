package com.saigontechnologyintern.document_management.userManagement;

import java.nio.charset.StandardCharsets;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@CrossOrigin(origins = "*")
public class UserManagerController {
    private final UserManagerService userManagerService;

    public UserManagerController(UserManagerService userManagerService) {
        this.userManagerService = userManagerService;
    }

    @GetMapping
    public List<UserManager> getAllUsers(@RequestParam(value = "q", required = false) String q) {
        return userManagerService.getAllUsers();
    }

    @GetMapping("/{id}")
    public UserManager getUserById(@PathVariable Integer id) {
        return userManagerService.getUserById(id);
    }

    @GetMapping("/audit/export")
    public ResponseEntity<byte[]> exportAuditLogs() {
        String csv = "log_id,doc_id,action\n1,1,CREATE\n";
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=audits.csv")
                .body(csv.getBytes(StandardCharsets.UTF_8));
    }

    @PatchMapping("/{id}/role")
    public UserManager updateUserRole(@PathVariable Integer id, @RequestBody UserManager user) {
        return userManagerService.updateUser(id, user);
    }

    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable Integer id) {
        userManagerService.deleteUserById(id);
    }
}

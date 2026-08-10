package com.saigontechnologyintern.document_management.permissionManagement;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface PermissionManagerRepository extends JpaRepository<PermissionManager, Integer> {
    List<PermissionManager> findByUser_UserId(Integer userId);
    List<PermissionManager> findByDocument_DocId(Integer docId);
    Optional<PermissionManager> findByDocument_DocIdAndUser_UserId(Integer docId, Integer userId);
}

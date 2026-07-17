package com.saigontechnologyintern.document_management.permissionManagement;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PermissionManagerRepository extends JpaRepository<PermissionManager, Integer> {
  List<PermissionManager> findByDocument_DocId(Integer docId);
}

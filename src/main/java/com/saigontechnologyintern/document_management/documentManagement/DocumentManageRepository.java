package com.saigontechnologyintern.document_management.documentManagement;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DocumentManageRepository extends JpaRepository<DocumentManage, Integer> {
  List<DocumentManage> findByTitleContainingIgnoreCase(String title);

  List<DocumentManage> findByFolder_FolderId(Integer folderId);
}

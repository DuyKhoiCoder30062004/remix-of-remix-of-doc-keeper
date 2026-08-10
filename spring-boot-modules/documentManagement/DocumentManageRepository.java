package com.saigontechnologyintern.document_management.documentManagement;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DocumentManageRepository extends JpaRepository<DocumentManage, Integer> {
    List<DocumentManage> findByOwner_UserId(Integer userId);
    List<DocumentManage> findByOwner_UserIdAndFolder_FolderId(Integer userId, Integer folderId);
    List<DocumentManage> findByOwner_UserIdAndTitleContainingIgnoreCase(Integer userId, String title);
    @org.springframework.data.jpa.repository.Query("""
SELECT DISTINCT d
FROM DocumentManage d
LEFT JOIN PermissionManager p ON p.document = d
WHERE d.owner.userId = :userId
   OR (p.user.userId = :userId AND p.accessType IN ('Owner','Editor','Viewer'))
""")
    List<DocumentManage> findVisibleDocumentsForUser(Integer userId);
    @org.springframework.data.jpa.repository.Query(
            value = """
    SELECT DISTINCT d.* 
    FROM documents d
    LEFT JOIN permissions p ON p.doc_id = d.doc_id
    WHERE (d.owner_id = :userId
       OR (p.user_id = :userId AND p.access_type IN ('Owner','Editor','Viewer')))
      AND (:folderId IS NULL OR d.folder_id = :folderId)
      AND (:q IS NULL OR d.title ILIKE CONCAT('%', :q, '%'))
    """,
            nativeQuery = true
    )
    List<DocumentManage> findVisibleDocumentsForUserFiltered(Integer userId, Integer folderId, String q);
}

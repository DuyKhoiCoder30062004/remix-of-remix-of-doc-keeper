package com.saigontechnologyintern.document_management.sharingRequestManagement;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SharingRequestManagerRepository extends JpaRepository<SharingRequestManager, Integer> {
  List<SharingRequestManager> findByStatus(String status);

  List<SharingRequestManager> findByDocument_DocId(Integer docId);
}

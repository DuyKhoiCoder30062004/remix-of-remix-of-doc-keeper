package com.saigontechnologyintern.document_management.folderManagement;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FolderManagerRepository extends JpaRepository<FolderManager, Integer> {
    List<FolderManager> findByOwner_UserId(Integer userId);
}

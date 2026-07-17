package com.saigontechnologyintern.document_management.folderManagement;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FolderManagerRepository extends JpaRepository<FolderManager, Integer> {}

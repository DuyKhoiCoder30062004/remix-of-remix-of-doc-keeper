package com.saigontechnologyintern.document_management.userManagement;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserManagerRepository extends JpaRepository<UserManager, Integer> {
  boolean existsByEmail(String email);
}

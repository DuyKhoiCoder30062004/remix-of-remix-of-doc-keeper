package com.saigontechnologyintern.document_management.userManagement;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserManagerRepository extends JpaRepository<UserManager, Integer> {
    boolean existsByEmail(String email);

    // CHANGED: required by JWT/BCrypt auth for login and registration uniqueness checks.
    Optional<UserManager> findByEmail(String email);
}
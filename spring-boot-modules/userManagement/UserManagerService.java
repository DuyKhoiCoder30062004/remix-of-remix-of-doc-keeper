package com.saigontechnologyintern.document_management.userManagement;

import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class UserManagerService {
    private final UserManagerRepository userManagerRepository;

    public UserManagerService(UserManagerRepository userManagerRepository) {
        this.userManagerRepository = userManagerRepository;
    }

    public List<UserManager> getAllUsers() {
        return userManagerRepository.findAll();
    }

    public UserManager getUserById(Integer id) {
        return userManagerRepository
                .findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));
    }

    public UserManager createUser(UserManager user) {
        if (userManagerRepository.existsByEmail(user.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }
        return userManagerRepository.save(user);
    }

    public UserManager updateUser(Integer id, UserManager updatedUser) {
        UserManager existing = getUserById(id);
        if (updatedUser.getName() != null) {
            existing.setName(updatedUser.getName());
        }
        if (updatedUser.getEmail() != null) {
            existing.setEmail(updatedUser.getEmail());
        }
        if (updatedUser.getPassword() != null) {
            existing.setPassword(updatedUser.getPassword());
        }
        if (updatedUser.getRole() != null) {
            existing.setRole(updatedUser.getRole());
        }
        return userManagerRepository.save(existing);
    }

    public void deleteUserById(Integer id) {
        if (!userManagerRepository.existsById(id)) {
            throw new IllegalArgumentException("User not found with id: " + id);
        }
        userManagerRepository.deleteById(id);
    }
}

package com.saigontechnologyintern.document_management.authManagement;

import com.fasterxml.jackson.annotation.JsonProperty;

public class UserDto {
    // CHANGED: use snake_case JSON names and string ids so the current React frontend can consume them directly.
    @JsonProperty("user_id")
    private String userId;

    private String name;
    private String email;
    private String role;

    @JsonProperty("created_at")
    private String createdAt;

    public UserDto() {}

    public UserDto(String userId, String name, String email, String role, String createdAt) {
        this.userId = userId;
        this.name = name;
        this.email = email;
        this.role = role;
        this.createdAt = createdAt;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }
}

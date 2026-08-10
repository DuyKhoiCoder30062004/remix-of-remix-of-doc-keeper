package com.saigontechnologyintern.document_management.authManagement;

import com.saigontechnologyintern.document_management.userManagement.UserManager;

public class AuthResponseDto {
    private String token;
    private UserManager user;

    public AuthResponseDto() {}

    public AuthResponseDto(String token, UserManager user) {
        this.token = token;
        this.user = user;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public UserManager getUser() {
        return user;
    }

    public void setUser(UserManager user) {
        this.user = user;
    }
}

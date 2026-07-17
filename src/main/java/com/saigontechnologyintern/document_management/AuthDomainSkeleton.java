package com.saigontechnologyintern.document_management;

import java.time.Instant;
import java.util.UUID;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

public class AuthDomainSkeleton {
  public static class UserEntity {
    private UUID userId;
    private String name;
    private String email;
    private String role;
    private Instant createdAt;
  }

  public static class AuthResponse {
    private String token;
    private UserEntity user;
  }

  public static class LoginRequest {
    private String email;
    private String password;
  }

  public static class RegisterRequest {
    private String name;
    private String email;
    private String password;
  }

  public static class PasswordResetRequest {
    private String token;
    private String password;
  }

  public static class PasswordForgotRequest {
    private String email;
  }

  public interface AuthRepository {}

  public static class AuthService {
    private final AuthRepository repository;

    public AuthService(AuthRepository repository) {
      this.repository = repository;
    }
  }

  @RestController
  @RequestMapping("/api/v1/auth")
  @CrossOrigin(
      allowedOriginPatterns = {"http://localhost:*", "http://127.0.0.1:*", "https://*.lovable.app"},
      allowedHeaders = {"Authorization", "Content-Type", "Accept", "Origin"},
      methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.PATCH, RequestMethod.DELETE, RequestMethod.OPTIONS})
  public static class AuthController {
    private final AuthService service;

    public AuthController(AuthService service) {
      this.service = service;
    }

    @PostMapping("/register")
    public AuthResponse register(@RequestBody RegisterRequest request) {
      return new AuthResponse();
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody LoginRequest request) {
      return new AuthResponse();
    }

    @PostMapping("/logout")
    public void logout() {
      // placeholder
    }

    @PostMapping("/password/forgot")
    public void forgotPassword(@RequestBody PasswordForgotRequest request) {
      // placeholder
    }

    @PostMapping("/password/reset")
    public void resetPassword(@RequestBody PasswordResetRequest request) {
      // placeholder
    }

    @GetMapping("/me")
    public UserEntity me() {
      return new UserEntity();
    }
  }
}

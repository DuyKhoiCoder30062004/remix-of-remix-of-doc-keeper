package com.saigontechnologyintern.document_management.auth;

import com.saigontechnologyintern.document_management.userManagement.UserManager;
import com.saigontechnologyintern.document_management.userManagement.UserManagerService;
import java.util.HashMap;
import java.util.Map;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@CrossOrigin(
    origins = {"http://localhost:5173", "http://localhost:8080", "https://*.lovable.app"},
    allowedHeaders = {"Authorization", "Content-Type", "Accept", "Origin"},
    methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PATCH, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class AuthController {
  private final UserManagerService userManagerService;

  public AuthController(UserManagerService userManagerService) {
    this.userManagerService = userManagerService;
  }

  @PostMapping("/register")
  public Map<String, Object> register(@RequestBody RegisterRequest request) {
    UserManager user = new UserManager();
    user.setName(request.getName());
    user.setEmail(request.getEmail());
    user.setPassword(request.getPassword());
    user.setRole("USER");

    UserManager saved = userManagerService.createUser(user);
    Map<String, Object> response = new HashMap<>();
    response.put("token", "dummy-jwt-token");
    response.put("user", saved);
    return response;
  }

  @PostMapping("/login")
  public Map<String, Object> login(@RequestBody LoginRequest request) {
    UserManager user = userManagerService.getAllUsers().stream()
        .filter(u -> request.getEmail().equals(u.getEmail()) && request.getPassword().equals(u.getPassword()))
        .findFirst()
        .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

    Map<String, Object> response = new HashMap<>();
    response.put("token", "dummy-jwt-token");
    response.put("user", user);
    return response;
  }

  @PostMapping("/logout")
  public void logout() {}

  @PostMapping("/password/forgot")
  public void forgotPassword(@RequestBody PasswordForgotRequest request) {}

  @PostMapping("/password/reset")
  public void resetPassword(@RequestBody PasswordResetRequest request) {}

  @GetMapping("/me")
  public UserManager me() {
    return new UserManager();
  }

  public static class RegisterRequest {
    private String name;
    private String email;
    private String password;

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

    public String getPassword() {
      return password;
    }

    public void setPassword(String password) {
      this.password = password;
    }
  }

  public static class LoginRequest {
    private String email;
    private String password;

    public String getEmail() {
      return email;
    }

    public void setEmail(String email) {
      this.email = email;
    }

    public String getPassword() {
      return password;
    }

    public void setPassword(String password) {
      this.password = password;
    }
  }

  public static class PasswordForgotRequest {
    private String email;

    public String getEmail() {
      return email;
    }

    public void setEmail(String email) {
      this.email = email;
    }
  }

  public static class PasswordResetRequest {
    private String token;
    private String password;

    public String getToken() {
      return token;
    }

    public void setToken(String token) {
      this.token = token;
    }

    public String getPassword() {
      return password;
    }

    public void setPassword(String password) {
      this.password = password;
    }
  }
}

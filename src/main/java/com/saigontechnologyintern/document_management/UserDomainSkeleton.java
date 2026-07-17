package com.saigontechnologyintern.document_management;

import java.time.Instant;
import java.util.UUID;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

public class UserDomainSkeleton {
  public static class User {
    private UUID userId;
    private String name;
    private String email;
    private String role;
    private Instant createdAt;
  }

  public interface UserRepository {}

  public static class UserService {
    private final UserRepository repository;

    public UserService(UserRepository repository) {
      this.repository = repository;
    }
  }

  @RestController
  @RequestMapping("/api/v1/users")
  @CrossOrigin(
      allowedOriginPatterns = {"http://localhost:*", "http://127.0.0.1:*", "https://*.lovable.app"},
      allowedHeaders = {"Authorization", "Content-Type", "Accept", "Origin"},
      methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.PATCH, RequestMethod.DELETE, RequestMethod.OPTIONS})
  public static class UserController {
    private final UserService service;

    public UserController(UserService service) {
      this.service = service;
    }

    @GetMapping
    public String listUsers(@RequestParam(required = false) String q) {
      return "placeholder users response";
    }

    @GetMapping("/{id}")
    public String getUser(@PathVariable String id) {
      return "placeholder user detail";
    }

    @PatchMapping("/{id}/role")
    public String updateRole(@PathVariable String id, @RequestBody User payload) {
      return "placeholder role update";
    }

    @DeleteMapping("/{id}")
    public String deleteUser(@PathVariable String id) {
      return "placeholder delete";
    }
  }
}

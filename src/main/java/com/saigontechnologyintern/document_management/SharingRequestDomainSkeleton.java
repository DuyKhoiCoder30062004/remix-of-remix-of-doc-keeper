package com.saigontechnologyintern.document_management;

import java.time.Instant;
import java.util.UUID;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

public class SharingRequestDomainSkeleton {
  public static class SharingRequest {
    private UUID requestId;
    private UUID docId;
    private UUID requesterId;
    private String status;
    private Instant requestedAt;
  }

  public interface SharingRequestRepository {}

  public static class SharingRequestService {
    private final SharingRequestRepository repository;

    public SharingRequestService(SharingRequestRepository repository) {
      this.repository = repository;
    }
  }

  @RestController
  @RequestMapping("/api/v1/sharing-requests")
  @CrossOrigin(
      allowedOriginPatterns = {"http://localhost:*", "http://127.0.0.1:*", "https://*.lovable.app"},
      allowedHeaders = {"Authorization", "Content-Type", "Accept", "Origin"},
      methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.PATCH, RequestMethod.DELETE, RequestMethod.OPTIONS})
  public static class SharingRequestController {
    private final SharingRequestService service;

    public SharingRequestController(SharingRequestService service) {
      this.service = service;
    }

    @GetMapping
    public String listRequests(@RequestParam(required = false) String status, @RequestParam(required = false) String docId) {
      return "placeholder sharing requests response";
    }

    @PostMapping
    public String createRequest(@RequestBody SharingRequest payload) {
      return "placeholder sharing request create";
    }

    @PostMapping("/{id}/approve")
    public String approveRequest(@PathVariable String id) {
      return "placeholder approve";
    }

    @PostMapping("/{id}/reject")
    public String rejectRequest(@PathVariable String id) {
      return "placeholder reject";
    }
  }
}

package com.saigontechnologyintern.document_management.sharingRequestManagement;

import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/sharing-requests")
@CrossOrigin(
    origins = {"http://localhost:5173", "http://localhost:8080", "https://*.lovable.app"},
    allowedHeaders = {"Authorization", "Content-Type", "Accept", "Origin"},
    methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PATCH, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class SharingRequestManagerController {
  private final SharingRequestManagerService sharingRequestManagerService;

  public SharingRequestManagerController(SharingRequestManagerService sharingRequestManagerService) {
    this.sharingRequestManagerService = sharingRequestManagerService;
  }

  @GetMapping
  public List<SharingRequestManager> getSharingRequests(
      @RequestParam(value = "status", required = false) String status,
      @RequestParam(value = "doc_id", required = false) Integer docId) {
    if (status != null) {
      return sharingRequestManagerService.getSharingRequestsByStatus(status);
    }
    if (docId != null) {
      return sharingRequestManagerService.getSharingRequestsByDocumentId(docId);
    }
    return sharingRequestManagerService.getAllSharingRequests();
  }

  @PostMapping
  public SharingRequestManager createSharingRequest(@RequestBody SharingRequestCreateRequest request) {
    SharingRequestManager entity = new SharingRequestManager();
    entity.setStatus("PENDING");
    return sharingRequestManagerService.createSharingRequest(entity);
  }

  public static class SharingRequestCreateRequest {
    private Integer doc_id;

    public Integer getDoc_id() {
      return doc_id;
    }

    public void setDoc_id(Integer doc_id) {
      this.doc_id = doc_id;
    }
  }

  @PostMapping("/{id}/approve")
  public SharingRequestManager approveSharingRequest(@PathVariable Integer id) {
    SharingRequestManager request = sharingRequestManagerService.getSharingRequestById(id);
    request.setStatus("APPROVED");
    return sharingRequestManagerService.updateSharingRequest(id, request);
  }

  @PostMapping("/{id}/reject")
  public SharingRequestManager rejectSharingRequest(@PathVariable Integer id) {
    SharingRequestManager request = sharingRequestManagerService.getSharingRequestById(id);
    request.setStatus("REJECTED");
    return sharingRequestManagerService.updateSharingRequest(id, request);
  }
}

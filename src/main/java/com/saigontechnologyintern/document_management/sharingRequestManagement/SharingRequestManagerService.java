package com.saigontechnologyintern.document_management.sharingRequestManagement;

import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class SharingRequestManagerService {
  private final SharingRequestManagerRepository sharingRequestManagerRepository;

  public SharingRequestManagerService(SharingRequestManagerRepository sharingRequestManagerRepository) {
    this.sharingRequestManagerRepository = sharingRequestManagerRepository;
  }

  public List<SharingRequestManager> getAllSharingRequests() {
    return sharingRequestManagerRepository.findAll();
  }

  public List<SharingRequestManager> getSharingRequestsByStatus(String status) {
    return sharingRequestManagerRepository.findByStatus(status);
  }

  public List<SharingRequestManager> getSharingRequestsByDocumentId(Integer docId) {
    return sharingRequestManagerRepository.findByDocument_DocId(docId);
  }

  public SharingRequestManager getSharingRequestById(Integer id) {
    return sharingRequestManagerRepository
        .findById(id)
        .orElseThrow(() -> new IllegalArgumentException("Sharing request not found with id: " + id));
  }

  public SharingRequestManager createSharingRequest(SharingRequestManager request) {
    return sharingRequestManagerRepository.save(request);
  }

  public SharingRequestManager updateSharingRequest(Integer id, SharingRequestManager updatedRequest) {
    SharingRequestManager existing = getSharingRequestById(id);
    if (updatedRequest.getStatus() != null) {
      existing.setStatus(updatedRequest.getStatus());
    }
    if (updatedRequest.getDocument() != null) {
      existing.setDocument(updatedRequest.getDocument());
    }
    if (updatedRequest.getRequester() != null) {
      existing.setRequester(updatedRequest.getRequester());
    }
    return sharingRequestManagerRepository.save(existing);
  }

  public void deleteSharingRequestById(Integer id) {
    if (!sharingRequestManagerRepository.existsById(id)) {
      throw new IllegalArgumentException("Sharing request not found with id: " + id);
    }
    sharingRequestManagerRepository.deleteById(id);
  }
}

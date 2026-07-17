package com.saigontechnologyintern.document_management.folderManagement;

import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class FolderManagerService {
  private final FolderManagerRepository folderManagerRepository;

  public FolderManagerService(FolderManagerRepository folderManagerRepository) {
    this.folderManagerRepository = folderManagerRepository;
  }

  public List<FolderManager> getAllFolders() {
    return folderManagerRepository.findAll();
  }

  public FolderManager getFolderById(Integer id) {
    return folderManagerRepository
        .findById(id)
        .orElseThrow(() -> new IllegalArgumentException("Folder not found with id: " + id));
  }

  public FolderManager createFolder(FolderManager folder) {
    return folderManagerRepository.save(folder);
  }

  public FolderManager updateFolder(Integer id, FolderManager updatedFolder) {
    FolderManager existing = getFolderById(id);
    if (updatedFolder.getName() != null) {
      existing.setName(updatedFolder.getName());
    }
    if (updatedFolder.getOwner() != null) {
      existing.setOwner(updatedFolder.getOwner());
    }
    return folderManagerRepository.save(existing);
  }

  public void deleteFolderById(Integer id) {
    if (!folderManagerRepository.existsById(id)) {
      throw new IllegalArgumentException("Folder not found with id: " + id);
    }
    folderManagerRepository.deleteById(id);
  }
}

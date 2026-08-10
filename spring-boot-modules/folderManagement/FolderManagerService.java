package com.saigontechnologyintern.document_management.folderManagement;

import com.saigontechnologyintern.document_management.userManagement.UserManager;
import com.saigontechnologyintern.document_management.userManagement.UserManagerRepository;
import org.springframework.stereotype.Service;

import java.util.List;

    @Service
    public class FolderManagerService {
        private final FolderManagerRepository folderManagerRepository;
        private final UserManagerRepository userManagerRepository;

        public FolderManagerService(
                FolderManagerRepository folderManagerRepository,
                UserManagerRepository userManagerRepository) {
            this.folderManagerRepository = folderManagerRepository;
            this.userManagerRepository = userManagerRepository;
        }

    public List<FolderManager> getAllFolders(Integer currentUserId) {
        return folderManagerRepository.findByOwner_UserId(currentUserId);
    }

    public FolderManager getFolderById(Integer id, Integer currentUserId) {
        FolderManager folder = folderManagerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Folder not found with id: " + id));

        boolean isOwner = folder.getOwner() != null && folder.getOwner().getUserId().equals(currentUserId);
        if (!isOwner) {
            throw new IllegalArgumentException("Folder not found with id: " + id);
        }
        return folder;
    }

        public FolderManager createFolder(FolderManager folder, Integer currentUserId) {
            UserManager owner = userManagerRepository.findById(currentUserId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + currentUserId));

            FolderManager entity = new FolderManager();
            entity.setName(folder.getName());
            entity.setOwner(owner);
            return folderManagerRepository.save(entity);
        }

    public FolderManager updateFolder(Integer id, FolderManager updatedFolder, Integer currentUserId) {
        FolderManager existing = getFolderById(id, currentUserId);
        if (updatedFolder.getName() != null) {
            existing.setName(updatedFolder.getName());
        }
        return folderManagerRepository.save(existing);
    }

    public void deleteFolderById(Integer id, Integer currentUserId) {
        FolderManager existing = getFolderById(id, currentUserId);
        folderManagerRepository.delete(existing);
    }
}
package com.studyvault.service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.studyvault.entity.Folder;
import com.studyvault.repository.FolderRepository;
import com.studyvault.repository.ItemRepository;

@Service
public class FolderService {

    @Autowired private FolderRepository folderRepo;
    @Autowired private ItemRepository itemRepo;

    public List<Map<String, Object>> getFolderTree(String userId) {
        List<Folder> roots = folderRepo.findByUserIdAndParentIsNullOrderByCreatedAtAsc(userId);
        return roots.stream().map(f -> buildNode(f, userId)).toList();
    }

    public List<Map<String, Object>> getChildFolders(String userId, Long parentId) {
        return folderRepo.findByUserIdAndParentIdOrderByCreatedAtAsc(userId, parentId)
            .stream().map(f -> buildNode(f, userId)).toList();
    }

    private Map<String, Object> buildNode(Folder f, String userId) {
        Map<String, Object> node = new LinkedHashMap<>();
        node.put("id",        f.getId());
        node.put("name",      f.getName());
        node.put("itemCount", itemRepo.countByUserIdAndFolderId(userId, f.getId()));
        List<Map<String,Object>> children = folderRepo
            .findByUserIdAndParentIdOrderByCreatedAtAsc(userId, f.getId())
            .stream().map(c -> buildNode(c, userId)).toList();
        node.put("children",  children);
        node.put("createdAt", f.getCreatedAt());
        return node;
    }

    public Folder createFolder(String userId, String name, Long parentId) {
        Folder folder = new Folder();
        folder.setName(name);
        folder.setUserId(userId);
        if (parentId != null) {
            folderRepo.findById(parentId)
                .filter(parent -> userId.equals(parent.getUserId()))
                .ifPresent(folder::setParent);
        }
        return folderRepo.save(folder);
    }

    public void deleteFolder(String userId, Long id) {
        Folder folder = folderRepo.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Folder not found"));

        if (!folder.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission to delete this folder");
        }

        folderRepo.delete(folder);
    }

    public Folder updateFolder(String userId, Long id, String name) {
        String nextName = name == null ? "" : name.trim();
        if (nextName.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Folder name is required");
        }

        Folder folder = folderRepo.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Folder not found"));

        if (!folder.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission to edit this folder");
        }

        Long parentId = folder.getParent() != null ? folder.getParent().getId() : null;
        List<Folder> siblings = parentId == null
            ? folderRepo.findByUserIdAndParentIsNullOrderByCreatedAtAsc(userId)
            : folderRepo.findByUserIdAndParentIdOrderByCreatedAtAsc(userId, parentId);

        boolean duplicateName = siblings.stream()
            .filter(sibling -> !Objects.equals(sibling.getId(), id))
            .anyMatch(sibling -> sibling.getName() != null && sibling.getName().trim().equalsIgnoreCase(nextName));
        if (duplicateName) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A folder with this name already exists here");
        }

        folder.setName(nextName);
        return folderRepo.save(folder);
    }

    public Folder moveFolder(String userId, Long id, Long parentId) {
        Folder folder = folderRepo.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Folder not found"));

        if (!userId.equals(folder.getUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission to move this folder");
        }

        Long currentParentId = folder.getParent() != null ? folder.getParent().getId() : null;
        if (Objects.equals(currentParentId, parentId)) {
            return folder;
        }

        if (parentId == null) {
            boolean duplicateName = folderRepo.findByUserIdAndParentIsNullOrderByCreatedAtAsc(userId).stream()
                .filter(sibling -> !Objects.equals(sibling.getId(), id))
                .anyMatch(sibling -> sibling.getName() != null && sibling.getName().trim().equalsIgnoreCase(folder.getName().trim()));
            if (duplicateName) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "A folder with this name already exists at the root level");
            }
            folder.setParent(null);
        } else {
            if (parentId.equals(id)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A folder cannot be moved into itself");
            }

            Folder destination = folderRepo.findById(parentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Destination folder not found"));

            if (!userId.equals(destination.getUserId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot move folders into this destination");
            }

            // Circular cycle prevention: destination cannot be a descendant of folder
            Folder current = destination;
            while (current != null) {
                if (current.getId().equals(id)) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot move a folder into one of its sub-folders");
                }
                current = current.getParent();
            }

            boolean duplicateName = folderRepo.findByUserIdAndParentIdOrderByCreatedAtAsc(userId, parentId).stream()
                .filter(sibling -> !Objects.equals(sibling.getId(), id))
                .anyMatch(sibling -> sibling.getName() != null && sibling.getName().trim().equalsIgnoreCase(folder.getName().trim()));
            if (duplicateName) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "A folder named '" + folder.getName() + "' already exists in the destination folder");
            }

            folder.setParent(destination);
        }

        return folderRepo.save(folder);
    }
}

package com.studyvault.service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

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
}

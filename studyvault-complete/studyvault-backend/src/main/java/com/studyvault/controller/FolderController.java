package com.studyvault.controller;

import com.studyvault.service.FolderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/folders")
public class FolderController {

    @Autowired
    private FolderService folderService;

    @GetMapping
    public ResponseEntity<?> getFolders(Authentication auth,
                                        @RequestParam(required = false) Long parentId) {
        String userId = auth.getName();
        if (parentId == null) {
            return ResponseEntity.ok(folderService.getFolderTree(userId));
        }
        return ResponseEntity.ok(folderService.getChildFolders(userId, parentId));
    }

    @PostMapping
    public ResponseEntity<?> createFolder(Authentication auth,
                                          @RequestBody Map<String, Object> body) {
        String userId  = auth.getName();
        String name    = (String) body.get("name");
        Long parentId  = body.get("parentId") != null
            ? Long.valueOf(body.get("parentId").toString()) : null;
        return ResponseEntity.ok(folderService.createFolder(userId, name, parentId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteFolder(Authentication auth, @PathVariable Long id) {
        folderService.deleteFolder(auth.getName(), id);
        return ResponseEntity.ok(Map.of("message", "Folder deleted"));
    }
}

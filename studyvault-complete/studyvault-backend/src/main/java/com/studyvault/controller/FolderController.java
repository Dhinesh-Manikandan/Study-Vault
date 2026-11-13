package com.studyvault.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.studyvault.service.FolderService;

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

    @PutMapping("/{id}")
    public ResponseEntity<?> updateFolder(Authentication auth,
                                          @PathVariable Long id,
                                          @RequestBody Map<String, Object> body) {
        String name = body.get("name") != null ? String.valueOf(body.get("name")) : "";
        return ResponseEntity.ok(folderService.updateFolder(auth.getName(), id, name));
    }

    @PatchMapping("/{id}/move")
    public ResponseEntity<?> moveFolder(Authentication auth,
                                        @PathVariable Long id,
                                        @RequestBody Map<String, Object> body) {
        Object parentIdRaw = body.get("parentId");
        Long parentId = null;
        if (parentIdRaw != null) {
            String str = parentIdRaw.toString().trim();
            if (!str.isEmpty() && !str.equalsIgnoreCase("null") && !str.equals("0")) {
                try {
                    parentId = Long.valueOf(str);
                } catch (NumberFormatException ex) {
                    return ResponseEntity.badRequest().body(Map.of("message", "Invalid destination folder"));
                }
            }
        }
        try {
            return ResponseEntity.ok(folderService.moveFolder(auth.getName(), id, parentId));
        } catch (ResponseStatusException ex) {
            String message = ex.getReason() != null ? ex.getReason() : "Failed to move folder";
            return ResponseEntity.status(ex.getStatusCode()).body(Map.of("message", message));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Failed to move folder"));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteFolder(Authentication auth, @PathVariable Long id) {
        try {
            folderService.deleteFolder(auth.getName(), id);
            return ResponseEntity.ok(Map.of("message", "Folder deleted"));
        } catch (ResponseStatusException ex) {
            String message = ex.getReason() != null ? ex.getReason() : "Failed to delete folder";
            return ResponseEntity.status(ex.getStatusCode()).body(Map.of("message", message));
        }
    }
}

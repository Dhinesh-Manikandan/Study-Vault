package com.studyvault.controller;

import java.util.Arrays;
import java.util.List;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.studyvault.entity.Item;
import com.studyvault.service.ItemService;

@RestController
@RequestMapping("/api/items")
public class ItemController {

    @Autowired
    private ItemService itemService;

    @GetMapping
    public ResponseEntity<?> getItems(Authentication auth, @RequestParam Long folderId) {
        return ResponseEntity.ok(itemService.getItemsInFolder(auth.getName(), folderId));
    }

    @GetMapping("/recent")
    public ResponseEntity<?> getRecent(Authentication auth) {
        return ResponseEntity.ok(itemService.getRecentItems(auth.getName()));
    }

    @GetMapping("/starred")
    public ResponseEntity<?> getStarred(Authentication auth) {
        return ResponseEntity.ok(itemService.getStarredItems(auth.getName()));
    }

    @GetMapping("/revision")
    public ResponseEntity<?> getRevision(Authentication auth) {
        return ResponseEntity.ok(itemService.getRevisionItems(auth.getName()));
    }

    @GetMapping("/search")
    public ResponseEntity<?> search(Authentication auth,
                                    @RequestParam String q,
                                    @RequestParam(required = false) String type) {
        Item.Type t = null;
        if (type != null && !type.isBlank()) {
            try { t = Item.Type.valueOf(type.toUpperCase()); } catch (IllegalArgumentException ignored) {}
        }
        return ResponseEntity.ok(itemService.search(auth.getName(), q, t));
    }

    @PostMapping
    public ResponseEntity<?> createItem(Authentication auth, @RequestBody Map<String, Object> body) {
        try {
            return ResponseEntity.ok(itemService.createItem(auth.getName(), body));
        } catch (ResponseStatusException ex) {
            String message = ex.getReason() != null ? ex.getReason() : "Failed to save item";
            return ResponseEntity.status(ex.getStatusCode()).body(Map.of("message", message));
        }
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadItem(
            Authentication auth,
            @RequestParam("file")     MultipartFile file,
            @RequestParam("title")    String title,
            @RequestParam("folderId") Long folderId,
            @RequestParam("type")     String type,
            @RequestParam(value = "tags",  required = false) String tags,
            @RequestParam(value = "notes", required = false) String notes) throws Exception {

        List<String> tagList = (tags != null && !tags.isBlank())
            ? Arrays.asList(tags.split(",")) : List.of();

        Item.Type itemType;
        try {
            itemType = Item.Type.valueOf(type.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid item type");
        }

        try {
            return ResponseEntity.ok(
                itemService.uploadItem(auth.getName(), file, title, folderId,
                    itemType, tagList, notes)
            );
        } catch (ResponseStatusException ex) {
            String message = ex.getReason() != null ? ex.getReason() : "Failed to upload item";
            return ResponseEntity.status(ex.getStatusCode()).body(Map.of("message", message));
        }
    }

    @PatchMapping("/{id}/star")
    public ResponseEntity<?> toggleStar(Authentication auth, @PathVariable Long id) {
        return ResponseEntity.ok(itemService.toggleStar(auth.getName(), id));
    }

    @PatchMapping("/{id}/tags")
    public ResponseEntity<?> updateTags(Authentication auth,
                                        @PathVariable Long id,
                                        @RequestBody Map<String, Object> body) {
        Object tagsRaw = body.get("tags");
        List<String> tags = tagsRaw instanceof List<?> rawList
            ? rawList.stream().map(String::valueOf).toList()
            : List.of();
        try {
            Item updated = itemService.updateTags(auth.getName(), id, tags);
            return ResponseEntity.ok(Map.of(
                "id", updated.getId(),
                "tags", updated.getTags() != null ? updated.getTags() : List.of()
            ));
        } catch (ResponseStatusException ex) {
            String message = ex.getReason() != null ? ex.getReason() : "Failed to update tags";
            return ResponseEntity.status(ex.getStatusCode()).body(Map.of("message", message));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Failed to update tags"));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteItem(Authentication auth, @PathVariable Long id) {
        itemService.deleteItem(auth.getName(), id);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> downloadItem(Authentication auth, @PathVariable Long id) throws Exception {
        return itemService.downloadItem(auth.getName(), id);
    }
}

package com.studyvault.controller;

import com.studyvault.entity.Item;
import com.studyvault.service.ItemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

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
        return ResponseEntity.ok(itemService.createItem(auth.getName(), body));
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

        return ResponseEntity.ok(
            itemService.uploadItem(auth.getName(), file, title, folderId,
                Item.Type.valueOf(type.toUpperCase()), tagList, notes)
        );
    }

    @PatchMapping("/{id}/star")
    public ResponseEntity<?> toggleStar(Authentication auth, @PathVariable Long id) {
        return ResponseEntity.ok(itemService.toggleStar(auth.getName(), id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteItem(Authentication auth, @PathVariable Long id) {
        itemService.deleteItem(auth.getName(), id);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }
}

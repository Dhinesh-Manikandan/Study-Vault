package com.studyvault.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.studyvault.entity.Folder;
import com.studyvault.entity.Item;
import com.studyvault.repository.FolderRepository;
import com.studyvault.repository.ItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.*;

@Service
public class ItemService {

    @Autowired private ItemRepository itemRepo;
    @Autowired private FolderRepository folderRepo;
    @Autowired private Cloudinary cloudinary;

    public List<Item> getItemsInFolder(String userId, Long folderId) {
        return itemRepo.findByUserIdAndFolderIdOrderByCreatedAtDesc(userId, folderId);
    }

    public List<Item> getRecentItems(String userId) {
        return itemRepo.findTop20ByUserIdOrderByCreatedAtDesc(userId);
    }

    public List<Item> getStarredItems(String userId) {
        return itemRepo.findByUserIdAndStarredTrueOrderByCreatedAtDesc(userId);
    }

    public List<Item> search(String userId, String query, Item.Type type) {
        if (type != null) return itemRepo.searchByType(userId, query, type);
        return itemRepo.search(userId, query);
    }

    public Item createItem(String userId, Map<String, Object> body) {
        Item item = new Item();
        item.setTitle((String) body.get("title"));
        item.setUrl((String) body.get("url"));
        item.setContent((String) body.get("content"));
        item.setNotes((String) body.get("notes"));
        item.setUserId(userId);
        item.setType(Item.Type.valueOf((String) body.get("type")));

        Long folderId = Long.valueOf(body.get("folderId").toString());
        Folder folder = folderRepo.findById(folderId)
            .orElseThrow(() -> new RuntimeException("Folder not found"));
        item.setFolder(folder);

        @SuppressWarnings("unchecked")
        List<String> tags = (List<String>) body.getOrDefault("tags", List.of());
        item.setTags(tags);

        return itemRepo.save(item);
    }

    public Item uploadItem(String userId, MultipartFile file, String title,
                           Long folderId, Item.Type type,
                           List<String> tags, String notes) throws IOException {
        // Upload to Cloudinary
        Map<?, ?> result = cloudinary.uploader().upload(file.getBytes(),
            ObjectUtils.asMap("folder", "studyvault/" + userId));
        String fileUrl = (String) result.get("secure_url");

        Item item = new Item();
        item.setTitle(title);
        item.setFileUrl(fileUrl);
        item.setType(type);
        item.setUserId(userId);
        item.setTags(tags != null ? tags : List.of());
        item.setNotes(notes);

        Folder folder = folderRepo.findById(folderId)
            .orElseThrow(() -> new RuntimeException("Folder not found"));
        item.setFolder(folder);

        return itemRepo.save(item);
    }

    public Item toggleStar(String userId, Long id) {
        Item item = itemRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Item not found"));
        if (!item.getUserId().equals(userId)) throw new RuntimeException("Forbidden");
        item.setStarred(!item.isStarred());
        return itemRepo.save(item);
    }

    public void deleteItem(String userId, Long id) {
        itemRepo.findById(id).ifPresent(item -> {
            if (item.getUserId().equals(userId)) itemRepo.delete(item);
        });
    }

    public Map<String, Long> getStats(String userId) {
        long total    = itemRepo.countByUserId(userId);
        long starred  = itemRepo.countByUserIdAndStarredTrue(userId);
        long folders  = folderRepo.findByUserIdOrderByCreatedAtAsc(userId).size();
        return Map.of("totalItems", total, "starredItems", starred, "totalFolders", folders);
    }
}

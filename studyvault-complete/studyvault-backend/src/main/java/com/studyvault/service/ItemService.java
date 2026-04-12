package com.studyvault.service;

import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.net.URLConnection;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Deque;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.studyvault.entity.Exam;
import com.studyvault.entity.Folder;
import com.studyvault.entity.Item;
import com.studyvault.repository.ExamRepository;
import com.studyvault.repository.FolderRepository;
import com.studyvault.repository.ItemRepository;

@Service
public class ItemService {

    private static final Set<String> DOC_EXTENSIONS = Set.of("pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx");
    private static final Set<String> IMAGE_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp", "gif", "heic", "heif");
    private static final Set<String> ALLOWED_TAGS = Set.of("important", "confusing", "revision");
    private static final int MAX_NOTE_WORDS = 2000;
    private static final int MAX_URL_LENGTH = 2048;

    @Autowired private ItemRepository itemRepo;
    @Autowired private FolderRepository folderRepo;
    @Autowired private ExamRepository examRepo;
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

    public List<Item> getRevisionItems(String userId) {
        return itemRepo.findByUserIdOrderByCreatedAtDesc(userId).stream()
            .filter(item -> item.getTags() != null && item.getTags().stream()
                .map(this::normalizeTag)
                .anyMatch("revision"::equals))
            .toList();
    }

    public List<Item> search(String userId, String query, Item.Type type, String tag) {
        String normalizedQuery = query == null ? "" : query.trim();
        String normalizedTag = normalizeTag(tag);
        if (!ALLOWED_TAGS.contains(normalizedTag)) {
            normalizedTag = "";
        }

        List<Item> base;
        if (normalizedQuery.isEmpty()) {
            if (type != null) {
                base = itemRepo.findByUserIdAndTypeOrderByCreatedAtDesc(userId, type);
            } else {
                base = itemRepo.findByUserIdOrderByCreatedAtDesc(userId);
            }
        } else {
            if (type != null) {
                base = itemRepo.searchByType(userId, normalizedQuery, type);
            } else {
                base = itemRepo.search(userId, normalizedQuery);
            }
        }

        if (normalizedTag.isEmpty()) {
            return base;
        }

        String tagToMatch = normalizedTag;
        return base.stream()
            .filter(item -> item.getTags() != null && item.getTags().stream()
                .map(this::normalizeTag)
                .anyMatch(tagToMatch::equals))
            .toList();
    }

    public Item createItem(String userId, Map<String, Object> body) {
        String title = Objects.toString(body.get("title"), "").trim();
        if (title.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Title is required");
        }

        String typeRaw = Objects.toString(body.get("type"), "").trim();
        Item.Type itemType;
        try {
            itemType = Item.Type.valueOf(typeRaw.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid item type");
        }

        Object folderIdRaw = body.get("folderId");
        if (folderIdRaw == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Folder is required");
        }

        Long folderId;
        try {
            folderId = Long.valueOf(folderIdRaw.toString());
        } catch (NumberFormatException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid folder id");
        }

        Item item = new Item();
        item.setTitle(title);
        String normalizedUrl = normalizeUrl((String) body.get("url"));
        String content = normalizeText((String) body.get("content"));
        String notes = normalizeText((String) body.get("notes"));

        validateItemPayload(itemType, normalizedUrl, content, notes);

        item.setUrl(normalizedUrl);
        item.setContent(content);
        item.setNotes(notes);
        item.setUserId(userId);
        item.setType(itemType);

        Folder folder = folderRepo.findById(folderId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Folder not found"));
        if (!userId.equals(folder.getUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot save items in this folder");
        }
        ensureUniqueItemTitle(userId, folderId, title);
        item.setFolder(folder);

        @SuppressWarnings("unchecked")
        List<String> tags = (List<String>) body.getOrDefault("tags", List.of());
        List<String> normalizedTags = normalizeTags(tags);
        item.setTags(normalizedTags);
        Long examId = parseExamId(body.get("examId"));
        item.setExamId(resolveExamId(userId, normalizedTags, examId));

        return itemRepo.save(item);
    }

    public Item uploadItem(String userId, MultipartFile file, String title,
                           Long folderId, Item.Type type,
                           List<String> tags, String notes, Long examId) throws IOException {
        if (title == null || title.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Title is required");
        }
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please choose a file to upload");
        }

        String extension = getExtension(file.getOriginalFilename());
        if (type == Item.Type.PDF && !DOC_EXTENSIONS.contains(extension)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Unsupported document format. Use PDF, DOC, DOCX, PPT, PPTX, XLS, or XLSX");
        }
        if (type == Item.Type.IMAGE && !IMAGE_EXTENSIONS.contains(extension)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Unsupported image format. Use JPG, JPEG, PNG, WEBP, GIF, or HEIC");
        }

        // Upload to Cloudinary
        String resourceType;
        if (type == Item.Type.IMAGE) {
            resourceType = "image";
        } else {
            resourceType = "raw";
        }

        Map<?, ?> result;
        try {
            result = cloudinary.uploader().upload(file.getBytes(),
                ObjectUtils.asMap(
                    "folder", "studyvault/" + userId,
                    "resource_type", resourceType,
                    "use_filename", true,
                    "unique_filename", true
                ));
        } catch (IOException | RuntimeException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Upload failed for this file. Check format and size, then try again.");
        }
        String fileUrl = (String) result.get("secure_url");

        Item item = new Item();
        item.setTitle(title);
        item.setFileUrl(fileUrl);
        item.setType(type);
        item.setUserId(userId);
        List<String> normalizedTags = normalizeTags(tags);
        item.setTags(normalizedTags);
        item.setExamId(resolveExamId(userId, normalizedTags, examId));
        String normalizedNotes = normalizeText(notes);
        validateWordLimit(normalizedNotes, "Personal note");
        item.setNotes(normalizedNotes);

        Folder folder = folderRepo.findById(folderId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Folder not found"));
        if (!userId.equals(folder.getUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot save items in this folder");
        }
        ensureUniqueItemTitle(userId, folderId, title);
        item.setFolder(folder);

        return itemRepo.save(item);
    }

    private void ensureUniqueItemTitle(String userId, Long folderId, String title) {
        String normalizedTitle = title == null ? "" : title.trim();
        if (normalizedTitle.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Title is required");
        }

        boolean exists = itemRepo.existsByUserIdAndFolderIdAndTitleIgnoreCase(userId, folderId, normalizedTitle);
        if (exists) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "An item with this name already exists in this folder");
        }
    }

    private String getExtension(String filename) {
        if (filename == null || filename.isBlank()) return "";
        int index = filename.lastIndexOf('.');
        if (index < 0 || index == filename.length() - 1) return "";
        return filename.substring(index + 1).toLowerCase();
    }

    public Item toggleStar(String userId, Long id) {
        Item item = itemRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Item not found"));
        if (!item.getUserId().equals(userId)) throw new RuntimeException("Forbidden");
        item.setStarred(!item.isStarred());
        return itemRepo.save(item);
    }

    public Item updateTags(String userId, Long id, List<String> tags, Long examId, boolean hasExamId) {
        Item item = itemRepo.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found"));
        if (!item.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot update tags for this item");
        }

        List<String> normalizedTags = normalizeTags(tags);
        item.setTags(normalizedTags);

        boolean isRevision = normalizedTags.stream().map(this::normalizeTag).anyMatch("revision"::equals);
        if (!isRevision) {
            item.setExamId(null);
        } else if (hasExamId) {
            item.setExamId(resolveExamId(userId, normalizedTags, examId));
        }

        return itemRepo.save(item);
    }

    public Map<String, Object> updateFolderRevisionTags(String userId, Long folderId, boolean enabled) {
        Folder folder = folderRepo.findById(folderId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Folder not found"));

        if (!userId.equals(folder.getUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot update this folder");
        }

        List<Long> folderIds = collectFolderIds(userId, folderId);
        List<Item> items = itemRepo.findByUserIdAndFolderIdInOrderByCreatedAtDesc(userId, folderIds);

        List<Item> changedItems = new ArrayList<>();
        for (Item item : items) {
            List<String> existingTags = item.getTags() == null ? List.of() : item.getTags();
            LinkedHashSet<String> nextTags = new LinkedHashSet<>();

            for (String rawTag : existingTags) {
                String normalized = normalizeTag(rawTag);
                if (!normalized.isEmpty() && ALLOWED_TAGS.contains(normalized)) {
                    nextTags.add(normalized);
                }
            }

            boolean changed;
            if (enabled) {
                changed = nextTags.add("revision");
            } else {
                changed = nextTags.remove("revision");
                if (item.getExamId() != null) {
                    item.setExamId(null);
                    changed = true;
                }
            }

            if (changed) {
                item.setTags(new ArrayList<>(nextTags));
                changedItems.add(item);
            }
        }

        if (!changedItems.isEmpty()) {
            itemRepo.saveAll(changedItems);
        }

        return Map.of(
            "folderId", folderId,
            "revisionEnabled", enabled,
            "updatedCount", changedItems.size()
        );
    }

    public void deleteItem(String userId, Long id) {
        itemRepo.findById(id).ifPresent(item -> {
            if (item.getUserId().equals(userId)) itemRepo.delete(item);
        });
    }

    public ResponseEntity<byte[]> downloadItem(String userId, Long id) throws IOException {
        Item item = itemRepo.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found"));

        if (!userId.equals(item.getUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission to access this item");
        }

        String sourceUrl = item.getFileUrl() != null && !item.getFileUrl().isBlank()
            ? item.getFileUrl()
            : item.getUrl();

        if (sourceUrl == null || sourceUrl.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This item does not contain a downloadable file");
        }

        String downloadUrl = resolveDownloadUrl(sourceUrl);

        HttpURLConnection connection = (HttpURLConnection) new URL(downloadUrl).openConnection();
        connection.setInstanceFollowRedirects(true);
        connection.setConnectTimeout(15000);
        connection.setReadTimeout(30000);

        int status = connection.getResponseCode();
        if (status >= 400) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to open this file right now");
        }

        byte[] data;
        try (InputStream inputStream = connection.getInputStream()) {
            data = inputStream.readAllBytes();
        }

        String contentType = connection.getContentType();
        if (contentType == null || contentType.isBlank()) {
            contentType = URLConnection.guessContentTypeFromName(sourceUrl);
        }
        if (contentType == null || contentType.isBlank()) {
            contentType = "application/octet-stream";
        }

        String fileName = extractFileName(sourceUrl);
        MediaType mediaType;
        try {
            mediaType = MediaType.parseMediaType(contentType);
        } catch (IllegalArgumentException ex) {
            mediaType = MediaType.APPLICATION_OCTET_STREAM;
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(mediaType);
        headers.setContentDisposition(ContentDisposition.inline().filename(fileName).build());

        return new ResponseEntity<>(data, headers, HttpStatus.OK);
    }

    private List<String> normalizeTags(List<String> tags) {
        if (tags == null) {
            return List.of();
        }

        LinkedHashSet<String> unique = new LinkedHashSet<>();
        for (String raw : tags) {
            String normalized = normalizeTag(raw);
            if (!normalized.isEmpty() && ALLOWED_TAGS.contains(normalized)) {
                unique.add(normalized);
            }
        }
        return new ArrayList<>(unique);
    }

    private String normalizeTag(String raw) {
        if (raw == null) {
            return "";
        }

        String tag = raw.trim().toLowerCase(Locale.ROOT);
        if (tag.startsWith("#")) {
            tag = tag.substring(1).trim();
        }
        return tag;
    }

    private Long parseExamId(Object examIdRaw) {
        if (examIdRaw == null) {
            return null;
        }

        String value = String.valueOf(examIdRaw).trim();
        if (value.isEmpty()) {
            return null;
        }

        try {
            return Long.valueOf(value);
        } catch (NumberFormatException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid exam id");
        }
    }

    private Long resolveExamId(String userId, List<String> tags, Long examId) {
        boolean revisionTag = tags != null && tags.stream().map(this::normalizeTag).anyMatch("revision"::equals);
        if (!revisionTag) {
            return null;
        }
        if (examId == null) {
            return null;
        }

        Exam exam = examRepo.findById(examId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Exam not found"));
        if (!userId.equals(exam.getUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot link this exam");
        }

        return examId;
    }

    private List<Long> collectFolderIds(String userId, Long rootFolderId) {
        Map<Long, List<Long>> childrenByParent = new HashMap<>();
        for (Folder current : folderRepo.findByUserIdOrderByCreatedAtAsc(userId)) {
            Long parentId = current.getParent() != null ? current.getParent().getId() : null;
            childrenByParent.computeIfAbsent(parentId, key -> new ArrayList<>()).add(current.getId());
        }

        List<Long> collected = new ArrayList<>();
        Deque<Long> pending = new ArrayDeque<>();
        pending.push(rootFolderId);

        while (!pending.isEmpty()) {
            Long currentId = pending.pop();
            collected.add(currentId);

            List<Long> children = childrenByParent.getOrDefault(currentId, List.of());
            for (Long childId : children) {
                pending.push(childId);
            }
        }

        return collected;
    }

    private String resolveDownloadUrl(String sourceUrl) {
        if (!isCloudinaryUrl(sourceUrl)) {
            return sourceUrl;
        }

        try {
            CloudinaryAssetRef assetRef = parseCloudinaryAsset(sourceUrl);
            return cloudinary.url()
                .resourceType(assetRef.resourceType())
                .type(assetRef.deliveryType())
                .format(assetRef.format())
                .signed(true)
                .generate(assetRef.publicId());
        } catch (IOException | RuntimeException ex) {
            return sourceUrl;
        }
    }

    private String normalizeText(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalizeUrl(String rawUrl) {
        String normalized = normalizeText(rawUrl);
        if (normalized == null) {
            return null;
        }

        if (!normalized.matches("^[a-zA-Z][a-zA-Z0-9+.-]*://.*$")) {
            normalized = "https://" + normalized;
        }
        return normalized;
    }

    private void validateItemPayload(Item.Type itemType, String url, String content, String notes) {
        if ((itemType == Item.Type.LINK || itemType == Item.Type.YOUTUBE)) {
            if (url == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "URL is required for this item type");
            }
            validateUrl(url);
        }

        if (itemType == Item.Type.NOTE) {
            if (content == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Note content is required");
            }
            validateWordLimit(content, "Note content");
        }

        validateWordLimit(notes, "Personal note");
    }

    private void validateUrl(String url) {
        if (url.length() > MAX_URL_LENGTH) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "URL is too long");
        }

        try {
            URI uri = URI.create(url);
            if (uri.getScheme() == null || uri.getHost() == null) {
                throw new IllegalArgumentException("Invalid URL");
            }
        } catch (RuntimeException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter a valid URL");
        }
    }

    private void validateWordLimit(String text, String fieldName) {
        if (text == null) {
            return;
        }

        int wordCount = text.trim().isEmpty() ? 0 : text.trim().split("\\s+").length;
        if (wordCount > MAX_NOTE_WORDS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                fieldName + " cannot exceed " + MAX_NOTE_WORDS + " words");
        }
    }

    private boolean isCloudinaryUrl(String sourceUrl) {
        return sourceUrl != null && sourceUrl.contains("res.cloudinary.com");
    }

    private CloudinaryAssetRef parseCloudinaryAsset(String sourceUrl) throws IOException {
        URL url = new URL(sourceUrl);
        String path = url.getPath();
        if (path == null || path.isBlank()) {
            throw new IOException("Invalid Cloudinary URL");
        }

        String[] segments = path.split("/");
        if (segments.length < 5) {
            throw new IOException("Invalid Cloudinary URL");
        }

        String resourceType = segments[2];
        String deliveryType = segments[3];

        int index = 4;
        if (index < segments.length && segments[index].startsWith("s--") && segments[index].endsWith("--")) {
            index++;
        }
        if (index < segments.length && segments[index].matches("v\\d+")) {
            index++;
        }
        if (index >= segments.length) {
            throw new IOException("Invalid Cloudinary URL");
        }

        String fileName = segments[segments.length - 1];
        int extensionIndex = fileName.lastIndexOf('.');
        String format = extensionIndex > -1 && extensionIndex < fileName.length() - 1
            ? fileName.substring(extensionIndex + 1)
            : "";

        String[] publicIdSegments = Arrays.copyOfRange(segments, index, segments.length);
        if (publicIdSegments.length == 0) {
            throw new IOException("Invalid Cloudinary URL");
        }

        publicIdSegments[publicIdSegments.length - 1] = extensionIndex > -1
            ? fileName.substring(0, extensionIndex)
            : fileName;

        String publicId = String.join("/", publicIdSegments);
        if (publicId.isBlank() || format.isBlank()) {
            throw new IOException("Invalid Cloudinary URL");
        }

        return new CloudinaryAssetRef(resourceType, deliveryType, publicId, format);
    }

    private record CloudinaryAssetRef(String resourceType, String deliveryType, String publicId, String format) {}

    private String extractFileName(String sourceUrl) {
        try {
            String path = new URL(sourceUrl).getPath();
            if (path == null || path.isBlank()) return "file";
            String candidate = path.substring(path.lastIndexOf('/') + 1);
            return candidate.isBlank() ? "file" : candidate;
        } catch (IOException ex) {
            return "file";
        }
    }

    public Map<String, Long> getStats(String userId) {
        long total    = itemRepo.countByUserId(userId);
        long starred  = itemRepo.countByUserIdAndStarredTrue(userId);
        long folders  = folderRepo.findByUserIdOrderByCreatedAtAsc(userId).size();
        return Map.of("totalItems", total, "starredItems", starred, "totalFolders", folders);
    }
}

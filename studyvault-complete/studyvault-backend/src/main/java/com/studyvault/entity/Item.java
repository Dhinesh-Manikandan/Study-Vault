package com.studyvault.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "items")
@Data
@NoArgsConstructor
public class Item {

    public enum Type { YOUTUBE, PDF, IMAGE, LINK, NOTE }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(length = 2048)
    private String url;           // for YouTube, LINK

    @Column(length = 2048)
    private String fileUrl;       // for PDF, IMAGE (Cloudinary URL)

    @Column(columnDefinition = "TEXT")
    private String content;       // for NOTE

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Type type;

    @Column(nullable = false)
    private String userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "folder_id", nullable = false)
    @JsonIgnore
    private Folder folder;

    private boolean starred = false;

    @ElementCollection
    @CollectionTable(name = "item_tags", joinColumns = @JoinColumn(name = "item_id"))
    @Column(name = "tag")
    private List<String> tags = new ArrayList<>();

    @Column(columnDefinition = "TEXT")
    private String notes;         // personal note about the item

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = updatedAt = LocalDateTime.now();
    }
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    @JsonProperty("folderId")
    public Long getFolderIdentifier() {
        return folder != null ? folder.getId() : null;
    }

    @JsonProperty("folderPath")
    public String getFolderLocation() {
        if (folder == null) {
            return null;
        }

        List<String> names = new ArrayList<>();
        Folder current = folder;
        while (current != null) {
            names.add(0, current.getName());
            current = current.getParent();
        }
        return String.join(" › ", names);
    }
}

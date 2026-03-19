package com.studyvault.repository;

import com.studyvault.entity.Folder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface FolderRepository extends JpaRepository<Folder, Long> {

    // Root folders (no parent) for a user
    List<Folder> findByUserIdAndParentIsNullOrderByCreatedAtAsc(String userId);

    // Children of a specific folder
    List<Folder> findByUserIdAndParentIdOrderByCreatedAtAsc(String userId, Long parentId);

    // All folders for a user (for flat list)
    List<Folder> findByUserIdOrderByCreatedAtAsc(String userId);
}

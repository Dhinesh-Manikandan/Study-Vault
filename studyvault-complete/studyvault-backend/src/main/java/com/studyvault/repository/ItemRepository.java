package com.studyvault.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.studyvault.entity.Item;

public interface ItemRepository extends JpaRepository<Item, Long> {

    List<Item> findByUserIdAndFolderIdOrderByCreatedAtDesc(String userId, Long folderId);

       long countByUserIdAndFolderId(String userId, Long folderId);

       boolean existsByUserIdAndFolderIdAndTitleIgnoreCase(String userId, Long folderId, String title);

    List<Item> findByUserIdAndStarredTrueOrderByCreatedAtDesc(String userId);

       List<Item> findByUserIdOrderByCreatedAtDesc(String userId);

       @Query("SELECT DISTINCT i FROM Item i JOIN i.tags t WHERE i.userId = :userId AND LOWER(t) = LOWER(:tag) ORDER BY i.createdAt DESC")
       List<Item> findByUserIdAndTagOrderByCreatedAtDesc(@Param("userId") String userId,
                                                                                             @Param("tag") String tag);

    List<Item> findTop20ByUserIdOrderByCreatedAtDesc(String userId);

    @Query("SELECT i FROM Item i WHERE i.userId = :userId AND " +
           "(LOWER(i.title) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           " LOWER(i.notes) LIKE LOWER(CONCAT('%', :q, '%')))")
    List<Item> search(@Param("userId") String userId, @Param("q") String query);

    @Query("SELECT i FROM Item i WHERE i.userId = :userId AND i.type = :type AND " +
           "(LOWER(i.title) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           " LOWER(i.notes) LIKE LOWER(CONCAT('%', :q, '%')))")
    List<Item> searchByType(@Param("userId") String userId, @Param("q") String query,
                            @Param("type") Item.Type type);

    long countByUserId(String userId);

    long countByUserIdAndStarredTrue(String userId);
}

package com.studyvault.repository;

import com.studyvault.entity.Exam;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ExamRepository extends JpaRepository<Exam, Long> {
    List<Exam> findByUserIdOrderByExamDateAsc(String userId);
}

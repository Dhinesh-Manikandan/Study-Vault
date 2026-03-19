package com.studyvault.controller;

import com.studyvault.entity.Exam;
import com.studyvault.repository.ExamRepository;
import com.studyvault.service.ItemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Map;

@RestController
@RequestMapping("/api/exams")
class ExamController {

    @Autowired ExamRepository examRepo;

    @GetMapping
    public ResponseEntity<?> getExams(Authentication auth) {
        return ResponseEntity.ok(examRepo.findByUserIdOrderByExamDateAsc(auth.getName()));
    }

    @PostMapping
    public ResponseEntity<?> createExam(Authentication auth, @RequestBody Map<String, String> body) {
        Exam exam = new Exam();
        exam.setSubject(body.get("subject"));
        exam.setUserId(auth.getName());
        exam.setExamDate(LocalDate.parse(body.get("date")));
        if (body.get("time") != null && !body.get("time").isBlank())
            exam.setExamTime(LocalTime.parse(body.get("time")));
        return ResponseEntity.ok(examRepo.save(exam));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteExam(Authentication auth, @PathVariable Long id) {
        examRepo.findById(id).ifPresent(e -> {
            if (e.getUserId().equals(auth.getName())) examRepo.delete(e);
        });
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }
}

@RestController
@RequestMapping("/api/stats")
class StatsController {

    @Autowired ItemService itemService;

    @GetMapping
    public ResponseEntity<?> getStats(Authentication auth) {
        return ResponseEntity.ok(itemService.getStats(auth.getName()));
    }
}

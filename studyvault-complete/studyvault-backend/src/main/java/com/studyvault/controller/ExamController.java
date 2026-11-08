package com.studyvault.controller;

import com.studyvault.entity.Exam;
import com.studyvault.repository.ExamRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Map;

@RestController
@RequestMapping("/api/exams")
public class ExamController {

    @Autowired ExamRepository examRepo;

    @GetMapping
    public ResponseEntity<?> getExams(Authentication auth) {
        return ResponseEntity.ok(
            examRepo.findByUserIdAndExamDateGreaterThanEqualOrderByExamDateAsc(auth.getName(), LocalDate.now())
        );
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

    @PutMapping("/{id}")
    public ResponseEntity<?> updateExam(Authentication auth,
                                        @PathVariable Long id,
                                        @RequestBody Map<String, String> body) {
        Exam exam = examRepo.findById(id).orElse(null);
        if (exam == null || !exam.getUserId().equals(auth.getName())) {
            return ResponseEntity.status(404).body(Map.of("message", "Exam not found"));
        }

        String subject = body.get("subject") != null ? body.get("subject").trim() : exam.getSubject();
        if (subject == null || subject.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Subject is required"));
        }

        exam.setSubject(subject);

        if (body.containsKey("date")) {
            String dateValue = body.get("date");
            if (dateValue == null || dateValue.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Exam date is required"));
            }
            exam.setExamDate(LocalDate.parse(dateValue));
        }

        if (body.containsKey("time")) {
            String timeValue = body.get("time");
            if (timeValue == null || timeValue.isBlank()) {
                exam.setExamTime(null);
            } else {
                exam.setExamTime(LocalTime.parse(timeValue));
            }
        }

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
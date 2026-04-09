package com.studyvault.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.studyvault.entity.Exam;
import com.studyvault.entity.Folder;
import com.studyvault.entity.Item;
import com.studyvault.repository.ExamRepository;
import com.studyvault.repository.FolderRepository;
import com.studyvault.repository.ItemRepository;

@Service
public class AccountService {

    @Autowired private ItemRepository itemRepo;
    @Autowired private FolderRepository folderRepo;
    @Autowired private ExamRepository examRepo;

    @Transactional
    public void deleteUserData(String userId) {
        List<Item> items = itemRepo.findByUserIdOrderByCreatedAtDesc(userId);
        if (!items.isEmpty()) {
            itemRepo.deleteAll(items);
        }

        List<Exam> exams = examRepo.findByUserIdOrderByExamDateAsc(userId);
        if (!exams.isEmpty()) {
            examRepo.deleteAll(exams);
        }

        List<Folder> roots = folderRepo.findByUserIdAndParentIsNullOrderByCreatedAtAsc(userId);
        for (Folder root : roots) {
            folderRepo.delete(root);
        }
    }
}
package com.school.management.service;

import com.school.management.entity.Homework;
import com.school.management.repository.HomeworkRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class HomeworkService {

    @Autowired
    private HomeworkRepository homeworkRepository;

    public List<Homework> getAllHomework() {
        return homeworkRepository.findAll();
    }

    public Optional<Homework> getHomeworkById(Long id) {
        return homeworkRepository.findById(id);
    }

    public List<Homework> getHomeworkByClassId(Long classId) {
        return homeworkRepository.findBySchoolClassId(classId);
    }

    public Homework saveHomework(Homework homework) {
        return homeworkRepository.save(homework);
    }

    public void deleteHomework(Long id) {
        homeworkRepository.deleteById(id);
    }
}

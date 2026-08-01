package com.school.management.service;

import com.school.management.entity.SchoolClass;
import com.school.management.entity.Student;
import com.school.management.repository.SchoolClassRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
public class SchoolClassService {

    @Autowired
    private SchoolClassRepository schoolClassRepository;

    public List<SchoolClass> getAllClasses() {
        return schoolClassRepository.findAll();
    }

    public Optional<SchoolClass> getClassById(Long id) {
        return schoolClassRepository.findById(id);
    }

    public List<Student> getStudentsByClassId(Long classId) {
        return schoolClassRepository.findById(classId)
                .map(SchoolClass::getStudents)
                .orElse(Collections.emptyList());
    }

    public SchoolClass saveClass(SchoolClass schoolClass) {
        return schoolClassRepository.save(schoolClass);
    }

    public void deleteClass(Long id) {
        schoolClassRepository.deleteById(id);
    }
}

package com.school.management.repository;

import com.school.management.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {
    List<Student> findBySchoolClassId(Long classId);
    List<Student> findByParentId(Long parentId);
}

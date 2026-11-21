package com.school.management.repository;

import com.school.management.entity.Homework;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HomeworkRepository extends JpaRepository<Homework, Long> {
    List<Homework> findBySchoolClassId(Long classId);
    List<Homework> findByTeacherId(Long teacherId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE Homework h SET h.teacher = null WHERE h.teacher.id = :teacherId")
    void disassociateTeacher(@org.springframework.data.repository.query.Param("teacherId") Long teacherId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE Homework h SET h.schoolClass = null WHERE h.schoolClass.id = :classId")
    void disassociateClass(@org.springframework.data.repository.query.Param("classId") Long classId);
}

package com.school.management.repository;

import com.school.management.entity.SchoolClass;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SchoolClassRepository extends JpaRepository<SchoolClass, Long> {
    @Query("SELECT DISTINCT c FROM SchoolClass c LEFT JOIN c.teachers t WHERE c.teacher.id = :teacherId OR t.id = :teacherId")
    List<SchoolClass> findByTeacherId(@Param("teacherId") Long teacherId);
}

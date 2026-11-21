package com.school.management.repository;

import com.school.management.entity.SchoolDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SchoolDocumentRepository extends JpaRepository<SchoolDocument, Long> {
    List<SchoolDocument> findAllByOrderBySubmissionDateDesc();
    List<SchoolDocument> findBySubmittedByOrderBySubmissionDateDesc(String submittedBy);
    List<SchoolDocument> findBySchoolClassIdOrderBySubmissionDateDesc(Long classId);
    List<SchoolDocument> findByPurposeOrderBySubmissionDateDesc(String purpose);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE SchoolDocument d SET d.student = null WHERE d.student.id = :studentId")
    void disassociateStudent(@org.springframework.data.repository.query.Param("studentId") Long studentId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE SchoolDocument d SET d.schoolClass = null WHERE d.schoolClass.id = :classId")
    void disassociateClass(@org.springframework.data.repository.query.Param("classId") Long classId);
}

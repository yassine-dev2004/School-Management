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
}

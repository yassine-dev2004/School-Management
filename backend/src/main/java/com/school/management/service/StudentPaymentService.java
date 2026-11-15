package com.school.management.service;

import com.school.management.entity.SchoolClass;
import com.school.management.entity.Student;
import com.school.management.entity.StudentPayment;
import com.school.management.repository.SchoolClassRepository;
import com.school.management.repository.StudentPaymentRepository;
import com.school.management.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.SimpleDateFormat;
import java.util.*;

@Service
public class StudentPaymentService {

    @Autowired
    private StudentPaymentRepository studentPaymentRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private SchoolClassRepository schoolClassRepository;

    public static final List<String> ACADEMIC_MONTHS = Arrays.asList(
            "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر", "جانفي",
            "فيفري", "مارس", "أفريل", "ماي", "جوان"
    );

    private static final TimeZone TUNIS_TZ = TimeZone.getTimeZone("Africa/Tunis");

    public Date parseDateOnly(Date date) {
        if (date == null) {
            date = new Date();
        }
        try {
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
            sdf.setTimeZone(TUNIS_TZ);
            return sdf.parse(sdf.format(date));
        } catch (Exception e) {
            return date;
        }
    }

    public List<StudentPayment> getAll(Long studentId, Long classId, String academicYear, String status) {
        List<StudentPayment> list;
        if (studentId != null) {
            list = studentPaymentRepository.findByStudentId(studentId);
        } else if (classId != null) {
            list = studentPaymentRepository.findByClassId(classId);
        } else if (academicYear != null && !academicYear.trim().isEmpty()) {
            list = studentPaymentRepository.findByAcademicYear(academicYear);
        } else {
            list = studentPaymentRepository.findAll();
        }

        if (academicYear != null && !academicYear.trim().isEmpty() && (studentId != null || classId != null)) {
            list = list.stream().filter(p -> academicYear.equalsIgnoreCase(p.getAcademicYear())).toList();
        }
        if (status != null && !status.trim().isEmpty()) {
            list = list.stream().filter(p -> status.equalsIgnoreCase(p.getStatus())).toList();
        }
        return list;
    }

    public Optional<StudentPayment> getById(Long id) {
        return studentPaymentRepository.findById(id);
    }

    @Transactional
    public StudentPayment save(StudentPayment payment) {
        if (payment.getStudent() != null && payment.getStudent().getId() != null) {
            studentRepository.findById(payment.getStudent().getId()).ifPresent(payment::setStudent);
        }
        if (payment.getPaymentDate() == null) {
            payment.setPaymentDate(parseDateOnly(new Date()));
        } else {
            payment.setPaymentDate(parseDateOnly(payment.getPaymentDate()));
        }
        if (payment.getAcademicYear() == null || payment.getAcademicYear().trim().isEmpty()) {
            payment.setAcademicYear("2026-2027");
        }
        if (payment.getStatus() == null || payment.getStatus().trim().isEmpty()) {
            payment.setStatus("PAID");
        }
        return studentPaymentRepository.save(payment);
    }

    @Transactional
    public void delete(Long id) {
        studentPaymentRepository.deleteById(id);
    }

    public Map<String, Object> getStudentTuitionSummary(Long studentId, String academicYear) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found with ID: " + studentId));

        String year = (academicYear != null && !academicYear.trim().isEmpty()) ? academicYear : "2026-2027";
        SchoolClass sc = student.getSchoolClass();
        double annualFee = (sc != null && sc.getAnnualFee() != null) ? sc.getAnnualFee() : 1200.0;
        double monthlyEstimatedFee = Math.round((annualFee / ACADEMIC_MONTHS.size()) * 100.0) / 100.0;

        List<StudentPayment> payments = studentPaymentRepository.findByStudentIdAndAcademicYear(studentId, year);
        double totalPaid = payments.stream().mapToDouble(StudentPayment::getAmount).sum();
        double missingAmount = Math.max(0.0, Math.round((annualFee - totalPaid) * 100.0) / 100.0);

        String yearStatus;
        if (totalPaid >= annualFee) {
            yearStatus = "PAID"; // خالص
        } else if (totalPaid > 0) {
            yearStatus = "PARTIAL"; // دفع جزئي
        } else {
            yearStatus = "UNPAID"; // غير خالص
        }

        // Build monthly progress
        Map<String, Map<String, Object>> monthlyBreakdown = new LinkedHashMap<>();
        for (String m : ACADEMIC_MONTHS) {
            Optional<StudentPayment> match = payments.stream()
                    .filter(p -> m.equalsIgnoreCase(p.getMonth()))
                    .findFirst();

            Map<String, Object> mData = new HashMap<>();
            mData.put("month", m);
            mData.put("expectedFee", monthlyEstimatedFee);
            if (match.isPresent()) {
                StudentPayment p = match.get();
                mData.put("paidAmount", p.getAmount());
                mData.put("status", p.getStatus());
                mData.put("paymentDate", p.getPaymentDate());
                mData.put("paymentMethod", p.getPaymentMethod());
                mData.put("receiptNumber", p.getReceiptNumber());
                mData.put("paymentId", p.getId());
            } else {
                mData.put("paidAmount", 0.0);
                mData.put("status", "UNPAID");
                mData.put("paymentDate", null);
                mData.put("paymentMethod", null);
                mData.put("receiptNumber", null);
                mData.put("paymentId", null);
            }
            monthlyBreakdown.put(m, mData);
        }

        Map<String, Object> summary = new HashMap<>();
        summary.put("studentId", student.getId());
        summary.put("studentName", student.getUser() != null ? (student.getUser().getFirstName() + " " + student.getUser().getLastName()).trim() : "");
        summary.put("className", sc != null ? (sc.getName() + " " + (sc.getSection() != null ? sc.getSection() : "")).trim() : "غير محدد");
        summary.put("academicYear", year);
        summary.put("annualFee", annualFee);
        summary.put("totalPaid", Math.round(totalPaid * 100.0) / 100.0);
        summary.put("missingAmount", missingAmount);
        summary.put("yearStatus", yearStatus);
        summary.put("paymentsCount", payments.size());
        summary.put("monthlyBreakdown", monthlyBreakdown.values());
        summary.put("paymentsList", payments);
        return summary;
    }
}

package com.school.management.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "student_payments", indexes = {
        @Index(name = "idx_payment_student", columnList = "student_id"),
        @Index(name = "idx_payment_year", columnList = "academic_year"),
        @Index(name = "idx_payment_month", columnList = "month")
})
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class StudentPayment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "student_id", nullable = false)
    @JsonIgnoreProperties({"parent", "hibernateLazyInitializer", "handler"})
    private Student student;

    @Transient
    private Long studentId;

    @Column(name = "academic_year", nullable = false)
    private String academicYear = "2026-2027"; // السنة الدراسية

    @Column(nullable = false)
    private String month; // الشهر: سبتمبر، أكتوبر، نوفمبر، ديسمبر، جانفي، فيفري، مارس، أفريل، ماي، جوان

    @Column(nullable = false)
    private Double amount; // المبلغ المدفوع بالدينار التونسي TND

    @Temporal(TemporalType.DATE)
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd", timezone = "Africa/Tunis")
    private Date paymentDate;

    private String paymentMethod = "CASH"; // CASH (نقداً), CHEQUE (شيك), BANK_TRANSFER (تحويل بنكي)

    private String receiptNumber; // رقم الوصل أو المعاملة

    @Column(nullable = false)
    private String status = "PAID"; // PAID (خالص), PARTIAL (دفع جزئي), UNPAID (غير خالص)

    private String notes; // ملاحظات

    private String recordedBy; // المسؤول الذي استلم الدفع

    public StudentPayment() {}

    public StudentPayment(Long id, Student student, String academicYear, String month, Double amount, Date paymentDate, String paymentMethod, String receiptNumber, String status, String notes, String recordedBy) {
        this.id = id;
        this.student = student;
        this.academicYear = academicYear;
        this.month = month;
        this.amount = amount;
        this.paymentDate = paymentDate;
        this.paymentMethod = paymentMethod;
        this.receiptNumber = receiptNumber;
        this.status = status;
        this.notes = notes;
        this.recordedBy = recordedBy;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Student getStudent() {
        return student;
    }

    public void setStudent(Student student) {
        this.student = student;
    }

    public String getAcademicYear() {
        return academicYear;
    }

    public void setAcademicYear(String academicYear) {
        this.academicYear = academicYear;
    }

    public String getMonth() {
        return month;
    }

    public void setMonth(String month) {
        this.month = month;
    }

    public Double getAmount() {
        return amount != null ? amount : 0.0;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }

    public Date getPaymentDate() {
        return paymentDate;
    }

    public void setPaymentDate(Date paymentDate) {
        this.paymentDate = paymentDate;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getReceiptNumber() {
        return receiptNumber;
    }

    public void setReceiptNumber(String receiptNumber) {
        this.receiptNumber = receiptNumber;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getRecordedBy() {
        return recordedBy;
    }

    public void setRecordedBy(String recordedBy) {
        this.recordedBy = recordedBy;
    }

    public Long getStudentId() {
        return studentId != null ? studentId : (student != null ? student.getId() : null);
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }
}

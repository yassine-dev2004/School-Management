package com.school.management.service;

import com.school.management.entity.Teacher;
import com.school.management.entity.TeacherAttendance;
import com.school.management.repository.TeacherAttendanceRepository;
import com.school.management.repository.TeacherRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.SimpleDateFormat;
import java.util.*;

@Service
public class TeacherAttendanceService {

    @Autowired
    private TeacherAttendanceRepository teacherAttendanceRepository;

    @Autowired
    private TeacherRepository teacherRepository;

    private static final TimeZone TUNIS_TZ = TimeZone.getTimeZone("Africa/Tunis");

    public Date parseDateOnly(Date date) {
        if (date == null) {
            date = new Date();
        }
        try {
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
            sdf.setTimeZone(TUNIS_TZ);
            String formatted = sdf.format(date);
            return sdf.parse(formatted);
        } catch (Exception e) {
            return date;
        }
    }

    public String getCurrentTimeStr() {
        SimpleDateFormat sdf = new SimpleDateFormat("HH:mm:ss");
        sdf.setTimeZone(TUNIS_TZ);
        return sdf.format(new Date());
    }

    @Transactional
    public TeacherAttendance recordSelfCheckIn(Long teacherId, Date requestedDate, String status, String remarks) {
        Teacher teacher = teacherRepository.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("لم يتم العثور على ملف المعلم / Teacher record not found"));

        Date dateOnly = parseDateOnly(requestedDate != null ? requestedDate : new Date());
        String currentStatus = (status != null && !status.trim().isEmpty()) ? status.trim() : "حاضر";
        String timeStr = getCurrentTimeStr();

        Optional<TeacherAttendance> existingOpt = teacherAttendanceRepository.findByTeacherIdAndDate(teacherId, dateOnly);
        TeacherAttendance att;
        if (existingOpt.isPresent()) {
            att = existingOpt.get();
            att.setStatus(currentStatus);
            if (remarks != null && !remarks.trim().isEmpty()) {
                att.setRemarks(remarks.trim());
            }
            if (att.getCheckInTime() == null) {
                att.setCheckInTime(timeStr);
            }
        } else {
            att = new TeacherAttendance();
            att.setTeacher(teacher);
            att.setDate(dateOnly);
            att.setStatus(currentStatus);
            att.setCheckInTime(timeStr);
            att.setRemarks(remarks != null ? remarks.trim() : "تسجيل ذاتي بواسطة المعلم");
        }

        return teacherAttendanceRepository.save(att);
    }

    public Optional<TeacherAttendance> getTeacherTodayAttendance(Long teacherId) {
        Date today = parseDateOnly(new Date());
        return teacherAttendanceRepository.findByTeacherIdAndDate(teacherId, today);
    }

    public List<TeacherAttendance> getMyAttendance(Long teacherId) {
        return teacherAttendanceRepository.findByTeacherIdOrderByDateDesc(teacherId);
    }

    public List<TeacherAttendance> getAll() {
        return teacherAttendanceRepository.findAll();
    }

    public List<TeacherAttendance> getByDate(Date date) {
        Date dateOnly = parseDateOnly(date);
        return teacherAttendanceRepository.findByDate(dateOnly);
    }

    @Transactional
    public TeacherAttendance save(TeacherAttendance attendance) {
        if (attendance.getDate() != null) {
            attendance.setDate(parseDateOnly(attendance.getDate()));
        } else {
            attendance.setDate(parseDateOnly(new Date()));
        }
        if (attendance.getCheckInTime() == null) {
            attendance.setCheckInTime(getCurrentTimeStr());
        }
        return teacherAttendanceRepository.save(attendance);
    }

    @Transactional
    public void delete(Long id) {
        teacherAttendanceRepository.deleteById(id);
    }
}

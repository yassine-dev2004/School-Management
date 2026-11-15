package com.school.management.service;

import com.school.management.entity.DailyLessonLog;
import com.school.management.repository.DailyLessonLogRepository;
import com.school.management.repository.SchoolClassRepository;
import com.school.management.repository.SubjectRepository;
import com.school.management.repository.TeacherRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.SimpleDateFormat;
import java.util.*;

@Service
public class DailyLessonLogService {

    @Autowired
    private DailyLessonLogRepository dailyLessonLogRepository;

    @Autowired
    private SchoolClassRepository schoolClassRepository;

    @Autowired
    private SubjectRepository subjectRepository;

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
            return sdf.parse(sdf.format(date));
        } catch (Exception e) {
            return date;
        }
    }

    public List<DailyLessonLog> getAll(Long classId, Date date) {
        if (classId != null && date != null) {
            return dailyLessonLogRepository.findBySchoolClassIdAndDateOrderByPeriodAsc(classId, parseDateOnly(date));
        } else if (classId != null) {
            return dailyLessonLogRepository.findBySchoolClassIdOrderByDateDesc(classId);
        } else if (date != null) {
            return dailyLessonLogRepository.findByDateOrderByDateDesc(parseDateOnly(date));
        }
        return dailyLessonLogRepository.findAll();
    }

    public List<DailyLessonLog> getRecentForClass(Long classId) {
        return dailyLessonLogRepository.findTop20BySchoolClassIdOrderByDateDesc(classId);
    }

    public Optional<DailyLessonLog> getById(Long id) {
        return dailyLessonLogRepository.findById(id);
    }

    @Transactional
    public DailyLessonLog save(DailyLessonLog log) {
        if (log.getSchoolClass() != null && log.getSchoolClass().getId() != null) {
            schoolClassRepository.findById(log.getSchoolClass().getId()).ifPresent(log::setSchoolClass);
        }
        if (log.getSubject() != null && log.getSubject().getId() != null) {
            subjectRepository.findById(log.getSubject().getId()).ifPresent(log::setSubject);
        }
        if (log.getTeacher() != null && log.getTeacher().getId() != null) {
            teacherRepository.findById(log.getTeacher().getId()).ifPresent(log::setTeacher);
        }
        if (log.getDate() != null) {
            log.setDate(parseDateOnly(log.getDate()));
        } else {
            log.setDate(parseDateOnly(new Date()));
        }
        return dailyLessonLogRepository.save(log);
    }

    @Transactional
    public void delete(Long id) {
        dailyLessonLogRepository.deleteById(id);
    }
}

import { useState, useEffect } from 'react';
import { Users, GraduationCap, School, BookOpen, TrendingUp, Calendar, UserCheck, AlertCircle, FileText } from 'lucide-react';
import api from '../api/axios';
import './Dashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ 
    students: 0, 
    teachers: 0, 
    classes: 0, 
    subjects: 0,
    attendanceRate: 0,
    homeworkCount: 0,
    parentsCount: 0
  });
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllDashboardData();
  }, []);

  const loadAllDashboardData = async () => {
    setLoading(true);
    const todayStr = new Date().toISOString().split('T')[0];

    try {
      const [
        studentsRes, 
        teachersRes, 
        classesRes, 
        subjectsRes, 
        announcementsRes,
        attendanceRes,
        homeworkRes,
        parentsRes
      ] = await Promise.all([
        api.get('/students').catch(() => ({ data: [] })),
        api.get('/teachers').catch(() => ({ data: [] })),
        api.get('/classes').catch(() => ({ data: [] })),
        api.get('/subjects').catch(() => ({ data: [] })),
        api.get('/announcements').catch(() => ({ data: [] })),
        api.get(`/attendance/date/${todayStr}`).catch(() => ({ data: [] })),
        api.get('/homework').catch(() => ({ data: [] })),
        api.get('/parents').catch(() => ({ data: [] })),
      ]);

      const studentsList = Array.isArray(studentsRes.data) ? studentsRes.data : [];
      const teachersList = Array.isArray(teachersRes.data) ? teachersRes.data : [];
      const classesList = Array.isArray(classesRes.data) ? classesRes.data : [];
      const subjectsList = Array.isArray(subjectsRes.data) ? subjectsRes.data : [];
      const announcementsList = Array.isArray(announcementsRes.data) ? announcementsRes.data : [];
      const attendanceList = Array.isArray(attendanceRes.data) ? attendanceRes.data : [];
      const homeworkList = Array.isArray(homeworkRes.data) ? homeworkRes.data : [];
      const parentsList = Array.isArray(parentsRes.data) ? parentsRes.data : [];

      // Compute attendance rate for today
      let attendancePercentage = 0;
      if (attendanceList.length > 0) {
        const presentCount = attendanceList.filter(a => a.status === 'حاضر' || a.status === 'Present').length;
        attendancePercentage = Math.round((presentCount / attendanceList.length) * 100);
      }

      setStats({
        students: studentsList.length,
        teachers: teachersList.length,
        classes: classesList.length,
        subjects: subjectsList.length,
        attendanceRate: attendancePercentage,
        homeworkCount: homeworkList.length,
        parentsCount: parentsList.length
      });

      setAnnouncements(announcementsList.slice(0, 5));
    } catch (err) {
      console.error("Dashboard error:", err);
      setStats({
        students: 0,
        teachers: 0,
        classes: 0,
        subjects: 0,
        attendanceRate: 0,
        homeworkCount: 0,
        parentsCount: 0
      });
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { icon: Users, label: 'إجمالي الطلاب', value: stats.students, gradient: 'linear-gradient(135deg, #6366f1, #818cf8)' },
    { icon: GraduationCap, label: 'إجمالي المعلمين', value: stats.teachers, gradient: 'linear-gradient(135deg, #10b981, #34d399)' },
    { icon: School, label: 'الفصول النشطة', value: stats.classes, gradient: 'linear-gradient(135deg, #06b6d4, #22d3ee)' },
    { icon: BookOpen, label: 'المواد الدراسية', value: stats.subjects, gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)' },
  ];

  return (
    <div className="admin-dashboard animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">لوحة التحكم</h1>
        <div className="header-date">
          <Calendar size={16} />
          <span>{new Date().toLocaleDateString('ar-EG-u-nu-latn', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="spinner"></div>
        </div>
      ) : (
        <>
          <div className="stats-grid">
            {statCards.map((card, i) => (
              <div key={i} className="stat-card glass-panel" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="stat-icon-wrap" style={{ background: card.gradient }}>
                  <card.icon size={24} color="#fff" />
                </div>
                <div className="stat-info">
                  <span className="stat-label">{card.label}</span>
                  <span className="stat-number notranslate" translate="no">{card.value}</span>
                </div>
                <div className="stat-trend">
                  <TrendingUp size={16} />
                </div>
              </div>
            ))}
          </div>

          <div className="dashboard-grid">
            <div className="dash-section glass-panel">
              <div className="section-header">
                <h2>آخر الإعلانات</h2>
                <span className="badge badge-primary notranslate" translate="no">{announcements.length}</span>
              </div>
              <div className="announcements-list">
                {announcements.map((a) => (
                  <div key={a.id} className="announcement-item">
                    <div className="announcement-icon">
                      <AlertCircle size={18} />
                    </div>
                    <div className="announcement-content">
                      <h4>{a.title}</h4>
                      <p>{a.content}</p>
                    </div>
                  </div>
                ))}
                {announcements.length === 0 && (
                  <div className="empty-state">
                    <p>لا توجد إعلانات حالياً</p>
                  </div>
                )}
              </div>
            </div>

            <div className="dash-section glass-panel">
              <div className="section-header">
                <h2>نظرة سريعة (بيانات حقيقية)</h2>
              </div>
              <div className="quick-stats">
                <div className="quick-stat-item">
                  <UserCheck size={20} color="var(--success)" />
                  <div>
                    <span className="qs-label">نسبة الحضور اليوم</span>
                    <span className="qs-value notranslate" translate="no">{stats.attendanceRate}%</span>
                  </div>
                </div>
                <div className="quick-stat-item">
                  <FileText size={20} color="var(--primary)" />
                  <div>
                    <span className="qs-label">الواجبات النشطة</span>
                    <span className="qs-value notranslate" translate="no">{stats.homeworkCount}</span>
                  </div>
                </div>
                <div className="quick-stat-item">
                  <Users size={20} color="var(--accent)" />
                  <div>
                    <span className="qs-label">عدد أولياء الأمور</span>
                    <span className="qs-value notranslate" translate="no">{stats.parentsCount}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;

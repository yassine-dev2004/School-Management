import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, GraduationCap, School, BookOpen, TrendingUp, Calendar, UserCheck, AlertCircle, FileText, PlusCircle, ArrowLeft } from 'lucide-react';
import api from '../api/axios';
import './Dashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
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
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { icon: Users, label: 'إجمالي الطلاب', value: stats.students, link: '/admin/students', gradient: 'linear-gradient(135deg, #6366f1, #818cf8)' },
    { icon: GraduationCap, label: 'إجمالي المعلمين', value: stats.teachers, link: '/admin/teachers', gradient: 'linear-gradient(135deg, #10b981, #34d399)' },
    { icon: School, label: 'الفصول النشطة', value: stats.classes, link: '/admin/classes', gradient: 'linear-gradient(135deg, #06b6d4, #22d3ee)' },
    { icon: BookOpen, label: 'المواد الدراسية', value: stats.subjects, link: '/admin/subjects', gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)' },
  ];

  return (
    <div className="admin-dashboard animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">لوحة التحكم الرئيسية</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '4px 0 0 0' }}>مرحباً بك في نظام إدارة المدرسة - المتابعة المباشرة والبيانات الحقيقية</p>
        </div>
        <div className="header-date glass-panel" style={{ padding: '8px 16px', borderRadius: 'var(--radius-full)' }}>
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
          {/* Main Stat Cards */}
          <div className="stats-grid">
            {statCards.map((card, i) => (
              <div 
                key={i} 
                className="stat-card glass-panel" 
                style={{ animationDelay: `${i * 80}ms`, cursor: 'pointer' }}
                onClick={() => navigate(card.link)}
              >
                <div className="stat-icon-wrap" style={{ background: card.gradient }}>
                  <card.icon size={24} color="#fff" />
                </div>
                <div className="stat-info">
                  <span className="stat-label">{card.label}</span>
                  <span className="stat-number notranslate" translate="no">{card.value}</span>
                </div>
                <div className="stat-trend" style={{ color: 'var(--primary)' }}>
                  <ArrowLeft size={16} />
                </div>
              </div>
            ))}
          </div>

          {/* Quick Action Shortcuts */}
          <div className="glass-panel" style={{ padding: 'var(--spacing-lg)', marginBottom: 'var(--spacing-xl)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 'var(--spacing-md)' }}>إجراءات سريعة</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
              <button className="btn btn-ghost" style={{ justifyContent: 'flex-start', padding: '12px' }} onClick={() => navigate('/admin/students')}>
                <PlusCircle size={18} color="var(--primary)" /> إضافة طالب جديد
              </button>
              <button className="btn btn-ghost" style={{ justifyContent: 'flex-start', padding: '12px' }} onClick={() => navigate('/admin/attendance')}>
                <UserCheck size={18} color="var(--success)" /> تسجيل الحضور اليومي
              </button>
              <button className="btn btn-ghost" style={{ justifyContent: 'flex-start', padding: '12px' }} onClick={() => navigate('/admin/grades')}>
                <FileText size={18} color="#f59e0b" /> رصد درجات الطلاب
              </button>
              <button className="btn btn-ghost" style={{ justifyContent: 'flex-start', padding: '12px' }} onClick={() => navigate('/admin/announcements')}>
                <AlertCircle size={18} color="var(--accent)" /> نشر إعلان جديد
              </button>
            </div>
          </div>

          <div className="dashboard-grid">
            {/* Announcements Panel */}
            <div className="dash-section glass-panel">
              <div className="section-header">
                <h2>آخر الإعلانات</h2>
                <span className="badge badge-primary notranslate" translate="no">{announcements.length}</span>
              </div>
              <div className="announcements-list">
                {announcements.map((a) => (
                  <div key={a.id} className="announcement-item">
                    <div className="announcement-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                      <AlertCircle size={18} />
                    </div>
                    <div className="announcement-content">
                      <h4>{a.title}</h4>
                      <p>{a.content}</p>
                      {a.createdDate && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(a.createdDate).toLocaleDateString('ar-EG-u-nu-latn')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {announcements.length === 0 && (
                  <div className="empty-state">
                    <AlertCircle size={36} color="var(--text-muted)" />
                    <p>لا توجد إعلانات حالياً</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Metrics Panel */}
            <div className="dash-section glass-panel">
              <div className="section-header">
                <h2>مؤشرات الأداء اليومية</h2>
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
                    <span className="qs-label">الواجبات المدرسية النشطة</span>
                    <span className="qs-value notranslate" translate="no">{stats.homeworkCount}</span>
                  </div>
                </div>
                <div className="quick-stat-item">
                  <Users size={20} color="var(--accent)" />
                  <div>
                    <span className="qs-label">أولياء الأمور المسجلين</span>
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

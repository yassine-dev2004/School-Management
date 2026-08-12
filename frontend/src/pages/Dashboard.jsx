import { useState, useEffect } from 'react';
import { Users, GraduationCap, School, BookOpen, TrendingUp, Calendar, UserCheck, AlertCircle } from 'lucide-react';
import api from '../api/axios';
import './Dashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ students: 0, teachers: 0, classes: 0, subjects: 0 });
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    loadStats();
    loadAnnouncements();
  }, []);

  const loadStats = async () => {
    try {
      const [students, teachers, classes, subjects] = await Promise.all([
        api.get('/students').catch(() => ({ data: [] })),
        api.get('/teachers').catch(() => ({ data: [] })),
        api.get('/classes').catch(() => ({ data: [] })),
        api.get('/subjects').catch(() => ({ data: [] })),
      ]);
      setStats({
        students: students.data.length,
        teachers: teachers.data.length,
        classes: classes.data.length,
        subjects: subjects.data.length,
      });
    } catch (err) {
      // Use demo data if backend is not available
      setStats({ students: 248, teachers: 32, classes: 12, subjects: 18 });
    }
  };

  const loadAnnouncements = async () => {
    try {
      const res = await api.get('/announcements');
      setAnnouncements(res.data.slice(0, 5));
    } catch {
      setAnnouncements([
        { id: 1, title: 'بداية الفصل الدراسي الثاني', content: 'يسعدنا إبلاغكم ببدء الفصل الدراسي الثاني يوم الأحد القادم', datePosted: new Date().toISOString() },
        { id: 2, title: 'اجتماع أولياء الأمور', content: 'سيتم عقد اجتماع أولياء الأمور يوم الثلاثاء الساعة 4 مساءً', datePosted: new Date().toISOString() },
      ]);
    }
  };

  const statCards = [
    { icon: Users, label: 'إجمالي الطلاب', value: stats.students, color: 'primary', gradient: 'linear-gradient(135deg, #6366f1, #818cf8)' },
    { icon: GraduationCap, label: 'إجمالي المعلمين', value: stats.teachers, color: 'success', gradient: 'linear-gradient(135deg, #10b981, #34d399)' },
    { icon: School, label: 'الفصول النشطة', value: stats.classes, color: 'accent', gradient: 'linear-gradient(135deg, #06b6d4, #22d3ee)' },
    { icon: BookOpen, label: 'المواد الدراسية', value: stats.subjects, color: 'warning', gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)' },
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

      <div className="stats-grid">
        {statCards.map((card, i) => (
          <div key={i} className="stat-card glass-panel" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="stat-icon-wrap" style={{ background: card.gradient }}>
              <card.icon size={24} color="#fff" />
            </div>
            <div className="stat-info">
              <span className="stat-label">{card.label}</span>
              <span className="stat-number">{card.value}</span>
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
            <span className="badge badge-primary">{announcements.length}</span>
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
            <h2>نظرة سريعة</h2>
          </div>
          <div className="quick-stats">
            <div className="quick-stat-item">
              <UserCheck size={20} color="var(--success)" />
              <div>
                <span className="qs-label">نسبة الحضور اليوم</span>
                <span className="qs-value">92%</span>
              </div>
            </div>
            <div className="quick-stat-item">
              <BookOpen size={20} color="var(--primary)" />
              <div>
                <span className="qs-label">الواجبات النشطة</span>
                <span className="qs-value">15</span>
              </div>
            </div>
            <div className="quick-stat-item">
              <Users size={20} color="var(--accent)" />
              <div>
                <span className="qs-label">طلاب جدد هذا الشهر</span>
                <span className="qs-value">8</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

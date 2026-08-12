import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Users, ClipboardList, UserCheck, Calendar, TrendingUp, BookOpen, AlertCircle } from 'lucide-react';
import api from '../../api/axios';
import '../Dashboard.css';

const ParentDashboard = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get('/parents/my-dashboard');
      setDashboard(res.data);
    } catch {
      setDashboard({
        children: [],
        totalChildren: 0,
        averageScore: 0,
        totalPresent: 0,
        totalAbsent: 0,
        totalAttendanceRecords: 0,
        attendanceRate: 0
      });
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="admin-dashboard animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  const statCards = [
    { icon: Users, label: 'عدد الأبناء', value: dashboard?.totalChildren || 0, gradient: 'linear-gradient(135deg, #6366f1, #818cf8)' },
    { icon: TrendingUp, label: 'متوسط الدرجات', value: dashboard?.averageScore || 0, gradient: 'linear-gradient(135deg, #10b981, #34d399)' },
    { icon: UserCheck, label: 'نسبة الحضور', value: `${dashboard?.attendanceRate || 0}%`, gradient: 'linear-gradient(135deg, #06b6d4, #22d3ee)' },
    { icon: AlertCircle, label: 'أيام الغياب', value: dashboard?.totalAbsent || 0, gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)' },
  ];

  return (
    <div className="admin-dashboard animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">مرحباً {user?.username || 'ولي الأمر'} 👋</h1>
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
            <h2>أبنائي</h2>
            <span className="badge badge-primary">{dashboard?.totalChildren || 0}</span>
          </div>
          <div className="announcements-list">
            {dashboard?.children?.map(child => (
              <div key={child.id} className="announcement-item">
                <div className="announcement-icon" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
                  <Users size={18} />
                </div>
                <div className="announcement-content">
                  <h4>{child.firstName} {child.lastName}</h4>
                  <p>
                    {child.schoolClass ? `${child.schoolClass.name} - ${child.schoolClass.section}` : 'غير محدد'}
                    {' | '}الحالة: {child.status || 'نشط'}
                    {' | '}الدرجات: {child.grades?.length || 0}
                    {' | '}سجلات الحضور: {child.attendance?.length || 0}
                  </p>
                </div>
              </div>
            ))}
            {(!dashboard?.children || dashboard.children.length === 0) && (
              <div className="empty-state"><p>لا يوجد أبناء مسجلين</p></div>
            )}
          </div>
        </div>

        <div className="dash-section glass-panel">
          <div className="section-header">
            <h2>آخر الدرجات</h2>
          </div>
          <div className="announcements-list">
            {dashboard?.children?.flatMap(child =>
              (child.grades || []).slice(0, 3).map(g => ({
                ...g,
                childName: `${child.firstName} ${child.lastName}`
              }))
            ).slice(0, 5).map((g, i) => (
              <div key={i} className="announcement-item">
                <div className="announcement-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                  <ClipboardList size={18} />
                </div>
                <div className="announcement-content">
                  <h4>{g.childName} — {g.subjectName}</h4>
                  <p>{g.examType} | الدرجة: <strong style={{ color: g.score >= 70 ? 'var(--success)' : 'var(--danger)' }}>{g.score}</strong> | {g.comments || '—'}</p>
                </div>
              </div>
            ))}
            {dashboard?.children?.every(c => !c.grades?.length) && (
              <div className="empty-state"><p>لا توجد درجات حالياً</p></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;

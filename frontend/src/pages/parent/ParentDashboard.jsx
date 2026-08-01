import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Users, ClipboardList, UserCheck, Megaphone, Calendar } from 'lucide-react';
import api from '../../api/axios';
import '../Dashboard.css';

const ParentDashboard = () => {
  const { user } = useAuth();
  const [children, setChildren] = useState([]);

  useEffect(() => {
    loadChildren();
  }, []);

  const loadChildren = async () => {
    try {
      const res = await api.get(`/parents/${user.id}/children`);
      setChildren(res.data);
    } catch {
      setChildren([
        { id: 1, user: { firstName: 'أحمد', lastName: 'خالد' }, schoolClass: { name: 'الصف الأول', section: 'أ' }, status: 'نشط' },
        { id: 2, user: { firstName: 'سارة', lastName: 'خالد' }, schoolClass: { name: 'الصف الثالث', section: 'ب' }, status: 'نشط' },
      ]);
    }
  };

  return (
    <div className="admin-dashboard animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">مرحباً {user?.username || 'ولي الأمر'} 👋</h1>
        <div className="header-date">
          <Calendar size={16} />
          <span>{new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card glass-panel">
          <div className="stat-icon-wrap" style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)' }}>
            <Users size={24} color="#fff" />
          </div>
          <div className="stat-info">
            <span className="stat-label">عدد الأبناء</span>
            <span className="stat-number">{children.length}</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dash-section glass-panel">
          <div className="section-header">
            <h2>أبنائي</h2>
          </div>
          <div className="announcements-list">
            {children.map(child => (
              <div key={child.id} className="announcement-item">
                <div className="announcement-icon" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
                  <Users size={18} />
                </div>
                <div className="announcement-content">
                  <h4>{child.user?.firstName} {child.user?.lastName}</h4>
                  <p>{child.schoolClass ? `${child.schoolClass.name} - ${child.schoolClass.section}` : 'غير محدد'} | الحالة: {child.status || 'نشط'}</p>
                </div>
              </div>
            ))}
            {children.length === 0 && <div className="empty-state"><p>لا يوجد أبناء مسجلين</p></div>}
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
                <span className="qs-label">حضور اليوم</span>
                <span className="qs-value">حاضرون</span>
              </div>
            </div>
            <div className="quick-stat-item">
              <ClipboardList size={20} color="var(--primary)" />
              <div>
                <span className="qs-label">واجبات معلقة</span>
                <span className="qs-value">٣</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;

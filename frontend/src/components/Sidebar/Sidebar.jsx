import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, GraduationCap, BookOpen,
  ClipboardList, FileText, Megaphone, Settings, LogOut,
  School, UserCheck, Baby, X
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ collapsed, mobileOpen, onCloseMobile }) => {
  const { user, logout, isAdmin, isTeacher } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    onCloseMobile?.();
    logout();
    navigate('/login');
  };

  const adminSections = [
    {
      title: 'الرئيسية',
      items: [
        { to: '/admin/dashboard', icon: LayoutDashboard, label: 'لوحة التحكم' },
      ],
    },
    {
      title: 'الإدارة الأكاديمية',
      items: [
        { to: '/admin/students', icon: Users, label: 'إدارة الطلاب' },
        { to: '/admin/teachers', icon: GraduationCap, label: 'إدارة المعلمين' },
        { to: '/admin/parents', icon: Baby, label: 'أولياء الأمور' },
        { to: '/admin/classes', icon: School, label: 'الفصول الدراسية' },
        { to: '/admin/subjects', icon: BookOpen, label: 'المواد الدراسية' },
      ],
    },
    {
      title: 'المتابعة والتقييم',
      items: [
        { to: '/admin/attendance', icon: UserCheck, label: 'الحضور والغياب' },
        { to: '/admin/grades', icon: ClipboardList, label: 'الدرجات' },
        { to: '/admin/homework', icon: FileText, label: 'الواجبات' },
        { to: '/admin/announcements', icon: Megaphone, label: 'الإعلانات' },
      ],
    },
    {
      title: 'النظام',
      items: [
        { to: '/admin/settings', icon: Settings, label: 'الإعدادات' },
      ],
    },
  ];

  const parentSections = [
    {
      title: 'بوابة ولي الأمر',
      items: [
        { to: '/parent/dashboard', icon: LayoutDashboard, label: 'لوحة التحكم' },
        { to: '/parent/children', icon: Baby, label: 'أبنائي' },
        { to: '/parent/announcements', icon: Megaphone, label: 'الإعلانات' },
      ],
    },
  ];

  const sections = (isAdmin() || isTeacher()) ? adminSections : parentSections;

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-brand">
        <div className="brand-main">
          <div className="brand-icon">
            <School size={collapsed && !mobileOpen ? 22 : 24} />
          </div>
          {(!collapsed || mobileOpen) && (
            <div className="brand-copy">
              <span className="brand-text">مدرستي ERP</span>
              <span className="brand-sub">نظام إدارة المدرسة</span>
            </div>
          )}
        </div>
        <button
          type="button"
          className="btn-icon sidebar-close-btn"
          onClick={onCloseMobile}
          aria-label="إغلاق القائمة"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {sections.map((section) => (
          <div key={section.title} className="sidebar-section">
            {(!collapsed || mobileOpen) && (
              <div className="sidebar-section-title">{section.title}</div>
            )}
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => onCloseMobile?.()}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                title={collapsed && !mobileOpen ? item.label : ''}
              >
                <span className="sidebar-link-icon">
                  <item.icon size={19} />
                </span>
                {(!collapsed || mobileOpen) && <span className="sidebar-link-label">{item.label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        {(!collapsed || mobileOpen) && (
          <div className="sidebar-user">
            <div className="user-avatar-sm">
              {user?.username?.charAt(0)?.toUpperCase() || 'م'}
            </div>
            <div className="user-info-sm">
              <span className="user-name-sm">{user?.username || 'مدير'}</span>
              <span className="user-role-sm">
                {isAdmin() ? 'مدير النظام' : isTeacher() ? 'معلم' : 'ولي أمر'}
              </span>
            </div>
          </div>
        )}
        <button
          type="button"
          className="sidebar-link logout-link"
          onClick={handleLogout}
          title={collapsed && !mobileOpen ? 'تسجيل الخروج' : ''}
        >
          <span className="sidebar-link-icon">
            <LogOut size={19} />
          </span>
          {(!collapsed || mobileOpen) && <span className="sidebar-link-label">تسجيل الخروج</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, Calendar,
  ClipboardList, FileText, Megaphone, Settings, LogOut, Menu,
  ChevronRight, School, UserCheck, Baby
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ collapsed, onToggle }) => {
  const { user, logout, isAdmin, isTeacher } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const adminNav = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'لوحة التحكم' },
    { to: '/admin/students', icon: Users, label: 'إدارة الطلاب' },
    { to: '/admin/teachers', icon: GraduationCap, label: 'إدارة المعلمين' },
    { to: '/admin/parents', icon: Baby, label: 'أولياء الأمور' },
    { to: '/admin/classes', icon: School, label: 'الفصول الدراسية' },
    { to: '/admin/subjects', icon: BookOpen, label: 'المواد الدراسية' },
    { to: '/admin/attendance', icon: UserCheck, label: 'الحضور والغياب' },
    { to: '/admin/grades', icon: ClipboardList, label: 'الدرجات' },
    { to: '/admin/homework', icon: FileText, label: 'الواجبات' },
    { to: '/admin/announcements', icon: Megaphone, label: 'الإعلانات' },
    { to: '/admin/settings', icon: Settings, label: 'الإعدادات' },
  ];

  const parentNav = [
    { to: '/parent/dashboard', icon: LayoutDashboard, label: 'لوحة التحكم' },
    { to: '/parent/children', icon: Baby, label: 'أبنائي' },
    { to: '/parent/announcements', icon: Megaphone, label: 'الإعلانات' },
  ];

  const navItems = (isAdmin() || isTeacher()) ? adminNav : parentNav;

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-brand">
        <div className="brand-icon">
          <School size={collapsed ? 24 : 28} />
        </div>
        {!collapsed && <span className="brand-text">نظام إدارة المدرسة</span>}
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            title={collapsed ? item.label : ''}
          >
            <item.icon size={20} />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        {!collapsed && (
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
        <button className="sidebar-link logout-link" onClick={handleLogout}>
          <LogOut size={20} />
          {!collapsed && <span>تسجيل الخروج</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

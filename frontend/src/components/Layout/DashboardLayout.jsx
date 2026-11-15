import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import {
  Menu, Bell, School, LayoutDashboard, Users,
  UserCheck, ClipboardList, Baby, Megaphone, LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './DashboardLayout.css';

const DashboardLayout = () => {
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout, isAdmin, isTeacher } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    setMobileOpen(false);
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && mobileOpen) {
        setMobileOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileOpen) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileOpen]);

  const handleToggleMenu = () => {
    if (window.innerWidth <= 768) {
      setMobileOpen((prev) => !prev);
    } else {
      setDesktopCollapsed((prev) => !prev);
    }
  };

  const isStaff = isAdmin() || isTeacher();

  const mobileQuickTabs = isStaff
    ? [
        { to: '/admin/dashboard', icon: LayoutDashboard, label: 'الرئيسية' },
        { to: '/admin/students', icon: Users, label: 'الطلاب' },
        { to: '/admin/attendance', icon: UserCheck, label: 'الحضور' },
        { to: '/admin/grades', icon: ClipboardList, label: 'الدرجات' },
      ]
    : [
        { to: '/parent/dashboard', icon: LayoutDashboard, label: 'الرئيسية' },
        { to: '/parent/children', icon: Baby, label: 'أبنائي' },
        { to: '/parent/announcements', icon: Megaphone, label: 'الإعلانات' },
      ];

  return (
    <div className="dashboard-layout">
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar
        collapsed={desktopCollapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className={`main-area ${desktopCollapsed ? 'expanded' : ''}`}>
        <header className="top-bar">
          <div className="top-bar-right">
            <button
              type="button"
              className="btn-icon menu-toggle-btn"
              onClick={handleToggleMenu}
              aria-label="تبديل القائمة"
            >
              <Menu size={22} />
            </button>
            <div className="mobile-top-brand">
              <span className="mobile-brand-dot">
                <School size={16} />
              </span>
              <span className="mobile-brand-name">مدرسة ابن خلدون</span>
            </div>
          </div>

          <div className="top-bar-left">
            <button type="button" className="btn-icon notification-btn" aria-label="الإشعارات">
              <Bell size={20} />
              <span className="notification-dot"></span>
            </button>
            <div
              className="top-bar-user"
              onClick={() => isStaff && navigate('/admin/settings')}
              title={isStaff ? 'الإعدادات' : ''}
            >
              <div className="top-bar-avatar">
                {user?.username?.charAt(0)?.toUpperCase() || 'م'}
              </div>
              <div className="top-bar-user-info">
                <span className="top-bar-name">{user?.username || 'مدير'}</span>
                <span className="top-bar-role">
                  {isAdmin() ? 'مدير النظام' : isTeacher() ? 'معلم' : 'ولي أمر'}
                </span>
              </div>
            </div>
            <button
              type="button"
              className="top-bar-logout-btn"
              onClick={handleLogout}
              title="تسجيل الخروج"
              aria-label="تسجيل الخروج"
            >
              <LogOut size={17} />
              <span className="top-bar-logout-text">خروج</span>
            </button>
          </div>
        </header>

        <main className="content-area">
          <Outlet />
        </main>
      </div>

      {/* Quick Bottom Navigation for Mobile Devices */}
      <nav className="mobile-bottom-nav" aria-label="التنقل السريع">
        {mobileQuickTabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) => `mobile-bottom-link ${isActive ? 'active' : ''}`}
          >
            <tab.icon size={20} />
            <span>{tab.label}</span>
          </NavLink>
        ))}
        <button
          type="button"
          className={`mobile-bottom-link ${mobileOpen ? 'active' : ''}`}
          onClick={() => setMobileOpen(true)}
        >
          <Menu size={20} />
          <span>القائمة</span>
        </button>
      </nav>
    </div>
  );
};

export default DashboardLayout;

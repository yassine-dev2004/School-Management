import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import { Menu, Bell, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './DashboardLayout.css';

const DashboardLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, isAdmin, isTeacher } = useAuth();

  return (
    <div className="dashboard-layout">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <div className={`main-area ${sidebarCollapsed ? 'expanded' : ''}`}>
        <header className="top-bar">
          <div className="top-bar-right">
            <button className="btn-icon" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
              <Menu size={22} />
            </button>
          </div>

          <div className="top-bar-left">
            <button className="btn-icon notification-btn">
              <Bell size={20} />
              <span className="notification-dot"></span>
            </button>
            <div className="top-bar-user">
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
          </div>
        </header>

        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

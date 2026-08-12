import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './components/Layout/DashboardLayout';
import Login from './pages/Login';
import AdminDashboard from './pages/Dashboard';
import StudentsPage from './pages/admin/StudentsPage';
import TeachersPage from './pages/admin/TeachersPage';
import ParentsPage from './pages/admin/ParentsPage';
import ClassesPage from './pages/admin/ClassesPage';
import SubjectsPage from './pages/admin/SubjectsPage';
import AttendancePage from './pages/admin/AttendancePage';
import GradesPage from './pages/admin/GradesPage';
import HomeworkPage from './pages/admin/HomeworkPage';
import AnnouncementsPage from './pages/admin/AnnouncementsPage';
import SettingsPage from './pages/admin/SettingsPage';
import ParentDashboard from './pages/parent/ParentDashboard';
import ChildrenPage from './pages/parent/ChildrenPage';
import ParentAnnouncementsPage from './pages/parent/ParentAnnouncementsPage';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={user.roles?.includes('ADMINISTRATOR') || user.roles?.includes('TEACHER') ? '/admin/dashboard' : '/parent/dashboard'} /> : <Login />} />

      {/* Admin / Teacher Routes */}
      <Route path="/admin" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="teachers" element={<TeachersPage />} />
        <Route path="parents" element={<ParentsPage />} />
        <Route path="classes" element={<ClassesPage />} />
        <Route path="subjects" element={<SubjectsPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="grades" element={<GradesPage />} />
        <Route path="homework" element={<HomeworkPage />} />
        <Route path="announcements" element={<AnnouncementsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Parent Routes */}
      <Route path="/parent" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={<ParentDashboard />} />
        <Route path="children" element={<ChildrenPage />} />
        <Route path="announcements" element={<ParentAnnouncementsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
};

import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
          <AppRoutes />
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

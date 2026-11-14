import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ToastContainer from './components/ToastContainer';
import ConfirmModal from './components/ConfirmModal';
import ServerStatusNotice from './components/ServerStatusNotice';
import DashboardLayout from './components/Layout/DashboardLayout';
import ErrorBoundary from './components/ErrorBoundary';
import { startKeepAlive } from './api/axios';

const Login = lazy(() => import('./pages/Login'));
const AdminDashboard = lazy(() => import('./pages/Dashboard'));
const StudentsPage = lazy(() => import('./pages/admin/StudentsPage'));
const TeachersPage = lazy(() => import('./pages/admin/TeachersPage'));
const ParentsPage = lazy(() => import('./pages/admin/ParentsPage'));
const ClassesPage = lazy(() => import('./pages/admin/ClassesPage'));
const SubjectsPage = lazy(() => import('./pages/admin/SubjectsPage'));
const AttendancePage = lazy(() => import('./pages/admin/AttendancePage'));
const TeacherAttendancePage = lazy(() => import('./pages/admin/TeacherAttendancePage'));
const GradesPage = lazy(() => import('./pages/admin/GradesPage'));
const HomeworkPage = lazy(() => import('./pages/admin/HomeworkPage'));
const AnnouncementsPage = lazy(() => import('./pages/admin/AnnouncementsPage'));
const SettingsPage = lazy(() => import('./pages/admin/SettingsPage'));
const ParentDashboard = lazy(() => import('./pages/parent/ParentDashboard'));
const ChildrenPage = lazy(() => import('./pages/parent/ChildrenPage'));
const ParentAnnouncementsPage = lazy(() => import('./pages/parent/ParentAnnouncementsPage'));

const RouteLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '45vh' }}>
    <div className="spinner"></div>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Suspense fallback={<RouteLoader />}>
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
          <Route path="teacher-attendance" element={<TeacherAttendancePage />} />
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
    </Suspense>
  );
};

function App() {
  useEffect(() => {
    startKeepAlive();
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <ErrorBoundary>
            <AppRoutes />
            <ToastContainer />
            <ConfirmModal />
            <ServerStatusNotice />
          </ErrorBoundary>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

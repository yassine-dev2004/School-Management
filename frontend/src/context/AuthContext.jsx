import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const response = await api.post('/auth/signin', { username, password });
    const userData = response.data;
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  const isAdmin = () => user?.roles?.includes('ADMINISTRATOR');
  const isTeacher = () => user?.roles?.includes('TEACHER');
  const isParent = () => user?.roles?.includes('PARENT');
  const isStudent = () => user?.roles?.includes('STUDENT');

  const getDefaultRoute = () => {
    if (!user) return '/login';
    if (isAdmin()) return '/admin/dashboard';
    if (isTeacher()) return '/admin/dashboard'; // Teachers share admin layout
    if (isParent()) return '/parent/dashboard';
    if (isStudent()) return '/parent/dashboard'; // Students see parent-like view
    return '/login';
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin, isTeacher, isParent, isStudent, getDefaultRoute }}>
      {children}
    </AuthContext.Provider>
  );
};

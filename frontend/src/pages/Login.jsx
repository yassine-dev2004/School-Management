import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { School, Eye, EyeOff, Loader2 } from 'lucide-react';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, getDefaultRoute } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userData = await login(username, password);
      if (userData.roles?.includes('ADMINISTRATOR') || userData.roles?.includes('TEACHER')) {
        navigate('/admin/dashboard');
      } else if (userData.roles?.includes('PARENT')) {
        navigate('/parent/dashboard');
      } else {
        navigate('/parent/dashboard');
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError('اسم المستخدم أو كلمة المرور غير صحيحة');
      } else {
        setError('تعذر الاتصال بالخادم. تأكد من أن قاعدة البيانات مهيأة.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-effects">
        <div className="bg-orb bg-orb-1"></div>
        <div className="bg-orb bg-orb-2"></div>
        <div className="bg-orb bg-orb-3"></div>
      </div>

      <div className="login-card animate-fade-in">
        <div className="login-header">
          <div className="login-logo">
            <School size={36} />
          </div>
          <h1>نظام إدارة المدرسة</h1>
          <p>مرحباً بك، قم بتسجيل الدخول للمتابعة</p>
        </div>

        {error && (
          <div className="login-error">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="username">اسم المستخدم</label>
            <input
              type="text"
              id="username"
              className="input-field"
              placeholder="أدخل اسم المستخدم"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">كلمة المرور</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                className="input-field"
                placeholder="أدخل كلمة المرور"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
            {loading ? <Loader2 size={20} className="spinning" /> : 'تسجيل الدخول'}
          </button>
        </form>

        <div className="login-footer">
          <p>© 2025 نظام إدارة المدرسة — جميع الحقوق محفوظة</p>
        </div>
      </div>
    </div>
  );
};

export default Login;

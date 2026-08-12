import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, Save, User, Mail, Phone, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../../api/axios';
import './CrudPage.css';

const SettingsPage = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users/profile');
      if (res.data) {
        setForm({
          firstName: res.data.firstName || '',
          lastName: res.data.lastName || '',
          email: res.data.email || '',
          phone: res.data.phone || '',
        });
      }
    } catch {
      setForm({
        firstName: user?.username || '',
        lastName: '',
        email: user?.email || '',
        phone: '',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await api.put('/users/profile', form);
      setMessage({ type: 'success', text: 'تم حفظ التغييرات بنجاح في قاعدة البيانات' });
    } catch (err) {
      setMessage({ type: 'error', text: 'فشل حفظ التغييرات: ' + (err.response?.data?.message || err.message) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="crud-page animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">إعدادات الحساب</h1>
      </div>

      {loading ? (
        <div className="spinner"></div>
      ) : (
        <div className="glass-panel" style={{ padding: 'var(--spacing-xl)', maxWidth: 640 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-xl)', borderBottom: '1px solid var(--border-color)', pb: 'var(--spacing-lg)' }}>
            <div style={{ width: 68, height: 68, borderRadius: 'var(--radius-full)', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.6rem', fontWeight: 800, boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }}>
              {user?.username?.charAt(0)?.toUpperCase() || 'م'}
            </div>
            <div>
              <h2 style={{ fontWeight: 700, fontSize: '1.2rem', margin: 0 }}>{form.firstName ? `${form.firstName} ${form.lastName}` : user?.username}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 8px 0' }}>{form.email || user?.email}</p>
              <span className="badge badge-primary"><Shield size={12} /> {user?.roles?.[0] || 'حساب مفعل'}</span>
            </div>
          </div>

          <form onSubmit={handleSave} className="modal-form">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
              <div className="form-group">
                <label><User size={14} /> الاسم الأول</label>
                <input className="input-field" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} required />
              </div>
              <div className="form-group">
                <label><User size={14} /> الاسم الأخير</label>
                <input className="input-field" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
              </div>
            </div>

            <div className="form-group">
              <label><Mail size={14} /> البريد الإلكتروني</label>
              <input className="input-field" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>

            <div className="form-group">
              <label><Phone size={14} /> رقم الهاتف</label>
              <input className="input-field" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="مثال: 0501234567" />
            </div>

            <div style={{ marginTop: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <Save size={18} /> {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </button>

              {message && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: message.type === 'success' ? 'var(--success)' : 'var(--danger)', fontWeight: 600, fontSize: '0.85rem' }}>
                  {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  {message.text}
                </div>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;

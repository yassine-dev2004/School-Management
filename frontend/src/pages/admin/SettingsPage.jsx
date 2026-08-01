import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Settings, User, Shield, Save } from 'lucide-react';
import './CrudPage.css';

const SettingsPage = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    firstName: user?.username || '',
    email: user?.email || '',
    phone: '',
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="crud-page animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">الإعدادات</h1>
      </div>

      <div className="glass-panel" style={{ padding: 'var(--spacing-xl)', maxWidth: 600 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)' }}>
          <div style={{ width: 64, height: 64, borderRadius: 'var(--radius-full)', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.5rem', fontWeight: 800 }}>
            {user?.username?.charAt(0)?.toUpperCase() || 'م'}
          </div>
          <div>
            <h3 style={{ fontWeight: 700 }}>{user?.username || 'مدير النظام'}</h3>
            <span className="badge badge-primary"><Shield size={12} /> مدير النظام</span>
          </div>
        </div>

        <div className="modal-form">
          <div className="form-group">
            <label>اسم المستخدم</label>
            <input className="input-field" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} />
          </div>
          <div className="form-group">
            <label>البريد الإلكتروني</label>
            <input className="input-field" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          </div>
          <div className="form-group">
            <label>رقم الهاتف</label>
            <input className="input-field" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
          </div>
          <button className="btn btn-primary" onClick={handleSave}>
            <Save size={18} /> حفظ التغييرات
          </button>
          {saved && <span style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.85rem' }}>✓ تم الحفظ بنجاح</span>}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

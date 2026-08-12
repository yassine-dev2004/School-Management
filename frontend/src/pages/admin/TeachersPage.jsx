import { useState, useEffect } from 'react';
import { Search, Plus, Pencil, Trash2, X, GraduationCap } from 'lucide-react';
import api from '../../api/axios';
import './CrudPage.css';

const TeachersPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ 
    firstName: '', lastName: '', username: '', 
    qualification: '', joiningDate: '' 
  });

  useEffect(() => { loadItems(); }, []);

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await api.get('/teachers');
      setItems(res.data);
    } catch {
      setItems([]);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا المعلم؟')) return;
    try { 
      await api.delete(`/teachers/${id}`); 
      setItems(items.filter(i => i.id !== id));
    } catch (err) {
      alert('فشل الحذف. قد يكون السيرفر غير متصل.');
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!form.firstName || !form.lastName) {
      alert('الرجاء إدخال الاسم الأول والاسم الأخير');
      return;
    }
    setSaving(true);
    try {
      const baseUsername = form.username.trim() || `${form.firstName.toLowerCase()}${Math.floor(Math.random() * 10000)}`;
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        username: baseUsername,
        email: `${baseUsername}@teacher.school`,
        password: 'teacher123',
        qualification: form.qualification || '',
        joiningDate: form.joiningDate || ''
      };

      if (editing) { 
        await api.put(`/teachers/${editing.id}`, payload); 
      } else { 
        await api.post('/teachers', payload); 
      }
      setShowModal(false);
      setEditing(null);
      await loadItems();
    } catch (err) {
      console.error('Error saving teacher:', err);
      alert('فشل حفظ المعلم: ' + (err.response?.data?.message || err.message || 'خطأ أثناء الاتصال'));
    } finally {
      setSaving(false);
    }
  };

  const filtered = items.filter(i => {
    const name = `${i.user?.firstName || ''} ${i.user?.lastName || ''}`;
    return name.includes(search) || i.user?.username?.includes(search);
  });

  return (
    <div className="crud-page animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">إدارة المعلمين</h1>
        <button className="btn btn-primary" onClick={() => { 
          setEditing(null); 
          setForm({ firstName: '', lastName: '', username: '', qualification: '', joiningDate: '' }); 
          setShowModal(true); 
        }}>
          <Plus size={18} /> إضافة معلم
        </button>
      </div>

      <div className="crud-toolbar glass-panel">
        <div className="search-bar">
          <Search size={18} />
          <input className="input-field" placeholder="البحث عن معلم..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <span className="result-count">{filtered.length} معلم</span>
      </div>

      {loading ? <div className="spinner"></div> : (
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>الاسم</th>
                  <th>المؤهل</th>
                  <th>المواد</th>
                  <th>تاريخ الانضمام</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => (
                  <tr key={item.id}>
                    <td>{idx + 1}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.user?.firstName} {item.user?.lastName}</td>
                    <td>{item.qualification || '—'}</td>
                    <td>{item.subjects?.map(s => s.name).join('، ') || '—'}</td>
                    <td>{item.joiningDate || '—'}</td>
                    <td>
                      <div className="table-actions">
                        <button className="btn-icon" onClick={() => { 
                          setEditing(item); 
                          setForm({ 
                            firstName: item.user?.firstName || '',
                            lastName: item.user?.lastName || '',
                            username: item.user?.username || '',
                            qualification: item.qualification || '', 
                            joiningDate: item.joiningDate || '' 
                          }); 
                          setShowModal(true); 
                        }}><Pencil size={16} /></button>
                        <button className="btn-icon" onClick={() => handleDelete(item.id)} style={{ color: 'var(--danger)' }}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && <div className="empty-state"><GraduationCap size={48} /><p>لا يوجد معلمين</p></div>}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'تعديل معلم' : 'إضافة معلم جديد'}</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="modal-form">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                <div className="form-group">
                  <label>الاسم الأول *</label>
                  <input className="input-field" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>الاسم الأخير *</label>
                  <input className="input-field" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} required />
                </div>
              </div>
              <div className="form-group">
                <label>اسم المستخدم (اختياري)</label>
                <input className="input-field" placeholder="سيتم إنشاؤه تلقائياً إذا ترك فارغاً" value={form.username} onChange={e => setForm({...form, username: e.target.value})} />
              </div>
              <div className="form-group"><label>المؤهل العلمي</label><input className="input-field" value={form.qualification} onChange={e => setForm({...form, qualification: e.target.value})} /></div>
              <div className="form-group"><label>تاريخ الانضمام</label><input type="date" className="input-field" value={form.joiningDate} onChange={e => setForm({...form, joiningDate: e.target.value})} /></div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'جاري الحفظ...' : 'حفظ'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeachersPage;

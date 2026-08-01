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
  const [form, setForm] = useState({ 
    firstName: '', lastName: '', username: '', email: '', password: '', 
    qualification: '', joiningDate: '' 
  });

  useEffect(() => { loadItems(); }, []);

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await api.get('/teachers');
      setItems(res.data);
    } catch {
      setItems([
        { id: 1, user: { firstName: 'سارة', lastName: 'أحمد', email: 'sara@school.com', phone: '0559991111' }, qualification: 'ماجستير تربية', joiningDate: '2022-09-01', subjects: [{ name: 'الرياضيات' }] },
        { id: 2, user: { firstName: 'محمد', lastName: 'العلي', email: 'mohammed@school.com', phone: '0551112222' }, qualification: 'بكالوريوس علوم', joiningDate: '2023-01-15', subjects: [{ name: 'العلوم' }, { name: 'الفيزياء' }] },
        { id: 3, user: { firstName: 'ليلى', lastName: 'حسن', email: 'laila@school.com', phone: '0553334444' }, qualification: 'ماجستير لغة عربية', joiningDate: '2021-08-20', subjects: [{ name: 'اللغة العربية' }] },
      ]);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا المعلم؟')) return;
    try { 
      await api.delete(`/teachers/${id}`); 
      setItems(items.filter(i => i.id !== id));
    } catch {
      alert('فشل الحذف. قد يكون السيرفر غير متصل.');
    }
  };

  const handleSave = async () => {
    try {
      if (editing) { await api.put(`/teachers/${editing.id}`, form); }
      else { await api.post('/teachers', form); }
      loadItems();
    } catch {}
    setShowModal(false);
    setEditing(null);
  };

  const filtered = items.filter(i => {
    const name = `${i.user?.firstName || ''} ${i.user?.lastName || ''}`;
    return name.includes(search) || i.user?.email?.includes(search);
  });

  return (
    <div className="crud-page animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">إدارة المعلمين</h1>
        <button className="btn btn-primary" onClick={() => { 
          setEditing(null); 
          setForm({ firstName: '', lastName: '', username: '', email: '', password: '', qualification: '', joiningDate: '' }); 
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
                  <th>البريد</th>
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
                    <td>{item.user?.email}</td>
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
                            email: item.user?.email || '',
                            password: '', // Empty on edit
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
            <div className="modal-form">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                <div className="form-group">
                  <label>الاسم الأول</label>
                  <input className="input-field" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>الاسم الأخير</label>
                  <input className="input-field" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} required />
                </div>
              </div>
              <div className="form-group">
                <label>اسم المستخدم</label>
                <input className="input-field" value={form.username} onChange={e => setForm({...form, username: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>البريد الإلكتروني</label>
                <input type="email" className="input-field" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>كلمة المرور {editing ? '(اتركه فارغاً لعدم التغيير)' : '(للتسجيل الأولي)'}</label>
                <input type="password" className="input-field" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required={!editing} />
              </div>
              <div className="form-group"><label>المؤهل العلمي</label><input className="input-field" value={form.qualification} onChange={e => setForm({...form, qualification: e.target.value})} /></div>
              <div className="form-group"><label>تاريخ الانضمام</label><input type="date" className="input-field" value={form.joiningDate} onChange={e => setForm({...form, joiningDate: e.target.value})} /></div>
              <div className="modal-actions">
                <button className="btn btn-primary" onClick={handleSave}>حفظ</button>
                <button className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeachersPage;

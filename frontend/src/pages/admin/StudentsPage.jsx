import { useState, useEffect } from 'react';
import { Search, Plus, Pencil, Trash2, X, Users } from 'lucide-react';
import api from '../../api/axios';
import './CrudPage.css';

const StudentsPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [parents, setParents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ 
    firstName: '', lastName: '', username: '',
    status: 'نشط', emergencyContact: '', parentId: '', classId: '' 
  });

  useEffect(() => { 
    loadItems(); 
    loadParentsAndClasses();
  }, []);

  const loadParentsAndClasses = async () => {
    try {
      const [parentsRes, classesRes] = await Promise.all([
        api.get('/parents').catch(() => ({ data: [] })),
        api.get('/classes').catch(() => ({ data: [] }))
      ]);
      setParents(parentsRes.data);
      setClasses(classesRes.data);
    } catch {}
  };

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await api.get('/students');
      setItems(res.data);
    } catch {
      setItems([]);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا الطالب؟')) return;
    try { 
      await api.delete(`/students/${id}`); 
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
      // Auto generate username, email, password if missing
      const baseUsername = form.username.trim() || `${form.firstName.toLowerCase()}${Math.floor(Math.random() * 10000)}`;
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        username: baseUsername,
        email: `${baseUsername}@student.school`,
        password: 'student123',
        status: form.status || 'نشط',
        emergencyContact: form.emergencyContact || '',
        parentId: form.parentId ? Number(form.parentId) : null,
        classId: form.classId ? Number(form.classId) : null,
      };

      if (editing) {
        await api.put(`/students/${editing.id}`, payload);
      } else {
        await api.post('/students', payload);
      }
      setShowModal(false);
      setEditing(null);
      await loadItems();
    } catch (err) {
      console.error('Error saving student:', err);
      alert('فشل حفظ الطالب: ' + (err.response?.data?.message || err.message || 'خطأ أثناء الاتصال'));
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
        <h1 className="page-title">إدارة الطلاب</h1>
        <button className="btn btn-primary" onClick={() => { 
          setEditing(null); 
          setForm({ firstName: '', lastName: '', username: '', status: 'نشط', emergencyContact: '', parentId: '', classId: '' }); 
          setShowModal(true); 
        }}>
          <Plus size={18} /> إضافة طالب
        </button>
      </div>

      <div className="crud-toolbar glass-panel">
        <div className="search-bar">
          <Search size={18} />
          <input className="input-field" placeholder="البحث عن طالب..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <span className="result-count">{filtered.length} طالب</span>
      </div>

      {loading ? (
        <div className="spinner"></div>
      ) : (
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>الاسم الكامل</th>
                  <th>ولي الأمر</th>
                  <th>الفصل</th>
                  <th>الحالة</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => (
                  <tr key={item.id}>
                    <td>{idx + 1}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.user?.firstName} {item.user?.lastName}</td>
                    <td>{item.parent?.user ? `${item.parent.user.firstName} ${item.parent.user.lastName}` : '—'}</td>
                    <td>{item.schoolClass ? `${item.schoolClass.name} - ${item.schoolClass.section}` : '—'}</td>
                    <td>
                      <span className={`badge ${item.status === 'نشط' ? 'badge-success' : 'badge-warning'}`}>
                        {item.status || 'نشط'}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="btn-icon" title="تعديل" onClick={() => { 
                          setEditing(item); 
                          setForm({ 
                            firstName: item.user?.firstName || '',
                            lastName: item.user?.lastName || '',
                            username: item.user?.username || '',
                            status: item.status || 'نشط', 
                            emergencyContact: item.emergencyContact || '',
                            parentId: item.parent?.id || '',
                            classId: item.schoolClass?.id || ''
                          }); 
                          setShowModal(true); 
                        }}>
                          <Pencil size={16} />
                        </button>
                        <button className="btn-icon" title="حذف" onClick={() => handleDelete(item.id)} style={{ color: 'var(--danger)' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="empty-state">
              <Users size={48} />
              <p>لا يوجد طلاب</p>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'تعديل طالب' : 'إضافة طالب جديد'}</h2>
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
                <label>معرف الطالب (اسم المستخدم - اختياري)</label>
                <input className="input-field" placeholder="سيتم إنشاؤه تلقائياً إذا ترك فارغاً" value={form.username} onChange={e => setForm({...form, username: e.target.value})} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                <div className="form-group">
                  <label>ولي الأمر</label>
                  <select className="input-field" value={form.parentId} onChange={e => setForm({...form, parentId: e.target.value})}>
                    <option value="">-- اختر ولي الأمر --</option>
                    {parents.map(p => (
                      <option key={p.id} value={p.id}>{p.user?.firstName} {p.user?.lastName}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>الفصل الدراسي</label>
                  <select className="input-field" value={form.classId} onChange={e => setForm({...form, classId: e.target.value})}>
                    <option value="">-- اختر الفصل --</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name} - {c.section}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>الحالة</label>
                <select className="input-field" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                  <option value="نشط">نشط</option>
                  <option value="غير نشط">غير نشط</option>
                </select>
              </div>
              <div className="form-group">
                <label>جهة اتصال الطوارئ</label>
                <input className="input-field" placeholder="رقم الطوارئ" value={form.emergencyContact} onChange={e => setForm({...form, emergencyContact: e.target.value})} />
              </div>
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

export default StudentsPage;

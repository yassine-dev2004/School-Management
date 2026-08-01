import { useState, useEffect } from 'react';
import { Search, Plus, Pencil, Trash2, X, Baby } from 'lucide-react';
import api from '../../api/axios';
import './CrudPage.css';

const ParentsPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ 
    firstName: '', lastName: '', username: '', email: '', password: '', 
    occupation: '', address: '' 
  });

  useEffect(() => { loadItems(); }, []);

  const loadItems = async () => {
    setLoading(true);
    try { const res = await api.get('/parents'); setItems(res.data); }
    catch {
      setItems([
        { id: 1, user: { firstName: 'خالد', lastName: 'محمد', email: 'khalid@parent.com', phone: '0551234567' }, occupation: 'مهندس', address: 'الرياض - حي النزهة', children: [{ user: { firstName: 'أحمد' } }] },
        { id: 2, user: { firstName: 'منى', lastName: 'العلي', email: 'mona@parent.com', phone: '0559876543' }, occupation: 'طبيبة', address: 'جدة - حي الروضة', children: [{ user: { firstName: 'فاطمة' } }, { user: { firstName: 'عمر' } }] },
      ]);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من حذف ولي الأمر؟')) return;
    try { 
      await api.delete(`/parents/${id}`); 
      setItems(items.filter(i => i.id !== id));
    } catch {
      alert('فشل الحذف. قد يكون السيرفر غير متصل.');
    }
  };

  const handleSave = async () => {
    try {
      if (editing) { await api.put(`/parents/${editing.id}`, form); }
      else { await api.post('/parents', form); }
      loadItems();
    } catch {}
    setShowModal(false); setEditing(null);
  };

  const filtered = items.filter(i => {
    const name = `${i.user?.firstName || ''} ${i.user?.lastName || ''}`;
    return name.includes(search) || i.user?.email?.includes(search);
  });

  return (
    <div className="crud-page animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">أولياء الأمور</h1>
        <button className="btn btn-primary" onClick={() => { 
          setEditing(null); 
          setForm({ firstName: '', lastName: '', username: '', email: '', password: '', occupation: '', address: '' }); 
          setShowModal(true); 
        }}>
          <Plus size={18} /> إضافة ولي أمر
        </button>
      </div>
      <div className="crud-toolbar glass-panel">
        <div className="search-bar"><Search size={18} /><input className="input-field" placeholder="البحث..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        <span className="result-count">{filtered.length} ولي أمر</span>
      </div>
      {loading ? <div className="spinner"></div> : (
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead><tr><th>#</th><th>الاسم</th><th>البريد</th><th>الهاتف</th><th>المهنة</th><th>العنوان</th><th>الأبناء</th><th>إجراءات</th></tr></thead>
              <tbody>
                {filtered.map((item, idx) => (
                  <tr key={item.id}>
                    <td>{idx + 1}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.user?.firstName} {item.user?.lastName}</td>
                    <td>{item.user?.email}</td>
                    <td>{item.user?.phone || '—'}</td>
                    <td>{item.occupation || '—'}</td>
                    <td>{item.address || '—'}</td>
                    <td>{item.children?.map(c => c.user?.firstName).join('، ') || '—'}</td>
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
                            occupation: item.occupation || '', 
                            address: item.address || '' 
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
          {filtered.length === 0 && <div className="empty-state"><Baby size={48} /><p>لا يوجد أولياء أمور</p></div>}
        </div>
      )}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>{editing ? 'تعديل ولي أمر' : 'إضافة ولي أمر'}</h2><button className="btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button></div>
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
                <label>كلمة المرور {editing ? '(اتركه فارغاً لعدم التغيير)' : '(امنحها لولي الأمر)'}</label>
                <input type="password" className="input-field" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required={!editing} />
              </div>
              <div className="form-group"><label>المهنة</label><input className="input-field" value={form.occupation} onChange={e => setForm({...form, occupation: e.target.value})} /></div>
              <div className="form-group"><label>العنوان</label><input className="input-field" value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
              <div className="modal-actions"><button className="btn btn-primary" onClick={handleSave}>حفظ</button><button className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentsPage;

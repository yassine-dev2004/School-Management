import { useState, useEffect } from 'react';
import { Search, Plus, Pencil, Trash2, X, School } from 'lucide-react';
import api from '../../api/axios';
import './CrudPage.css';

const ClassesPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', section: '' });

  useEffect(() => { loadItems(); }, []);

  const loadItems = async () => {
    setLoading(true);
    try { 
      const res = await api.get('/classes'); 
      setItems(Array.isArray(res.data) ? res.data : []); 
    } catch {
      setItems([]);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا الفصل؟')) return;
    try { 
      await api.delete(`/classes/${id}`); 
      setItems(prev => prev.filter(i => i.id !== id));
    } catch {
      alert('فشل الحذف. قد يكون السيرفر غير متصل.');
    }
  };

  const handleSave = async () => {
    try {
      if (editing) { 
        await api.put(`/classes/${editing.id}`, form); 
      } else { 
        await api.post('/classes', form); 
      }
      setShowModal(false); 
      setEditing(null);
      await loadItems();
    } catch (err) {
      alert('فشل حفظ الفصل: ' + (err.response?.data?.message || err.message));
    }
  };

  const filtered = (Array.isArray(items) ? items : []).filter(i => {
    if (!i) return false;
    return (i.name && i.name.includes(search)) || (i.section && i.section.includes(search));
  });

  return (
    <div className="crud-page animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">الفصول الدراسية</h1>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setForm({ name: '', section: '' }); setShowModal(true); }}>
          <Plus size={18} /> إضافة فصل
        </button>
      </div>
      <div className="crud-toolbar glass-panel">
        <div className="search-bar"><Search size={18} /><input className="input-field" placeholder="البحث..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        <span className="result-count">{filtered.length} فصل</span>
      </div>
      {loading ? <div className="spinner"></div> : (
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead><tr><th>#</th><th>اسم الفصل</th><th>الشعبة</th><th>المعلم المسؤول</th><th>عدد الطلاب</th><th>إجراءات</th></tr></thead>
              <tbody>
                {filtered.map((item, idx) => (
                  <tr key={item.id}>
                    <td>{idx + 1}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.name || '—'}</td>
                    <td><span className="badge badge-primary">{item.section || '—'}</span></td>
                    <td>{item.teacher?.user ? `${item.teacher.user.firstName} ${item.teacher.user.lastName}` : <span style={{ color: 'var(--text-muted)' }}>غير معين</span>}</td>
                    <td>{item.students?.length || 0}</td>
                    <td>
                      <div className="table-actions">
                        <button className="btn-icon" onClick={() => { setEditing(item); setForm({ name: item.name || '', section: item.section || '' }); setShowModal(true); }}><Pencil size={16} /></button>
                        <button className="btn-icon" onClick={() => handleDelete(item.id)} style={{ color: 'var(--danger)' }}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && <div className="empty-state"><School size={48} /><p>لا توجد فصول</p></div>}
        </div>
      )}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>{editing ? 'تعديل فصل' : 'إضافة فصل جديد'}</h2><button className="btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button></div>
            <div className="modal-form">
              <div className="form-group"><label>اسم الفصل</label><input className="input-field" placeholder="مثال: الصف الأول" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
              <div className="form-group"><label>الشعبة</label><input className="input-field" placeholder="مثال: أ" value={form.section} onChange={e => setForm({...form, section: e.target.value})} /></div>
              <div className="modal-actions"><button className="btn btn-primary" onClick={handleSave}>حفظ</button><button className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassesPage;

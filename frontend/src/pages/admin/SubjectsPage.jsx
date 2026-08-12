import { useState, useEffect } from 'react';
import { Search, Plus, Pencil, Trash2, X, BookOpen } from 'lucide-react';
import api from '../../api/axios';
import './CrudPage.css';

const SubjectsPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', code: '' });

  useEffect(() => { loadItems(); }, []);

  const loadItems = async () => {
    setLoading(true);
    try { 
      const res = await api.get('/subjects'); 
      setItems(Array.isArray(res.data) ? res.data : []); 
    } catch {
      setItems([]);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذه المادة؟')) return;
    try { 
      await api.delete(`/subjects/${id}`); 
      setItems(prev => prev.filter(i => i.id !== id));
    } catch {
      alert('فشل الحذف. قد يكون السيرفر غير متصل.');
    }
  };

  const handleSave = async () => {
    try {
      if (editing) { 
        await api.put(`/subjects/${editing.id}`, form); 
      } else { 
        await api.post('/subjects', form); 
      }
      setShowModal(false); 
      setEditing(null);
      await loadItems();
    } catch (err) {
      alert('فشل حفظ المادة: ' + (err.response?.data?.message || err.message));
    }
  };

  const filtered = (Array.isArray(items) ? items : []).filter(i => {
    if (!i) return false;
    return (i.name && i.name.includes(search)) || (i.code && i.code.includes(search));
  });

  return (
    <div className="crud-page animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">المواد الدراسية</h1>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setForm({ name: '', code: '' }); setShowModal(true); }}>
          <Plus size={18} /> إضافة مادة
        </button>
      </div>
      <div className="crud-toolbar glass-panel">
        <div className="search-bar"><Search size={18} /><input className="input-field" placeholder="البحث عن مادة..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        <span className="result-count">{filtered.length} مادة</span>
      </div>
      {loading ? <div className="spinner"></div> : (
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead><tr><th>#</th><th>اسم المادة</th><th>الرمز</th><th>إجراءات</th></tr></thead>
              <tbody>
                {filtered.map((item, idx) => (
                  <tr key={item.id}>
                    <td>{idx + 1}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.name || '—'}</td>
                    <td><span className="badge badge-primary">{item.code || '—'}</span></td>
                    <td>
                      <div className="table-actions">
                        <button className="btn-icon" onClick={() => { setEditing(item); setForm({ name: item.name || '', code: item.code || '' }); setShowModal(true); }}><Pencil size={16} /></button>
                        <button className="btn-icon" onClick={() => handleDelete(item.id)} style={{ color: 'var(--danger)' }}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && <div className="empty-state"><BookOpen size={48} /><p>لا توجد مواد</p></div>}
        </div>
      )}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>{editing ? 'تعديل مادة' : 'إضافة مادة جديدة'}</h2><button className="btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button></div>
            <div className="modal-form">
              <div className="form-group"><label>اسم المادة</label><input className="input-field" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
              <div className="form-group"><label>رمز المادة</label><input className="input-field" value={form.code} onChange={e => setForm({...form, code: e.target.value})} /></div>
              <div className="modal-actions"><button className="btn btn-primary" onClick={handleSave}>حفظ</button><button className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectsPage;

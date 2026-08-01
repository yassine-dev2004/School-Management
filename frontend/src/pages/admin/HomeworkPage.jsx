import { useState, useEffect } from 'react';
import { Search, Plus, Pencil, Trash2, X, FileText } from 'lucide-react';
import api from '../../api/axios';
import './CrudPage.css';

const HomeworkPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', dueDate: '' });

  useEffect(() => { loadItems(); }, []);

  const loadItems = async () => {
    setLoading(true);
    try { const res = await api.get('/homework'); setItems(res.data); }
    catch {
      setItems([
        { id: 1, title: 'حل تمارين الفصل الثالث', description: 'حل جميع تمارين الفصل الثالث من كتاب الرياضيات', dueDate: '2025-07-01', subject: { name: 'الرياضيات' }, schoolClass: { name: 'الصف الأول', section: 'أ' }, submissions: [{}, {}] },
        { id: 2, title: 'بحث عن الطاقة المتجددة', description: 'كتابة بحث من 3 صفحات عن مصادر الطاقة المتجددة', dueDate: '2025-07-05', subject: { name: 'العلوم' }, schoolClass: { name: 'الصف الثاني', section: 'ب' }, submissions: [{}] },
        { id: 3, title: 'إنشاء عن الوطن', description: 'كتابة موضوع إنشاء عن حب الوطن', dueDate: '2025-07-03', subject: { name: 'اللغة العربية' }, schoolClass: { name: 'الصف الأول', section: 'أ' }, submissions: [] },
      ]);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا الواجب؟')) return;
    try { await api.delete(`/homework/${id}`); } catch {}
    setItems(items.filter(i => i.id !== id));
  };

  const handleSave = async () => {
    try {
      if (editing) { await api.put(`/homework/${editing.id}`, form); }
      else { await api.post('/homework', form); }
      loadItems();
    } catch {}
    setShowModal(false); setEditing(null);
  };

  const filtered = items.filter(i => i.title?.includes(search) || i.subject?.name?.includes(search));

  const isDueSoon = (date) => {
    const diff = (new Date(date) - new Date()) / (1000 * 60 * 60 * 24);
    return diff <= 2 && diff >= 0;
  };

  return (
    <div className="crud-page animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">الواجبات</h1>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setForm({ title: '', description: '', dueDate: '' }); setShowModal(true); }}>
          <Plus size={18} /> إضافة واجب
        </button>
      </div>
      <div className="crud-toolbar glass-panel">
        <div className="search-bar"><Search size={18} /><input className="input-field" placeholder="البحث..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        <span className="result-count">{filtered.length} واجب</span>
      </div>
      {loading ? <div className="spinner"></div> : (
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead><tr><th>#</th><th>العنوان</th><th>المادة</th><th>الفصل</th><th>تاريخ التسليم</th><th>التسليمات</th><th>إجراءات</th></tr></thead>
              <tbody>
                {filtered.map((item, idx) => (
                  <tr key={item.id}>
                    <td>{idx + 1}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.title}</td>
                    <td>{item.subject?.name || '—'}</td>
                    <td>{item.schoolClass ? `${item.schoolClass.name} - ${item.schoolClass.section}` : '—'}</td>
                    <td>
                      <span className={isDueSoon(item.dueDate) ? 'badge badge-warning' : ''}>{item.dueDate || '—'}</span>
                    </td>
                    <td><span className="badge badge-primary">{item.submissions?.length || 0}</span></td>
                    <td>
                      <div className="table-actions">
                        <button className="btn-icon" onClick={() => { setEditing(item); setForm({ title: item.title, description: item.description, dueDate: item.dueDate }); setShowModal(true); }}><Pencil size={16} /></button>
                        <button className="btn-icon" onClick={() => handleDelete(item.id)} style={{ color: 'var(--danger)' }}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && <div className="empty-state"><FileText size={48} /><p>لا توجد واجبات</p></div>}
        </div>
      )}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>{editing ? 'تعديل واجب' : 'إضافة واجب جديد'}</h2><button className="btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button></div>
            <div className="modal-form">
              <div className="form-group"><label>العنوان</label><input className="input-field" value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
              <div className="form-group"><label>الوصف</label><textarea className="input-field" rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
              <div className="form-group"><label>تاريخ التسليم</label><input type="date" className="input-field" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} /></div>
              <div className="modal-actions"><button className="btn btn-primary" onClick={handleSave}>حفظ</button><button className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeworkPage;

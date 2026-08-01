import { useState, useEffect } from 'react';
import { Search, Plus, Pencil, Trash2, X, Megaphone } from 'lucide-react';
import api from '../../api/axios';
import './CrudPage.css';

const AnnouncementsPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', targetRole: 'ALL' });

  useEffect(() => { loadItems(); }, []);

  const loadItems = async () => {
    setLoading(true);
    try { const res = await api.get('/announcements'); setItems(res.data); }
    catch {
      setItems([
        { id: 1, title: 'بداية الفصل الدراسي الثاني', content: 'يسعدنا إبلاغكم ببدء الفصل الدراسي الثاني يوم الأحد القادم. يُرجى الالتزام بالمواعيد.', targetRole: 'ALL', datePosted: '2025-06-01T10:00:00' },
        { id: 2, title: 'اجتماع أولياء الأمور', content: 'سيتم عقد اجتماع أولياء الأمور يوم الثلاثاء القادم الساعة 4 مساءً في القاعة الرئيسية.', targetRole: 'PARENT', datePosted: '2025-06-05T14:30:00' },
        { id: 3, title: 'تحديث جدول الحصص', content: 'تم تحديث جدول الحصص الأسبوعي. يُرجى مراجعته من خلال لوحة التحكم.', targetRole: 'TEACHER', datePosted: '2025-06-08T09:00:00' },
      ]);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا الإعلان؟')) return;
    try { await api.delete(`/announcements/${id}`); } catch {}
    setItems(items.filter(i => i.id !== id));
  };

  const handleSave = async () => {
    try {
      if (editing) { await api.put(`/announcements/${editing.id}`, form); }
      else { await api.post('/announcements', form); }
      loadItems();
    } catch {}
    setShowModal(false); setEditing(null);
  };

  const filtered = items.filter(i => i.title?.includes(search) || i.content?.includes(search));

  const roleLabels = { ALL: 'الجميع', PARENT: 'أولياء الأمور', TEACHER: 'المعلمين', STUDENT: 'الطلاب' };

  return (
    <div className="crud-page animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">الإعلانات</h1>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setForm({ title: '', content: '', targetRole: 'ALL' }); setShowModal(true); }}>
          <Plus size={18} /> إضافة إعلان
        </button>
      </div>
      <div className="crud-toolbar glass-panel">
        <div className="search-bar"><Search size={18} /><input className="input-field" placeholder="البحث في الإعلانات..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        <span className="result-count">{filtered.length} إعلان</span>
      </div>
      {loading ? <div className="spinner"></div> : (
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead><tr><th>#</th><th>العنوان</th><th>المحتوى</th><th>الفئة المستهدفة</th><th>التاريخ</th><th>إجراءات</th></tr></thead>
              <tbody>
                {filtered.map((item, idx) => (
                  <tr key={item.id}>
                    <td>{idx + 1}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.title}</td>
                    <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.content}</td>
                    <td><span className="badge badge-primary">{roleLabels[item.targetRole] || item.targetRole}</span></td>
                    <td>{item.datePosted ? new Date(item.datePosted).toLocaleDateString('ar-SA') : '—'}</td>
                    <td>
                      <div className="table-actions">
                        <button className="btn-icon" onClick={() => { setEditing(item); setForm({ title: item.title, content: item.content, targetRole: item.targetRole }); setShowModal(true); }}><Pencil size={16} /></button>
                        <button className="btn-icon" onClick={() => handleDelete(item.id)} style={{ color: 'var(--danger)' }}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && <div className="empty-state"><Megaphone size={48} /><p>لا توجد إعلانات</p></div>}
        </div>
      )}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>{editing ? 'تعديل إعلان' : 'إضافة إعلان جديد'}</h2><button className="btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button></div>
            <div className="modal-form">
              <div className="form-group"><label>العنوان</label><input className="input-field" value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
              <div className="form-group"><label>المحتوى</label><textarea className="input-field" rows={4} value={form.content} onChange={e => setForm({...form, content: e.target.value})} /></div>
              <div className="form-group"><label>الفئة المستهدفة</label>
                <select className="input-field" value={form.targetRole} onChange={e => setForm({...form, targetRole: e.target.value})}>
                  <option value="ALL">الجميع</option><option value="PARENT">أولياء الأمور</option><option value="TEACHER">المعلمين</option><option value="STUDENT">الطلاب</option>
                </select>
              </div>
              <div className="modal-actions"><button className="btn btn-primary" onClick={handleSave}>نشر</button><button className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementsPage;

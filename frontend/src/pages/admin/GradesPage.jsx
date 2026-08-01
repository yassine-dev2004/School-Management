import { useState, useEffect } from 'react';
import { Search, Plus, Pencil, Trash2, X, ClipboardList } from 'lucide-react';
import api from '../../api/axios';
import './CrudPage.css';

const GradesPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ score: '', examType: '', comments: '' });

  useEffect(() => { loadItems(); }, []);

  const loadItems = async () => {
    setLoading(true);
    try { const res = await api.get('/grades'); setItems(res.data); }
    catch {
      setItems([
        { id: 1, student: { user: { firstName: 'أحمد', lastName: 'محمد' } }, subject: { name: 'الرياضيات' }, examType: 'اختبار نهائي', score: 92, comments: 'ممتاز', recordedDate: '2025-06-15' },
        { id: 2, student: { user: { firstName: 'فاطمة', lastName: 'علي' } }, subject: { name: 'العلوم' }, examType: 'اختبار شهري', score: 85, comments: 'جيد جداً', recordedDate: '2025-06-10' },
        { id: 3, student: { user: { firstName: 'عمر', lastName: 'خالد' } }, subject: { name: 'اللغة العربية' }, examType: 'واجب', score: 78, comments: 'جيد', recordedDate: '2025-06-12' },
      ]);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذه الدرجة؟')) return;
    try { await api.delete(`/grades/${id}`); } catch {}
    setItems(items.filter(i => i.id !== id));
  };

  const handleSave = async () => {
    try {
      if (editing) { await api.put(`/grades/${editing.id}`, form); }
      else { await api.post('/grades', form); }
      loadItems();
    } catch {}
    setShowModal(false); setEditing(null);
  };

  const filtered = items.filter(i => {
    const name = `${i.student?.user?.firstName || ''} ${i.student?.user?.lastName || ''}`;
    return name.includes(search) || i.subject?.name?.includes(search);
  });

  const getScoreColor = (score) => {
    if (score >= 90) return 'var(--success)';
    if (score >= 70) return 'var(--primary)';
    if (score >= 50) return 'var(--warning)';
    return 'var(--danger)';
  };

  return (
    <div className="crud-page animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">الدرجات</h1>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setForm({ score: '', examType: '', comments: '' }); setShowModal(true); }}>
          <Plus size={18} /> إضافة درجة
        </button>
      </div>
      <div className="crud-toolbar glass-panel">
        <div className="search-bar"><Search size={18} /><input className="input-field" placeholder="البحث بالاسم أو المادة..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        <span className="result-count">{filtered.length} درجة</span>
      </div>
      {loading ? <div className="spinner"></div> : (
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead><tr><th>#</th><th>الطالب</th><th>المادة</th><th>نوع الاختبار</th><th>الدرجة</th><th>ملاحظات</th><th>التاريخ</th><th>إجراءات</th></tr></thead>
              <tbody>
                {filtered.map((item, idx) => (
                  <tr key={item.id}>
                    <td>{idx + 1}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.student?.user?.firstName} {item.student?.user?.lastName}</td>
                    <td>{item.subject?.name}</td>
                    <td><span className="badge badge-primary">{item.examType}</span></td>
                    <td><span style={{ fontWeight: 700, color: getScoreColor(item.score), fontSize: '1.1rem' }}>{item.score}</span></td>
                    <td>{item.comments || '—'}</td>
                    <td>{item.recordedDate || '—'}</td>
                    <td>
                      <div className="table-actions">
                        <button className="btn-icon" onClick={() => { setEditing(item); setForm({ score: item.score, examType: item.examType, comments: item.comments }); setShowModal(true); }}><Pencil size={16} /></button>
                        <button className="btn-icon" onClick={() => handleDelete(item.id)} style={{ color: 'var(--danger)' }}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && <div className="empty-state"><ClipboardList size={48} /><p>لا توجد درجات</p></div>}
        </div>
      )}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>{editing ? 'تعديل درجة' : 'إضافة درجة'}</h2><button className="btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button></div>
            <div className="modal-form">
              <div className="form-group"><label>نوع الاختبار</label>
                <select className="input-field" value={form.examType} onChange={e => setForm({...form, examType: e.target.value})}>
                  <option value="">اختر</option><option value="واجب">واجب</option><option value="اختبار شهري">اختبار شهري</option><option value="اختبار نهائي">اختبار نهائي</option>
                </select>
              </div>
              <div className="form-group"><label>الدرجة</label><input type="number" className="input-field" value={form.score} onChange={e => setForm({...form, score: e.target.value})} /></div>
              <div className="form-group"><label>ملاحظات</label><input className="input-field" value={form.comments} onChange={e => setForm({...form, comments: e.target.value})} /></div>
              <div className="modal-actions"><button className="btn btn-primary" onClick={handleSave}>حفظ</button><button className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GradesPage;

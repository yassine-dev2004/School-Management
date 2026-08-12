import { useState, useEffect } from 'react';
import { Search, Plus, Pencil, Trash2, X, ClipboardList } from 'lucide-react';
import api from '../../api/axios';
import './CrudPage.css';

const GradesPage = () => {
  const [items, setItems] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ 
    studentId: '', subjectId: '', score: '', examType: 'اختبار شهري', comments: '', recordedDate: new Date().toISOString().split('T')[0] 
  });

  useEffect(() => { 
    loadItems();
    loadDropdowns();
  }, []);

  const loadDropdowns = async () => {
    try {
      const [stRes, sbRes] = await Promise.all([
        api.get('/students').catch(() => ({ data: [] })),
        api.get('/subjects').catch(() => ({ data: [] }))
      ]);
      setStudents(stRes.data);
      setSubjects(sbRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadItems = async () => {
    setLoading(true);
    try { 
      const res = await api.get('/grades'); 
      setItems(res.data); 
    } catch {
      setItems([]);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذه الدرجة؟')) return;
    try { 
      await api.delete(`/grades/${id}`); 
      setItems(items.filter(i => i.id !== id));
    } catch (err) {
      alert('فشل الحذف. قد يكون السيرفر غير متصل.');
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!form.studentId || !form.subjectId || form.score === '') {
      alert('الرجاء اختيار الطالب والمادة وإدخال الدرجة');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        student: { id: Number(form.studentId) },
        subject: { id: Number(form.subjectId) },
        examType: form.examType || 'اختبار شهري',
        score: Number(form.score),
        comments: form.comments || '',
        recordedDate: form.recordedDate || new Date().toISOString().split('T')[0]
      };

      if (editing) { 
        await api.put(`/grades/${editing.id}`, payload); 
      } else { 
        await api.post('/grades', payload); 
      }
      setShowModal(false); 
      setEditing(null);
      await loadItems();
    } catch (err) {
      console.error('Error saving grade:', err);
      alert('فشل حفظ الدرجة: ' + (err.response?.data?.message || err.message || 'خطأ أثناء الاتصال'));
    } finally {
      setSaving(false);
    }
  };

  const filtered = items.filter(i => {
    const name = `${i.student?.user?.firstName || ''} ${i.student?.user?.lastName || ''}`;
    return name.includes(search) || i.subject?.name?.includes(search);
  });

  const getScoreColor = (score) => {
    if (score >= 90) return 'var(--success)';
    if (score >= 70) return 'var(--primary)';
    if (score >= 50) return '#f59e0b';
    return 'var(--danger)';
  };

  return (
    <div className="crud-page animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">الدرجات المسجلة</h1>
        <button className="btn btn-primary" onClick={() => { 
          setEditing(null); 
          setForm({ 
            studentId: students[0]?.id || '', 
            subjectId: subjects[0]?.id || '', 
            score: '', 
            examType: 'اختبار شهري', 
            comments: '', 
            recordedDate: new Date().toISOString().split('T')[0] 
          }); 
          setShowModal(true); 
        }}>
          <Plus size={18} /> إضافة درجة
        </button>
      </div>

      <div className="crud-toolbar glass-panel">
        <div className="search-bar">
          <Search size={18} />
          <input className="input-field" placeholder="البحث بالاسم أو المادة..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <span className="result-count">{filtered.length} درجة</span>
      </div>

      {loading ? <div className="spinner"></div> : (
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>الطالب</th>
                  <th>المادة</th>
                  <th>نوع الاختبار</th>
                  <th>الدرجة</th>
                  <th>ملاحظات</th>
                  <th>التاريخ</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => (
                  <tr key={item.id}>
                    <td>{idx + 1}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                      {item.student?.user ? `${item.student.user.firstName} ${item.student.user.lastName}` : `طالب #${item.student?.id || ''}`}
                    </td>
                    <td>{item.subject?.name || '—'}</td>
                    <td><span className="badge badge-primary">{item.examType}</span></td>
                    <td>
                      <span style={{ fontWeight: 700, color: getScoreColor(item.score), fontSize: '1.1rem' }}>
                        {item.score}
                      </span>
                    </td>
                    <td>{item.comments || '—'}</td>
                    <td>{item.recordedDate ? new Date(item.recordedDate).toLocaleDateString('ar-EG-u-nu-latn') : '—'}</td>
                    <td>
                      <div className="table-actions">
                        <button className="btn-icon" onClick={() => { 
                          setEditing(item); 
                          setForm({ 
                            studentId: item.student?.id || '',
                            subjectId: item.subject?.id || '',
                            score: item.score || '', 
                            examType: item.examType || 'اختبار شهري', 
                            comments: item.comments || '',
                            recordedDate: item.recordedDate || new Date().toISOString().split('T')[0]
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
          {filtered.length === 0 && <div className="empty-state"><ClipboardList size={48} /><p>لا توجد درجات مسجلة</p></div>}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'تعديل درجة' : 'إضافة درجة جديدة'}</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="modal-form">
              <div className="form-group">
                <label>الطالب *</label>
                <select className="input-field" value={form.studentId} onChange={e => setForm({...form, studentId: e.target.value})} required>
                  <option value="">-- اختر الطالب --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.user?.firstName} {s.user?.lastName} {s.schoolClass ? `(${s.schoolClass.name})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>المادة الدراسية *</label>
                <select className="input-field" value={form.subjectId} onChange={e => setForm({...form, subjectId: e.target.value})} required>
                  <option value="">-- اختر المادة --</option>
                  {subjects.map(sb => (
                    <option key={sb.id} value={sb.id}>{sb.name} ({sb.code})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                <div className="form-group">
                  <label>نوع الاختبار</label>
                  <select className="input-field" value={form.examType} onChange={e => setForm({...form, examType: e.target.value})}>
                    <option value="اختبار شهري">اختبار شهري</option>
                    <option value="اختبار نهائي">اختبار نهائي</option>
                    <option value="واجب">واجب</option>
                    <option value="مشروع">مشروع</option>
                    <option value="مشاركة">مشاركة</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>الدرجة (من 100) *</label>
                  <input type="number" step="0.5" min="0" max="100" className="input-field" placeholder="مثال: 95" value={form.score} onChange={e => setForm({...form, score: e.target.value})} required />
                </div>
              </div>

              <div className="form-group">
                <label>تاريخ التسجيل</label>
                <input type="date" className="input-field" value={form.recordedDate} onChange={e => setForm({...form, recordedDate: e.target.value})} />
              </div>

              <div className="form-group">
                <label>ملاحظات</label>
                <input className="input-field" placeholder="أي ملاحظات إضافية" value={form.comments} onChange={e => setForm({...form, comments: e.target.value})} />
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

export default GradesPage;

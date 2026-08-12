import { useState, useEffect } from 'react';
import { Search, UserCheck, UserX, Clock, Plus, Trash2, Pencil, X } from 'lucide-react';
import api from '../../api/axios';
import './CrudPage.css';

const AttendancePage = () => {
  const [records, setRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ studentId: '', status: 'حاضر', date: selectedDate });

  useEffect(() => { 
    loadStudents();
  }, []);

  useEffect(() => { 
    loadRecords(); 
  }, [selectedDate]);

  const loadStudents = async () => {
    try {
      const res = await api.get('/students');
      setStudents(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadRecords = async () => {
    setLoading(true);
    try { 
      const res = await api.get(`/attendance/date/${selectedDate}`); 
      setRecords(res.data); 
    } catch {
      setRecords([]);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا السجل؟')) return;
    try {
      await api.delete(`/attendance/${id}`);
      setRecords(records.filter(r => r.id !== id));
    } catch {
      alert('فشل الحذف. قد يكون السيرفر غير متصل.');
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!form.studentId) {
      alert('الرجاء اختيار الطالب');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        student: { id: Number(form.studentId) },
        status: form.status || 'حاضر',
        date: form.date || selectedDate
      };

      if (editing) {
        await api.put(`/attendance/${editing.id}`, payload);
      } else {
        await api.post('/attendance', payload);
      }
      setShowModal(false);
      setEditing(null);
      await loadRecords();
    } catch (err) {
      console.error('Error saving attendance:', err);
      alert('فشل تسجيل الحضور: ' + (err.response?.data?.message || err.message || 'خطأ أثناء الاتصال'));
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'حاضر' || status === 'Present') return <span className="badge badge-success"><UserCheck size={12} /> حاضر</span>;
    if (status === 'غائب' || status === 'Absent') return <span className="badge badge-danger"><UserX size={12} /> غائب</span>;
    return <span className="badge badge-warning"><Clock size={12} /> متأخر</span>;
  };

  const stats = {
    present: records.filter(r => r.status === 'حاضر' || r.status === 'Present').length,
    absent: records.filter(r => r.status === 'غائب' || r.status === 'Absent').length,
    late: records.filter(r => r.status === 'متأخر' || r.status === 'Late').length,
  };

  return (
    <div className="crud-page animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">الحضور والغياب</h1>
        <button className="btn btn-primary" onClick={() => {
          setEditing(null);
          setForm({ 
            studentId: students[0]?.id || '', 
            status: 'حاضر', 
            date: selectedDate 
          });
          setShowModal(true);
        }}>
          <Plus size={18} /> تسجيل حضور جديد
        </button>
      </div>

      <div className="crud-toolbar glass-panel">
        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>التاريخ: </label>
          <input type="date" className="input-field" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
          <span className="badge badge-success">حاضر: {stats.present}</span>
          <span className="badge badge-danger">غائب: {stats.absent}</span>
          <span className="badge badge-warning">متأخر: {stats.late}</span>
        </div>
      </div>

      {loading ? <div className="spinner"></div> : (
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>اسم الطالب</th>
                  <th>الفصل</th>
                  <th>الحالة</th>
                  <th>التاريخ</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, idx) => (
                  <tr key={r.id}>
                    <td>{idx + 1}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                      {r.student?.user ? `${r.student.user.firstName} ${r.student.user.lastName}` : `طالب #${r.student?.id}`}
                    </td>
                    <td>{r.student?.schoolClass ? `${r.student.schoolClass.name} - ${r.student.schoolClass.section}` : '—'}</td>
                    <td>{getStatusBadge(r.status)}</td>
                    <td>{r.date ? new Date(r.date).toLocaleDateString('ar-EG-u-nu-latn') : selectedDate}</td>
                    <td>
                      <div className="table-actions">
                        <button className="btn-icon" onClick={() => {
                          setEditing(r);
                          setForm({
                            studentId: r.student?.id || '',
                            status: r.status || 'حاضر',
                            date: r.date || selectedDate
                          });
                          setShowModal(true);
                        }}><Pencil size={16} /></button>
                        <button className="btn-icon" onClick={() => handleDelete(r.id)} style={{ color: 'var(--danger)' }}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {records.length === 0 && <div className="empty-state"><UserCheck size={48} /><p>لا توجد سجلات حضور لهذا التاريخ ({selectedDate})</p></div>}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'تعديل سجل حضور' : 'تسجيل حضور جديد'}</h2>
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
                <label>حالة الحضور *</label>
                <select className="input-field" value={form.status} onChange={e => setForm({...form, status: e.target.value})} required>
                  <option value="حاضر">حاضر (Present)</option>
                  <option value="غائب">غائب (Absent)</option>
                  <option value="متأخر">متأخر (Late)</option>
                </select>
              </div>

              <div className="form-group">
                <label>التاريخ *</label>
                <input type="date" className="input-field" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required />
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

export default AttendancePage;

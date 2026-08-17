import { useState, useEffect } from 'react';
import { Search, Plus, Pencil, Trash2, X, CalendarCheck, CheckCircle2, XCircle, Clock, Download, Users, Check, Sparkles } from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import './CrudPage.css';

const AttendancePage = () => {
  const { showToast, confirm } = useToast();
  const [items, setItems] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('');

  // Single attendance modal
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    studentId: '',
    status: 'حاضر',
    date: new Date().toISOString().split('T')[0],
  });

  // Bulk attendance modal
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkClassId, setBulkClassId] = useState('');
  const [bulkDate, setBulkDate] = useState(new Date().toISOString().split('T')[0]);
  const [bulkList, setBulkList] = useState([]);
  const [savingBulk, setSavingBulk] = useState(false);

  useEffect(() => {
    loadItems();
    loadDropdowns();
  }, []);

  const loadDropdowns = async () => {
    try {
      const [stRes, clRes] = await Promise.all([
        api.get('/students').catch(() => ({ data: [] })),
        api.get('/classes').catch(() => ({ data: [] })),
      ]);
      setStudents(Array.isArray(stRes.data) ? stRes.data : []);
      setClasses(Array.isArray(clRes.data) ? clRes.data : []);
    } catch {}
  };

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await api.get('/attendance');
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch {
      setItems([]);
      showToast('فشل تحميل سجل الحضور والغياب', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, studentName, dateStr) => {
    const isConfirmed = await confirm({
      title: 'حذف سجل حضور',
      message: `هل أنت متأكد من حذف سجل الحضور للطالب "${studentName}" بتاريخ ${dateStr}؟`,
      confirmText: 'حذف السجل',
      type: 'danger',
    });

    if (!isConfirmed) return;

    try {
      await api.delete(`/attendance/${id}`);
      setItems((prev) => prev.filter((i) => i.id !== id));
      showToast('تم حذف السجل بنجاح', 'success');
    } catch (err) {
      showToast('فشل الحذف: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  const handleOpenModal = (att = null) => {
    if (att) {
      setEditing(att);
      setForm({
        studentId: att.student?.id ? String(att.student.id) : '',
        status: att.status || 'حاضر',
        date: att.date ? new Date(att.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      });
    } else {
      setEditing(null);
      setForm({
        studentId: students[0]?.id ? String(students[0].id) : '',
        status: 'حاضر',
        date: new Date().toISOString().split('T')[0],
      });
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!form.studentId) {
      showToast('الرجاء اختيار الطالب', 'warning');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        student: { id: Number(form.studentId) },
        status: form.status,
        date: form.date ? new Date(form.date) : new Date(),
      };

      if (editing) {
        await api.put(`/attendance/${editing.id}`, payload);
        showToast('تم تحديث حالة الحضور بنجاح ✨', 'success');
      } else {
        await api.post('/attendance', payload);
        showToast('تم تسجيل الحضور بنجاح 🎉', 'success');
      }

      setShowModal(false);
      setEditing(null);
      await loadItems();
    } catch (err) {
      showToast('فشل حفظ الحضور: ' + (err.response?.data?.message || err.message || 'خطأ أثناء الاتصال'), 'error');
    } finally {
      setSaving(false);
    }
  };

  // Bulk modal handlers
  const handleOpenBulkModal = () => {
    const firstClassId = classes[0]?.id ? String(classes[0].id) : '';
    setBulkClassId(firstClassId);
    setBulkDate(new Date().toISOString().split('T')[0]);
    if (firstClassId) {
      loadBulkStudentsForClass(firstClassId);
    }
    setShowBulkModal(true);
  };

  const handleBulkClassChange = (classId) => {
    setBulkClassId(classId);
    loadBulkStudentsForClass(classId);
  };

  const loadBulkStudentsForClass = (classId) => {
    const classStudents = students.filter((s) => s.schoolClass && String(s.schoolClass.id) === String(classId));
    setBulkList(
      classStudents.map((s) => ({
        studentId: s.id,
        studentName: `${s.user?.firstName || ''} ${s.user?.lastName || ''}`.trim() || `طالب #${s.id}`,
        status: 'حاضر',
      }))
    );
  };

  const setAllBulkStatus = (status) => {
    setBulkList((prev) => prev.map((item) => ({ ...item, status })));
  };

  const setStudentBulkStatus = (studentId, status) => {
    setBulkList((prev) =>
      prev.map((item) => (item.studentId === studentId ? { ...item, status } : item))
    );
  };

  const handleSaveBulk = async () => {
    if (bulkList.length === 0) {
      showToast('لا يوجد طلاب في هذا الفصل لتسجيل حضورهم', 'warning');
      return;
    }

    setSavingBulk(true);
    try {
      const records = bulkList.map((b) => ({
        student: { id: b.studentId },
        status: b.status,
        date: new Date(bulkDate),
      }));

      await api.post('/attendance/bulk', records);
      showToast(`تم تسجيل الحضور بنجاح لـ ${records.length} طالب 🎉`, 'success');
      setShowBulkModal(false);
      await loadItems();
    } catch (err) {
      showToast('فشل حفظ الحضور الجماعي: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setSavingBulk(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'حاضر':
      case 'Present':
        return (
          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={14} /> حاضر
          </span>
        );
      case 'غائب':
      case 'Absent':
        return (
          <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <XCircle size={14} /> غائب
          </span>
        );
      case 'متأخر':
      case 'Late':
        return (
          <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={14} /> متأخر
          </span>
        );
      default:
        return <span className="badge badge-primary">{status}</span>;
    }
  };

  const filtered = (Array.isArray(items) ? items : []).filter((i) => {
    if (!i) return false;
    const name = `${i.student?.user?.firstName || ''} ${i.student?.user?.lastName || ''}`.toLowerCase();
    const itemDate = i.date ? new Date(i.date).toISOString().split('T')[0] : '';
    const matchesSearch = name.includes(search.toLowerCase());
    const matchesDate = !filterDate || itemDate === filterDate;
    const matchesClass = !selectedClassFilter || (i.student?.schoolClass && String(i.student.schoolClass.id) === String(selectedClassFilter));
    return matchesSearch && matchesDate && matchesClass;
  });

  const exportCSV = () => {
    if (filtered.length === 0) {
      showToast('لا توجد سجلات للتصدير', 'warning');
      return;
    }
    const headers = ['#', 'اسم الطالب', 'الفصل', 'الحالة', 'التاريخ'];
    const rows = filtered.map((a, idx) => [
      idx + 1,
      `${a.student?.user?.firstName || ''} ${a.student?.user?.lastName || ''}`.trim(),
      a.student?.schoolClass ? `${a.student.schoolClass.name} - ${a.student.schoolClass.section}` : '',
      a.status || '',
      a.date ? new Date(a.date).toLocaleDateString('ar-EG-u-nu-latn') : '',
    ]);

    const csvContent = '\uFEFF' + [headers, ...rows].map((e) => e.map((val) => `"${val}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('تم تصدير سجلات الحضور بنجاح', 'success');
  };

  const presentCount = filtered.filter((i) => i.status === 'حاضر' || i.status === 'Present').length;
  const absentCount = filtered.filter((i) => i.status === 'غائب' || i.status === 'Absent').length;
  const lateCount = filtered.filter((i) => i.status === 'متأخر' || i.status === 'Late').length;
  const presentRate = filtered.length > 0 ? Math.round((presentCount / filtered.length) * 100) : 100;

  return (
    <div className="crud-page animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">الحضور والغياب</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            رصد الحضور اليومي للطلاب والتأخر والانضباط المدرسي
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn btn-ghost" onClick={exportCSV}>
            <Download size={18} /> تصدير Excel/CSV
          </button>
          <button
            className="btn"
            onClick={handleOpenBulkModal}
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 600,
            }}
          >
            <Sparkles size={18} /> تحضير فصل كامل
          </button>
          <button className="btn btn-primary" onClick={() => handleOpenModal(null)}>
            <Plus size={18} /> تسجيل حضور فردي
          </button>
        </div>
      </div>

      {/* Attendance Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>إجمالي الحاضرين</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success)' }}>{presentCount}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <XCircle size={20} />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>إجمالي الغائبين</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--danger)' }}>{absentCount}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={20} />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>إجمالي المتأخرين</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f59e0b' }}>{lateCount}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CalendarCheck size={20} />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>نسبة الحضور</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>{presentRate}%</div>
          </div>
        </div>
      </div>

      <div className="crud-toolbar glass-panel" style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: '220px' }}>
          <Search size={18} />
          <input
            className="input-field"
            placeholder="البحث باسم الطالب..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ minWidth: '160px' }}>
          <select
            className="input-field"
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
          >
            <option value="">جميع الفصول ({classes.length})</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} - {c.section}
              </option>
            ))}
          </select>
        </div>

        <input
          type="date"
          className="input-field"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          style={{ width: 'auto' }}
        />

        {filterDate && (
          <button className="btn btn-ghost" onClick={() => setFilterDate('')} style={{ fontSize: '0.82rem', padding: '6px 12px' }}>
            مسح التاريخ
          </button>
        )}

        <span className="result-count badge badge-primary">{filtered.length} سجل</span>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>اسم الطالب</th>
                  <th>الفصل الدراسي</th>
                  <th>التاريخ</th>
                  <th>الحالة</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => {
                  const studentName = item.student?.user?.firstName
                    ? `${item.student.user.firstName} ${item.student.user.lastName}`
                    : `طالب #${item.student?.id || ''}`;
                  const dateStr = item.date ? new Date(item.date).toLocaleDateString('ar-EG-u-nu-latn') : '—';

                  return (
                    <tr key={item.id}>
                      <td>{idx + 1}</td>
                      <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{studentName}</td>
                      <td>
                        {item.student?.schoolClass ? (
                          <span className="badge badge-primary">{item.student.schoolClass.name} - {item.student.schoolClass.section}</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                      <td>{dateStr}</td>
                      <td>{getStatusBadge(item.status)}</td>
                      <td>
                        <div className="table-actions">
                          <button className="btn-icon" title="تعديل" onClick={() => handleOpenModal(item)}>
                            <Pencil size={16} />
                          </button>
                          <button
                            className="btn-icon"
                            title="حذف"
                            onClick={() => handleDelete(item.id, studentName, dateStr)}
                            style={{ color: 'var(--danger)' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="empty-state">
              <CalendarCheck size={48} />
              <p>لا توجد سجلات حضور مسجلة</p>
            </div>
          )}
        </div>
      )}

      {/* Single Attendance Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h2>{editing ? 'تعديل حالة حضور' : 'تسجيل حضور فردي'}</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="modal-form">
              <div className="form-group">
                <label>الطالب *</label>
                <select
                  className="input-field"
                  value={form.studentId}
                  onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                  required
                >
                  <option value="">-- اختر الطالب --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.user?.firstName} {s.user?.lastName} {s.schoolClass ? `(${s.schoolClass.name} - ${s.schoolClass.section})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>الحالة *</label>
                <select
                  className="input-field"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="حاضر">حاضر (Present)</option>
                  <option value="غائب">غائب (Absent)</option>
                  <option value="متأخر">متأخر (Late)</option>
                </select>
              </div>

              <div className="form-group">
                <label>التاريخ *</label>
                <input
                  type="date"
                  className="input-field"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>

              <div className="modal-actions" style={{ marginTop: '16px' }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'جاري الحفظ...' : editing ? 'حفظ التعديلات' : 'تسجيل الحضور'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Attendance Modal */}
      {showBulkModal && (
        <div className="modal-overlay" onClick={() => setShowBulkModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={22} color="var(--primary)" />
                <h2>تحضير الفصل الدراسي كاملاً</h2>
              </div>
              <button className="btn-icon" onClick={() => setShowBulkModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
              <div className="form-group">
                <label>اختر الفصل الدراسي</label>
                <select
                  className="input-field"
                  value={bulkClassId}
                  onChange={(e) => handleBulkClassChange(e.target.value)}
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} - {c.section}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>تاريخ التحضير</label>
                <input
                  type="date"
                  className="input-field"
                  value={bulkDate}
                  onChange={(e) => setBulkDate(e.target.value)}
                />
              </div>
            </div>

            {/* Bulk quick actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '10px' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>الطلاب في الفصل ({bulkList.length}):</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ padding: '4px 10px', fontSize: '0.8rem', color: 'var(--success)' }}
                  onClick={() => setAllBulkStatus('حاضر')}
                >
                  الكل حاضر ✅
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ padding: '4px 10px', fontSize: '0.8rem', color: 'var(--danger)' }}
                  onClick={() => setAllBulkStatus('غائب')}
                >
                  الكل غائب ❌
                </button>
              </div>
            </div>

            <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
              {bulkList.map((item) => (
                <div
                  key={item.studentId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{item.studentName}</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {['حاضر', 'متأخر', 'غائب'].map((st) => {
                      const active = item.status === st;
                      const activeBg =
                        st === 'حاضر'
                          ? 'var(--success, #10b981)'
                          : st === 'متأخر'
                          ? '#f59e0b'
                          : 'var(--danger, #ef4444)';

                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setStudentBulkStatus(item.studentId, st)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: active ? `1px solid ${activeBg}` : '1px solid var(--border-color)',
                            background: active ? activeBg : 'transparent',
                            color: active ? '#ffffff' : 'var(--text-muted)',
                            fontSize: '0.78rem',
                            fontWeight: active ? 700 : 500,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                        >
                          {st}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {bulkList.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  لا يوجد طلاب مسجلين في هذا الفصل
                </div>
              )}
            </div>

            <div className="modal-actions" style={{ marginTop: '20px' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveBulk}
                disabled={savingBulk || bulkList.length === 0}
              >
                {savingBulk ? 'جاري الحفظ...' : `حفظ حضور الفصل (${bulkList.length} طالب)`}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowBulkModal(false)}>
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendancePage;

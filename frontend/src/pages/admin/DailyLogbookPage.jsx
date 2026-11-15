import { useState, useEffect } from 'react';
import {
  BookCheck, Plus, Search, Calendar, School, BookOpen,
  User, CheckCircle2, Clock, Trash2, X, RefreshCw
} from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import './CrudPage.css';

const DailyLogbookPage = () => {
  const { showToast, confirm } = useToast();
  const { user, isAdmin, isTeacher } = useAuth();
  const [logs, setLogs] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    classId: '',
    subjectId: '',
    logDate: new Date().toISOString().split('T')[0],
    title: '',
    summary: '',
    homeworkAssigned: '',
    period: 'الحصة الأولى',
  });

  useEffect(() => {
    loadClassesAndSubjects();
    loadLogs();
  }, [selectedClass, selectedDate]);

  const loadClassesAndSubjects = async () => {
    try {
      const [clsRes, subRes] = await Promise.all([
        api.get('/classes'),
        api.get('/subjects'),
      ]);
      setClasses(Array.isArray(clsRes.data) ? clsRes.data : []);
      setSubjects(Array.isArray(subRes.data) ? subRes.data : []);
    } catch {
      // ignore
    }
  };

  const loadLogs = async () => {
    setLoading(true);
    try {
      let url = '/logbook?';
      if (selectedClass) url += `classId=${selectedClass}&`;
      if (selectedDate) url += `date=${selectedDate}&`;
      const res = await api.get(url);
      setLogs(Array.isArray(res.data) ? res.data : []);
    } catch {
      setLogs([]);
      showToast('تعذر تحميل كراس الدروس اليومي', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setForm({
      classId: selectedClass || (classes[0]?.id ? String(classes[0].id) : ''),
      subjectId: subjects[0]?.id ? String(subjects[0].id) : '',
      logDate: selectedDate || new Date().toISOString().split('T')[0],
      title: '',
      summary: '',
      homeworkAssigned: '',
      period: 'الحصة الصباحية',
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.classId || !form.title.trim() || !form.summary.trim()) {
      showToast('الرجاء إدخال الفصل وعنوان الدرس وما تم تدريسه', 'warning');
      return;
    }

    setSaving(true);
    try {
      await api.post('/logbook', {
        classId: Number(form.classId),
        subjectId: form.subjectId ? Number(form.subjectId) : null,
        logDate: form.logDate,
        title: form.title.trim(),
        summary: form.summary.trim(),
        homeworkAssigned: form.homeworkAssigned.trim(),
        period: form.period.trim(),
      });

      showToast('تم حفظ الدرس في الكراس اليومي بنجاح 📚', 'success');
      setShowModal(false);
      await loadLogs();
    } catch (err) {
      showToast('فشل حفظ الدرس: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, title) => {
    const isConfirmed = await confirm({
      title: 'حذف تسجيل الدرس',
      message: `هل أنت متأكد من حذف درس "${title}" من الكراس اليومي؟`,
      confirmText: 'حذف',
      type: 'danger',
    });
    if (!isConfirmed) return;

    try {
      await api.delete(`/logbook/${id}`);
      setLogs((prev) => prev.filter((l) => l.id !== id));
      showToast('تم حذف الدرس بنجاح', 'success');
    } catch (err) {
      showToast('فشل حذف الدرس', 'error');
    }
  };

  const filteredLogs = logs.filter((l) => {
    const matchSearch = !search ||
      l.title?.toLowerCase().includes(search.toLowerCase()) ||
      l.summary?.toLowerCase().includes(search.toLowerCase()) ||
      l.teacherName?.toLowerCase().includes(search.toLowerCase()) ||
      l.subject?.name?.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  return (
    <div className="crud-page animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">كراس الدروس اليومي (Cahier de Texte)</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
            توثيق ما تم تدريسه كل يوم في كل مادة وفصل والواجبات المطلوبة - يظهر مباشرة للأولياء والإدارة
          </p>
        </div>
        <div className="page-header-actions" style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-primary" onClick={handleOpenModal}>
            <Plus size={18} /> تسجيل ما تم تدريسه اليوم
          </button>
          <button className="btn btn-ghost" onClick={loadLogs} disabled={loading} title="تحديث">
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
          </button>
        </div>
      </div>

      {/* Toolbar / Filters */}
      <div className="crud-toolbar glass-panel" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: '220px' }}>
          <Search size={18} />
          <input
            className="input-field"
            placeholder="البحث في موضوع الدرس، المحتوى أو الأستاذ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>الفصل:</span>
          <select
            className="input-field"
            style={{ width: 'auto', minWidth: '160px' }}
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="">جميع الفصول</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name} {c.section ? `(${c.section})` : ''}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>التاريخ:</span>
          <input
            type="date"
            className="input-field"
            style={{ width: 'auto' }}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        <span className="badge badge-primary">{filteredLogs.length} درس مسجل</span>
      </div>

      {/* Daily Logs Timeline / Cards */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="spinner"></div>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <BookCheck size={48} style={{ opacity: 0.4, marginBottom: '12px' }} />
          <h3>لا توجد دروس مسجلة في هذا اليوم أو الفصل</h3>
          <p style={{ fontSize: '0.9rem', marginTop: '6px' }}>
            يمكن للأساتذة تسجيل ملخص الدرس والواجبات بالضغط على زر "تسجيل ما تم تدريسه اليوم"
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredLogs.map((log) => (
            <div key={log.id} className="glass-panel" style={{ padding: '18px', borderRight: '4px solid var(--primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'var(--primary-glow)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700
                  }}>
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)', fontWeight: 700 }}>
                      {log.title}
                    </h3>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px', flexWrap: 'wrap' }}>
                      <span className="badge badge-primary">{log.schoolClass?.name || 'فصل عام'}</span>
                      {log.subject && <span className="badge badge-secondary">{log.subject.name}</span>}
                      {log.period && <span className="badge badge-warning">{log.period}</span>}
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={13} /> {log.logDate}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <User size={13} /> الأستاذ: <strong>{log.teacherName || log.teacher?.user?.firstName || 'المعلم'}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {(isAdmin() || user?.username === log.teacher?.user?.username) && (
                  <button
                    className="btn-icon"
                    title="حذف"
                    onClick={() => handleDelete(log.id, log.title)}
                    style={{ color: 'var(--danger)' }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              {/* Summary / Content studied */}
              <div style={{
                marginTop: '14px',
                padding: '12px 14px',
                background: 'var(--surface)',
                borderRadius: '8px',
                lineHeight: '1.6',
                color: 'var(--text-main)',
                fontSize: '0.95rem'
              }}>
                <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>
                  ما تم تدريسه وإنجازه في الفصل اليوم:
                </strong>
                {log.summary}
              </div>

              {/* Homework if assigned */}
              {log.homeworkAssigned && (
                <div style={{
                  marginTop: '10px',
                  padding: '10px 14px',
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '8px',
                  lineHeight: '1.5',
                  fontSize: '0.9rem',
                  color: '#d97706'
                }}>
                  <strong>الواجب المنزلي المطلوب للحصة القادمة:</strong> {log.homeworkAssigned}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal: Add Lesson to Logbook */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card animate-scale-up" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3>تسجيل ما تم تدريسه اليوم في كراس الدروس</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>الفصل الدراسي</label>
                    <select
                      className="input-field"
                      value={form.classId}
                      onChange={(e) => setForm({ ...form, classId: e.target.value })}
                      required
                    >
                      <option value="">-- اختر الفصل --</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>{c.name} {c.section ? `(${c.section})` : ''}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>المادة الدراسية</label>
                    <select
                      className="input-field"
                      value={form.subjectId}
                      onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                    >
                      <option value="">-- اختر المادة --</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>تاريخ التدريس</label>
                    <input
                      type="date"
                      className="input-field"
                      value={form.logDate}
                      onChange={(e) => setForm({ ...form, logDate: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>توقيت الحصة / الفترة</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="مثال: الحصة 1 (08:00 - 10:00)"
                      value={form.period}
                      onChange={(e) => setForm({ ...form, period: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>عنوان المحور أو الدرس</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="مثال: الدرس 3: التراكيب النحوية والفاعل والمفعول به"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>ملخص ما تم تدريسه وإنجازه اليوم (Cahier de texte)</label>
                  <textarea
                    rows="4"
                    className="input-field"
                    placeholder="اكتب المفاهيم التي تم شرحها، التمارين المنجزة في القسم، إلخ..."
                    value={form.summary}
                    onChange={(e) => setForm({ ...form, summary: e.target.value })}
                    required
                  ></textarea>
                </div>

                <div className="form-group">
                  <label>الواجب والعمل المنزلي المطلوب (اختياري)</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="مثال: إنجاز التمرين رقم 4 و 5 صفحة 42"
                    value={form.homeworkAssigned}
                    onChange={(e) => setForm({ ...form, homeworkAssigned: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                  إلغاء
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'جارٍ الحفظ...' : 'حفظ ونشر في كراس الدروس'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyLogbookPage;

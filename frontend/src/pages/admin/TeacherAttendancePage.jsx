import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  UserCheck, Clock, Calendar, CheckCircle2, AlertCircle,
  RefreshCw, Plus, Trash2, X, Download, ShieldCheck, ChevronDown
} from 'lucide-react';
import api from '../../api/axios';
import { formatDateSafe, getTodayIsoDate } from '../../utils/dateUtils';
import './CrudPage.css';

const TeacherAttendancePage = () => {
  const { user, isTeacher, isAdmin } = useAuth();
  const { showToast, confirm } = useToast();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [todayStatus, setTodayStatus] = useState(null);
  const [filterDate, setFilterDate] = useState('');
  const [filterTeacherId, setFilterTeacherId] = useState('');

  // Self check-in state
  const [checkingIn, setCheckingIn] = useState(false);
  const [selfStatus, setSelfStatus] = useState('حاضر');
  const [selfRemarks, setSelfRemarks] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('fr-FR', { timeZone: 'Africa/Tunis' }));

  // Admin record modal
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminSaving, setAdminSaving] = useState(false);
  const [adminForm, setAdminForm] = useState({
    teacherId: '',
    status: 'حاضر',
    date: getTodayIsoDate(),
    checkInTime: '',
    remarks: '',
  });

  const teacherOnly = isTeacher() && !isAdmin();

  useEffect(() => {
    const timer = setInterval(() => {
      try {
        setCurrentTime(new Date().toLocaleTimeString('fr-FR', { timeZone: 'Africa/Tunis' }));
      } catch {
        setCurrentTime(new Date().toLocaleTimeString());
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadData();
  }, [filterDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (teacherOnly) {
        const [meRes, todayRes] = await Promise.all([
          api.get('/teacher-attendance/me').catch(() => ({ data: [] })),
          api.get('/teacher-attendance/me/today').catch(() => ({ data: { checkedIn: false } })),
        ]);
        setItems(Array.isArray(meRes.data) ? meRes.data : []);
        setTodayStatus(todayRes.data);
      } else {
        const url = filterDate ? `/teacher-attendance?date=${filterDate}` : '/teacher-attendance';
        const [attRes, tRes] = await Promise.all([
          api.get(url).catch(() => ({ data: [] })),
          api.get('/teachers').catch(() => ({ data: [] })),
        ]);
        setItems(Array.isArray(attRes.data) ? attRes.data : []);
        setTeachers(Array.isArray(tRes.data) ? tRes.data : []);
      }
    } catch (err) {
      showToast('فشل تحميل سجل حضور المعلمين', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelfCheckIn = async () => {
    setCheckingIn(true);
    try {
      const res = await api.post('/teacher-attendance/check-in', {
        status: selfStatus,
        remarks: selfRemarks.trim(),
        date: getTodayIsoDate(),
      });
      showToast('تم تسجيل حضورك بنجاح! ✨ نتمنى لك يوماً دراسياً موفقاً', 'success');
      setTodayStatus({ checkedIn: true, attendance: res.data });
      await loadData();
    } catch (err) {
      showToast('فشل تسجيل الحضور: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleAdminSave = async (e) => {
    if (e) e.preventDefault();
    if (!adminForm.teacherId) {
      showToast('الرجاء اختيار المعلم', 'warning');
      return;
    }

    setAdminSaving(true);
    try {
      const payload = {
        teacher: { id: Number(adminForm.teacherId) },
        status: adminForm.status,
        date: adminForm.date || getTodayIsoDate(),
        checkInTime: adminForm.checkInTime || currentTime,
        remarks: adminForm.remarks.trim(),
      };
      await api.post('/teacher-attendance', payload);
      showToast('تم تسجيل حضور المعلم بنجاح 🎉', 'success');
      setShowAdminModal(false);
      await loadData();
    } catch (err) {
      showToast('فشل الحفظ: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setAdminSaving(false);
    }
  };

  const handleDelete = async (id, teacherName) => {
    const isConfirmed = await confirm({
      title: 'حذف سجل حضور معلم',
      message: `هل أنت متأكد من حذف سجل الحضور للمعلم "${teacherName}"؟`,
      confirmText: 'حذف السجل',
      type: 'danger',
    });
    if (!isConfirmed) return;

    try {
      await api.delete(`/teacher-attendance/${id}`);
      setItems((prev) => prev.filter((i) => i.id !== id));
      showToast('تم حذف السجل بنجاح', 'success');
    } catch (err) {
      showToast('فشل الحذف: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'حاضر' || s === 'present') {
      return <span className="badge badge-success"><CheckCircle2 size={13} style={{ display: 'inline', marginLeft: 3 }} /> حاضر</span>;
    }
    if (s === 'متأخر' || s === 'late') {
      return <span className="badge badge-warning"><Clock size={13} style={{ display: 'inline', marginLeft: 3 }} /> متأخر</span>;
    }
    return <span className="badge badge-danger"><AlertCircle size={13} style={{ display: 'inline', marginLeft: 3 }} /> غائب</span>;
  };

  const filtered = items.filter((item) => {
    if (!item) return false;
    if (filterTeacherId && String(item.teacher?.id) !== String(filterTeacherId)) {
      return false;
    }
    return true;
  });

  return (
    <div className="crud-page animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 className="page-title">{teacherOnly ? 'تسجيل حضوري اليومي' : 'سجل حضور المعلمين'}</h1>
            <span className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <UserCheck size={14} /> كادر التدريس
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            {teacherOnly ? 'إثبات الحضور الصباحي وتسجيل توقيت الدخول المدرسي' : 'متابعة دوام الأساتذة والمعلمين والانضباط المدرسي'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            className="btn btn-ghost"
            onClick={loadData}
            disabled={loading}
            title="تحديث البيانات"
          >
            <RefreshCw size={18} className={loading ? 'spinning' : ''} /> تحديث
          </button>
          {!teacherOnly && (
            <button className="btn btn-primary" onClick={() => setShowAdminModal(true)}>
              <Plus size={18} /> رصد حضور معلم
            </button>
          )}
        </div>
      </div>

      {/* TEACHER SELF CHECK-IN CARD */}
      {teacherOnly && (
        <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={26} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                  توقيت تونس الآن: <span style={{ color: 'var(--primary)', direction: 'ltr', display: 'inline-block' }}>{currentTime}</span>
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '2px' }}>
                  {formatDateSafe(getTodayIsoDate(), { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>

            {todayStatus?.checkedIn ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--success)', padding: '10px 16px', borderRadius: '10px', color: 'var(--success)' }}>
                <CheckCircle2 size={20} />
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                  تم تسجيل حضورك اليوم بنجاح الساعة {todayStatus.attendance?.checkInTime || ''} ({todayStatus.attendance?.status || 'حاضر'})
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid #f59e0b', padding: '8px 14px', borderRadius: '10px', color: '#f59e0b' }}>
                <AlertCircle size={18} />
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>لم تسجل حضورك لهذا اليوم بعد</span>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginTop: '20px', alignItems: 'end' }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                حالة الحضور
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['حاضر', 'متأخر'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setSelfStatus(st)}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: selfStatus === st ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                      background: selfStatus === st ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                      color: selfStatus === st ? 'var(--primary)' : 'var(--text-main)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {st === 'حاضر' ? '✅ حاضر' : '⏱️ متأخر'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                ملاحظات أو مبرر (اختياري)
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="مثال: الحصة الصباحية، تأخر 5 دقائق..."
                value={selfRemarks}
                onChange={(e) => setSelfRemarks(e.target.value)}
              />
            </div>

            <div>
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', height: '42px', fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                onClick={handleSelfCheckIn}
                disabled={checkingIn}
              >
                <CheckCircle2 size={18} />
                {checkingIn ? 'جاري التسجيل...' : todayStatus?.checkedIn ? 'تحديث تسجيل حضوري' : 'تسجيل حضوري الآن'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN STATS & TOOLBAR */}
      {!teacherOnly && (
        <div className="crud-toolbar glass-panel" style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ minWidth: '180px' }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>تصفية بالمعلم</label>
            <select
              className="input-field"
              value={filterTeacherId}
              onChange={(e) => setFilterTeacherId(e.target.value)}
            >
              <option value="">جميع المعلمين ({teachers.length})</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.user?.firstName} {t.user?.lastName} ({t.user?.username})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>تصفية بالتاريخ</label>
            <input
              type="date"
              className="input-field"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>

          <span className="result-count badge badge-primary" style={{ marginTop: '18px' }}>
            {filtered.length} سجل
          </span>
        </div>
      )}

      {/* TABLE */}
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
                  {!teacherOnly && <th>اسم المعلم</th>}
                  <th>التاريخ</th>
                  <th>توقيت التسجيل</th>
                  <th>الحالة</th>
                  <th>ملاحظات</th>
                  {!teacherOnly && <th>إجراءات</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => {
                  const teacherName = item.teacher?.user?.firstName
                    ? `${item.teacher.user.firstName} ${item.teacher.user.lastName}`
                    : `معلم #${item.teacher?.id || ''}`;

                  return (
                    <tr key={item.id}>
                      <td>{idx + 1}</td>
                      {!teacherOnly && (
                        <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                          {teacherName}
                          <small style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            {item.teacher?.user?.email}
                          </small>
                        </td>
                      )}
                      <td>{formatDateSafe(item.date)}</td>
                      <td>
                        <span style={{ direction: 'ltr', display: 'inline-block', fontFamily: 'monospace', fontWeight: 600 }}>
                          {item.checkInTime || '—'}
                        </span>
                      </td>
                      <td>{getStatusBadge(item.status)}</td>
                      <td style={{ color: item.remarks ? 'var(--text-main)' : 'var(--text-muted)' }}>
                        {item.remarks || '—'}
                      </td>
                      {!teacherOnly && (
                        <td>
                          <button
                            className="btn-icon"
                            title="حذف"
                            onClick={() => handleDelete(item.id, teacherName)}
                            style={{ color: 'var(--danger)' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="empty-state">
              <UserCheck size={48} />
              <p>لا توجد سجلات حضور مسجلة</p>
            </div>
          )}
        </div>
      )}

      {/* ADMIN MANUAL RECORD MODAL */}
      {showAdminModal && (
        <div className="modal-overlay" onClick={() => setShowAdminModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h2>رصد حضور معلم</h2>
              <button className="btn-icon" onClick={() => setShowAdminModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAdminSave} className="modal-form">
              <div className="form-group">
                <label>المعلم *</label>
                <select
                  className="input-field"
                  value={adminForm.teacherId}
                  onChange={(e) => setAdminForm({ ...adminForm, teacherId: e.target.value })}
                  required
                >
                  <option value="">-- اختر المعلم --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.user?.firstName} {t.user?.lastName} ({t.user?.username})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>الحالة *</label>
                <select
                  className="input-field"
                  value={adminForm.status}
                  onChange={(e) => setAdminForm({ ...adminForm, status: e.target.value })}
                >
                  <option value="حاضر">حاضر (Present)</option>
                  <option value="متأخر">متأخر (Late)</option>
                  <option value="غائب">غائب (Absent)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                <div className="form-group">
                  <label>التاريخ *</label>
                  <input
                    type="date"
                    className="input-field"
                    value={adminForm.date}
                    onChange={(e) => setAdminForm({ ...adminForm, date: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>توقيت الدخول</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="08:00:00"
                    value={adminForm.checkInTime}
                    onChange={(e) => setAdminForm({ ...adminForm, checkInTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>ملاحظات</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="ملاحظات أو مبرر الغياب / التأخير..."
                  value={adminForm.remarks}
                  onChange={(e) => setAdminForm({ ...adminForm, remarks: e.target.value })}
                />
              </div>

              <div className="modal-actions" style={{ marginTop: '16px' }}>
                <button type="submit" className="btn btn-primary" disabled={adminSaving}>
                  {adminSaving ? 'جاري الحفظ...' : 'حفظ السجل'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowAdminModal(false)}>
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherAttendancePage;

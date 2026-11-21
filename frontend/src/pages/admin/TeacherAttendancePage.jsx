import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  UserCheck, Clock, Calendar, CheckCircle2, AlertCircle,
  RefreshCw, Plus, Trash2, X, Download, DollarSign, BookOpen, School
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
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [todayStatus, setTodayStatus] = useState(null);
  const [filterDate, setFilterDate] = useState('');
  const [filterTeacherId, setFilterTeacherId] = useState('');
  const [hoursSummary, setHoursSummary] = useState(null);

  // Self check-in state
  const [checkingIn, setCheckingIn] = useState(false);
  const [selfStatus, setSelfStatus] = useState('حاضر');
  const [selfHours, setSelfHours] = useState('2.0');
  const [selfRate, setSelfRate] = useState('25.0');
  const [selfSubjectId, setSelfSubjectId] = useState('');
  const [selfClassId, setSelfClassId] = useState('');
  const [selfStartTime, setSelfStartTime] = useState('08:00');
  const [selfEndTime, setSelfEndTime] = useState('10:00');
  const [selfRemarks, setSelfRemarks] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('fr-FR', { timeZone: 'Africa/Tunis' }));

  // Admin record modal
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminSaving, setAdminSaving] = useState(false);
  const [adminForm, setAdminForm] = useState({
    teacherId: '',
    status: 'حاضر',
    date: getTodayIsoDate(),
    hoursCount: '2.0',
    hourlyRate: '25.0',
    subjectId: '',
    classId: '',
    startTime: '08:00',
    endTime: '10:00',
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
    loadClassesAndSubjects();
  }, []);

  useEffect(() => {
    loadData();
  }, [filterDate, filterTeacherId]);

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

  const loadData = async () => {
    setLoading(true);
    try {
      if (teacherOnly) {
        const [meRes, todayRes, sumRes] = await Promise.all([
          api.get('/teacher-attendance/me').catch(() => ({ data: [] })),
          api.get('/teacher-attendance/me/today').catch(() => ({ data: { checkedIn: false } })),
          api.get('/teacher-attendance/hours-summary').catch(() => ({ data: null })),
        ]);
        setItems(Array.isArray(meRes.data) ? meRes.data : []);
        setTodayStatus(todayRes.data);
        setHoursSummary(sumRes.data);
      } else {
        const url = filterDate ? `/teacher-attendance?date=${filterDate}` : '/teacher-attendance';
        const [attRes, tRes, sumRes] = await Promise.all([
          api.get(url).catch(() => ({ data: [] })),
          api.get('/teachers').catch(() => ({ data: [] })),
          api.get(`/teacher-attendance/hours-summary${filterTeacherId ? '?teacherId=' + filterTeacherId : ''}`).catch(() => ({ data: null })),
        ]);
        setItems(Array.isArray(attRes.data) ? attRes.data : []);
        setTeachers(Array.isArray(tRes.data) ? tRes.data : []);
        setHoursSummary(sumRes.data);
      }
    } catch {
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
        hoursCount: selfHours ? Number(selfHours) : 2.0,
        hourlyRate: selfRate ? Number(selfRate) : 25.0,
        subjectId: selfSubjectId ? Number(selfSubjectId) : null,
        classId: selfClassId ? Number(selfClassId) : null,
        startTime: selfStartTime,
        endTime: selfEndTime,
      });
      showToast('تم تسجيل حضورك بالساعة بنجاح! ✨ نتمنى لك حصة موفقة', 'success');
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
        checkInTime: adminForm.startTime || currentTime,
        hoursCount: adminForm.hoursCount ? Number(adminForm.hoursCount) : 2.0,
        hourlyRate: adminForm.hourlyRate ? Number(adminForm.hourlyRate) : 25.0,
        startTime: adminForm.startTime,
        endTime: adminForm.endTime,
        remarks: adminForm.remarks.trim(),
      };
      if (adminForm.subjectId) payload.subject = { id: Number(adminForm.subjectId) };
      if (adminForm.classId) payload.schoolClass = { id: Number(adminForm.classId) };

      await api.post('/teacher-attendance', payload);
      showToast('تم تسجيل حضور المعلم وحساب ساعاته بنجاح 🎉', 'success');
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
            <h1 className="page-title">{teacherOnly ? 'تسجيل حضوري بالساعة' : 'حضور المعلمين واحتساب الساعات'}</h1>
            <span className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <UserCheck size={14} /> كادر التدريس
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            {teacherOnly ? 'إثبات الحضور لكل حصة واحتساب الساعات المنجزة والمستحقات في المدرسة الابتدائية الخاصة بن خلدون' : 'متابعة ساعات عمل الأساتذة واحتساب الأجور بالساعة والمستحقات الشهرية'}
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
              <Plus size={18} /> رصد حصة وساعات معلم
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Cards for Hourly Presence */}
      {hoursSummary && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
          marginBottom: '20px'
        }}>
          <div className="glass-panel" style={{ padding: '16px', borderRight: '4px solid var(--primary)' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>إجمالي الساعات المنجزة</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
              {hoursSummary.totalHours || 0} <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>ساعة</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {hoursSummary.totalRecords || 0} حصة مسجلة
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '16px', borderRight: '4px solid #10b981' }}>
            <div style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>إجمالي المستحقات التقديرية</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
              {(hoursSummary.totalEarnings || 0).toLocaleString()} <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>د.ت</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              حسب سعر الساعة المسجل لكل حصة
            </div>
          </div>
        </div>
      )}

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
                  تم تسجيل حصة اليوم الساعة {todayStatus.attendance?.startTime || todayStatus.attendance?.checkInTime || ''} ({todayStatus.attendance?.hoursCount || 2} س - {todayStatus.attendance?.status || 'حاضر'})
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid #f59e0b', padding: '8px 14px', borderRadius: '10px', color: '#f59e0b' }}>
                <AlertCircle size={18} />
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>يمكنك تسجيل حضور حصتك الآن</span>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginTop: '20px' }}>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                الفصل الدراسي
              </label>
              <select
                className="input-field"
                value={selfClassId}
                onChange={(e) => setSelfClassId(e.target.value)}
              >
                <option value="">-- اختر الفصل --</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} {c.section ? `(${c.section})` : ''}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                المادة الدراسية
              </label>
              <select
                className="input-field"
                value={selfSubjectId}
                onChange={(e) => setSelfSubjectId(e.target.value)}
              >
                <option value="">-- اختر المادة --</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                عدد ساعات الحصة
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="12"
                className="input-field"
                value={selfHours}
                onChange={(e) => setSelfHours(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                توقيت الحصة (من - إلى)
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="time"
                  className="input-field"
                  value={selfStartTime}
                  onChange={(e) => setSelfStartTime(e.target.value)}
                />
                <input
                  type="time"
                  className="input-field"
                  value={selfEndTime}
                  onChange={(e) => setSelfEndTime(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginTop: '14px', alignItems: 'end' }}>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                ملاحظات أو تفاصيل الحصة
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="مثال: حصة استدراك، حصة صباحية عادية..."
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
                {checkingIn ? 'جاري التسجيل...' : 'تسجيل حضور الحصة بالساعة'}
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
                  <th>الفصل والمادة</th>
                  <th>التوقيت</th>
                  <th>عدد الساعات</th>
                  <th>الأجر المقدر</th>
                  <th>الحالة</th>
                  <th>ملاحظات</th>
                  {!teacherOnly && <th>إجراءات</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={teacherOnly ? 8 : 10} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      لا توجد سجلات حضور
                    </td>
                  </tr>
                ) : (
                  filtered.map((item, idx) => {
                    const teacherName = item.teacher?.user?.firstName
                      ? `${item.teacher.user.firstName} ${item.teacher.user.lastName}`
                      : `معلم #${item.teacher?.id || ''}`;
                    const hours = item.hoursCount || 2.0;
                    const rate = item.hourlyRate || 25.0;
                    const earnings = Math.round(hours * rate * 10) / 10;

                    return (
                      <tr key={item.id}>
                        <td>{idx + 1}</td>
                        {!teacherOnly && (
                          <td style={{ fontWeight: 600 }}>{teacherName}</td>
                        )}
                        <td>{item.date}</td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {item.schoolClass && (
                              <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
                                {item.schoolClass.name}
                              </span>
                            )}
                            {item.subject && (
                              <span className="badge badge-secondary" style={{ fontSize: '0.72rem' }}>
                                {item.subject.name}
                              </span>
                            )}
                            {!item.schoolClass && !item.subject && <span style={{ color: 'var(--text-muted)' }}>عام</span>}
                          </div>
                        </td>
                        <td style={{ direction: 'ltr', fontSize: '0.85rem' }}>
                          {item.startTime && item.endTime ? `${item.startTime} - ${item.endTime}` : (item.checkInTime || '—')}
                        </td>
                        <td>
                          <span className="badge badge-secondary" style={{ fontWeight: 700 }}>
                            {hours} س
                          </span>
                        </td>
                        <td style={{ color: '#10b981', fontWeight: 700 }}>
                          {earnings} د.ت
                        </td>
                        <td>
                          <span className="badge badge-success">
                            {item.status || 'حاضر'}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{item.remarks || '—'}</td>
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
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Admin Record Modal */}
      {showAdminModal && (
        <div className="modal-overlay">
          <div className="modal-card animate-scale-up" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>رصد حضور وساعات معلم</h3>
              <button className="btn-icon" onClick={() => setShowAdminModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAdminSave}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label>المعلم</label>
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>الفصل الدراسي</label>
                    <select
                      className="input-field"
                      value={adminForm.classId}
                      onChange={(e) => setAdminForm({ ...adminForm, classId: e.target.value })}
                    >
                      <option value="">-- اختياري --</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>{c.name} {c.section ? `(${c.section})` : ''}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>المادة الدراسية</label>
                    <select
                      className="input-field"
                      value={adminForm.subjectId}
                      onChange={(e) => setAdminForm({ ...adminForm, subjectId: e.target.value })}
                    >
                      <option value="">-- اختياري --</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>التاريخ</label>
                    <input
                      type="date"
                      className="input-field"
                      value={adminForm.date}
                      onChange={(e) => setAdminForm({ ...adminForm, date: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>عدد الساعات</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="12"
                      className="input-field"
                      value={adminForm.hoursCount}
                      onChange={(e) => setAdminForm({ ...adminForm, hoursCount: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>سعر الساعة (دينار تونسي TND)</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      className="input-field"
                      value={adminForm.hourlyRate}
                      onChange={(e) => setAdminForm({ ...adminForm, hourlyRate: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>الحالة</label>
                    <select
                      className="input-field"
                      value={adminForm.status}
                      onChange={(e) => setAdminForm({ ...adminForm, status: e.target.value })}
                    >
                      <option value="حاضر">حاضر</option>
                      <option value="متأخر">متأخر</option>
                      <option value="غائب">غائب</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>ملاحظات إضافية</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="ملاحظات..."
                    value={adminForm.remarks}
                    onChange={(e) => setAdminForm({ ...adminForm, remarks: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowAdminModal(false)}>
                  إلغاء
                </button>
                <button type="submit" className="btn btn-primary" disabled={adminSaving}>
                  {adminSaving ? 'جارٍ الحفظ...' : 'حفظ السجل والساعات'}
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

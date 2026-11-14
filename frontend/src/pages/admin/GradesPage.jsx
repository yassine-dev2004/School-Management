import { useState, useEffect } from 'react';
import { Search, Plus, Pencil, Trash2, X, ClipboardList, Download, TrendingUp, Award, AlertCircle, Filter, RefreshCw, ShieldCheck } from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { formatDateSafe, getTodayIsoDate } from '../../utils/dateUtils';
import './CrudPage.css';

const GradesPage = () => {
  const { showToast, confirm } = useToast();
  const { isTeacher, isAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    studentId: '',
    subjectId: '',
    score: '',
    maxScore: '20',
    term: 'الثلاثي الأول',
    examType: 'فرض مراقبة 1',
    comments: '',
    recordedDate: getTodayIsoDate(),
  });

  useEffect(() => {
    loadItems();
    loadDropdowns();
  }, []);

  const loadDropdowns = async () => {
    try {
      const [stRes, sbRes, clRes] = await Promise.all([
        api.get('/students').catch(() => ({ data: [] })),
        api.get('/subjects').catch(() => ({ data: [] })),
        api.get('/classes').catch(() => ({ data: [] })),
      ]);
      setStudents(Array.isArray(stRes.data) ? stRes.data : []);
      setSubjects(Array.isArray(sbRes.data) ? sbRes.data : []);
      setClasses(Array.isArray(clRes.data) ? clRes.data : []);
    } catch {}
  };

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await api.get('/grades');
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch {
      setItems([]);
      showToast('فشل تحميل سجل الدرجات', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, studentName, subjectName) => {
    const isConfirmed = await confirm({
      title: 'حذف درجة مسجلة',
      message: `هل أنت متأكد من حذف درجة "${subjectName}" للطالب "${studentName}"؟`,
      confirmText: 'حذف الدرجة',
      type: 'danger',
    });

    if (!isConfirmed) return;

    try {
      await api.delete(`/grades/${id}`);
      setItems((prev) => prev.filter((i) => i.id !== id));
      showToast('تم حذف الدرجة بنجاح', 'success');
    } catch (err) {
      showToast('فشل حذف الدرجة: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  const handleOpenModal = (grade = null) => {
    if (grade) {
      setEditing(grade);
      const d = grade.recordedDate ? (typeof grade.recordedDate === 'string' && grade.recordedDate.length >= 10 ? grade.recordedDate.substring(0, 10) : new Date(grade.recordedDate).toISOString().split('T')[0]) : getTodayIsoDate();
      setForm({
        studentId: grade.student?.id ? String(grade.student.id) : '',
        subjectId: grade.subject?.id ? String(grade.subject.id) : '',
        score: grade.score !== null && grade.score !== undefined ? String(grade.score) : '',
        maxScore: grade.maxScore !== null && grade.maxScore !== undefined ? String(grade.maxScore) : '20',
        term: grade.term || 'الثلاثي الأول',
        examType: grade.examType || 'فرض مراقبة 1',
        comments: grade.comments || '',
        recordedDate: d,
      });
    } else {
      setEditing(null);
      setForm({
        studentId: students[0]?.id ? String(students[0].id) : '',
        subjectId: subjects[0]?.id ? String(subjects[0].id) : '',
        score: '',
        maxScore: '20',
        term: 'الثلاثي الأول',
        examType: 'فرض مراقبة 1',
        comments: '',
        recordedDate: getTodayIsoDate(),
      });
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!form.studentId || !form.subjectId || form.score === '') {
      showToast('الرجاء اختيار الطالب والمادة وإدخال الدرجة', 'warning');
      return;
    }

    const scoreNum = Number(form.score);
    const maxScoreNum = Number(form.maxScore || 20);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > maxScoreNum) {
      showToast(`يجب أن تكون الدرجة رقماً بين 0 و ${maxScoreNum}`, 'warning');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        student: { id: Number(form.studentId) },
        subject: { id: Number(form.subjectId) },
        examType: form.examType || 'فرض مراقبة 1',
        score: scoreNum,
        maxScore: maxScoreNum,
        term: form.term || 'الثلاثي الأول',
        comments: form.comments.trim(),
        recordedDate: form.recordedDate || getTodayIsoDate(),
      };

      if (editing) {
        await api.put(`/grades/${editing.id}`, payload);
        showToast('تم تحديث الدرجة بنجاح ✨', 'success');
      } else {
        await api.post('/grades', payload);
        showToast('تم رصد الدرجة بنجاح 🎉', 'success');
      }

      setShowModal(false);
      setEditing(null);
      await loadItems();
    } catch (err) {
      showToast('فشل حفظ الدرجة: ' + (err.response?.data?.message || err.message || 'خطأ أثناء الاتصال'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const getScoreColor = (score) => {
    const num = Number(score);
    if (isNaN(num)) return 'var(--text-main)';
    if (num >= 90) return 'var(--success, #10b981)';
    if (num >= 70) return 'var(--primary, #6366f1)';
    if (num >= 50) return '#f59e0b';
    return 'var(--danger, #ef4444)';
  };

  const filtered = (Array.isArray(items) ? items : []).filter((i) => {
    if (!i) return false;
    const studentName = `${i.student?.user?.firstName || ''} ${i.student?.user?.lastName || ''}`.toLowerCase();
    const subjectName = (i.subject?.name || '').toLowerCase();
    const matchesSearch = studentName.includes(search.toLowerCase()) || subjectName.includes(search.toLowerCase());
    const matchesSubject = !selectedSubjectFilter || (i.subject && String(i.subject.id) === String(selectedSubjectFilter));
    const matchesClass = !selectedClassFilter || (i.student?.schoolClass && String(i.student.schoolClass.id) === String(selectedClassFilter));
    return matchesSearch && matchesSubject && matchesClass;
  });

  const exportCSV = () => {
    if (filtered.length === 0) {
      showToast('لا توجد درجات للتصدير', 'warning');
      return;
    }
    const headers = ['#', 'اسم الطالب', 'الفصل', 'المادة', 'نوع الاختبار', 'الدرجة', 'الملاحظات', 'تاريخ التسجيل'];
    const rows = filtered.map((g, idx) => [
      idx + 1,
      `${g.student?.user?.firstName || ''} ${g.student?.user?.lastName || ''}`.trim(),
      g.student?.schoolClass ? `${g.student.schoolClass.name} - ${g.student.schoolClass.section}` : '',
      g.subject?.name || '',
      g.examType || '',
      g.score !== null && g.score !== undefined ? g.score : '',
      g.comments || '',
      g.recordedDate ? new Date(g.recordedDate).toLocaleDateString('ar-EG-u-nu-latn') : '',
    ]);

    const csvContent = '\uFEFF' + [headers, ...rows].map((e) => e.map((val) => `"${val}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `grades_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('تم تصدير الدرجات بنجاح', 'success');
  };

  const stats = {
    total: filtered.length,
    average: filtered.length > 0 ? (filtered.reduce((sum, g) => sum + (Number(g.score) || 0), 0) / filtered.length).toFixed(1) : 0,
    highest: filtered.length > 0 ? Math.max(...filtered.map((g) => Number(g.score) || 0)) : 0,
    lowest: filtered.length > 0 ? Math.min(...filtered.map((g) => Number(g.score) || 0)) : 0,
    passRate: filtered.length > 0 ? Math.round((filtered.filter((g) => (Number(g.score) || 0) >= 50).length / filtered.length) * 100) : 0,
  };

  return (
    <div className="crud-page animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 className="page-title">رصد وتقييم الدرجات</h1>
            {isTeacher && isTeacher() && !isAdmin() && (
              <span className="badge badge-accent" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}>
                <ShieldCheck size={14} /> فصولي وموادي فقط
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            سجل الاختبارات والفروض والتقييمات المستمرة للطلاب
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-ghost" 
            onClick={() => { loadItems(); loadDropdowns(); }} 
            disabled={loading}
            title="تحديث البيانات"
          >
            <RefreshCw size={18} className={loading ? 'spinning' : ''} /> تحديث
          </button>
          <button className="btn btn-ghost" onClick={exportCSV}>
            <Download size={18} /> تصدير Excel/CSV
          </button>
          <button className="btn btn-primary" onClick={() => handleOpenModal(null)}>
            <Plus size={18} /> رصد درجة جديدة
          </button>
        </div>
      </div>

      {/* Analytics Summary Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: 42, height: 42, borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ClipboardList size={20} />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>إجمالي الدرجات</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>{stats.total}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: 42, height: 42, borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={20} />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>متوسط الدرجات</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success)' }}>{stats.average} / 100</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: 42, height: 42, borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Award size={20} />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>أعلى درجة مسجلة</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f59e0b' }}>{stats.highest}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: 42, height: 42, borderRadius: '10px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertCircle size={20} />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>نسبة النجاح (≥ 50)</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#3b82f6' }}>{stats.passRate}%</div>
          </div>
        </div>
      </div>

      <div className="crud-toolbar glass-panel" style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: '220px' }}>
          <Search size={18} />
          <input
            className="input-field"
            placeholder="البحث باسم الطالب أو المادة..."
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

        <div style={{ minWidth: '160px' }}>
          <select
            className="input-field"
            value={selectedSubjectFilter}
            onChange={(e) => setSelectedSubjectFilter(e.target.value)}
          >
            <option value="">جميع المواد ({subjects.length})</option>
            {subjects.map((sb) => (
              <option key={sb.id} value={sb.id}>
                {sb.name}
              </option>
            ))}
          </select>
        </div>

        <span className="result-count badge badge-primary">{filtered.length} درجة</span>
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
                  <th>الفصل</th>
                  <th>المادة الدراسية</th>
                  <th>الثلاثي</th>
                  <th>نوع التقييم</th>
                  <th>الدرجة</th>
                  <th>ملاحظات</th>
                  <th>تاريخ التقييم</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => {
                  const studentName = item.student?.user?.firstName
                    ? `${item.student.user.firstName} ${item.student.user.lastName}`
                    : `طالب #${item.student?.id || ''}`;
                  const subjectName = item.subject?.name || 'غير محدد';
                  const scoreDisplay = item.score !== null && item.score !== undefined ? item.score : '—';
                  const maxDisplay = item.maxScore !== null && item.maxScore !== undefined ? item.maxScore : 20;
                  const dateDisplay = formatDateSafe(item.recordedDate);

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
                      <td>
                        <span className="badge badge-accent">{subjectName}</span>
                      </td>
                      <td>
                        <span className="badge badge-primary">{item.term || 'الثلاثي الأول'}</span>
                      </td>
                      <td>{item.examType || 'فرض مراقبة'}</td>
                      <td>
                        <span
                          style={{
                            fontWeight: 800,
                            color: getScoreColor((Number(item.score) / maxDisplay) * 100),
                            fontSize: '1.15rem',
                            background: 'rgba(255,255,255,0.04)',
                            padding: '3px 8px',
                            borderRadius: '6px',
                          }}
                        >
                          {scoreDisplay} <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>/ {maxDisplay}</small>
                        </span>
                      </td>
                      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.comments || '—'}
                      </td>
                      <td>{dateDisplay}</td>
                      <td>
                        <div className="table-actions">
                          <button className="btn-icon" title="تعديل" onClick={() => handleOpenModal(item)}>
                            <Pencil size={16} />
                          </button>
                          <button
                            className="btn-icon"
                            title="حذف"
                            onClick={() => handleDelete(item.id, studentName, subjectName)}
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
              <ClipboardList size={48} />
              <p>لا توجد درجات مسجلة تطابق خيارات التصفية</p>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h2>{editing ? 'تعديل درجة مسجلة' : 'رصد درجة جديدة'}</h2>
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
                <label>المادة الدراسية *</label>
                <select
                  className="input-field"
                  value={form.subjectId}
                  onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                  required
                >
                  <option value="">-- اختر المادة --</option>
                  {subjects.map((sb) => (
                    <option key={sb.id} value={sb.id}>
                      {sb.name} {sb.code ? `(${sb.code})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                <div className="form-group">
                  <label>الثلاثي الدراسي *</label>
                  <select
                    className="input-field"
                    value={form.term}
                    onChange={(e) => setForm({ ...form, term: e.target.value })}
                  >
                    <option value="الثلاثي الأول">الثلاثي الأول (Trimestre 1)</option>
                    <option value="الثلاثي الثاني">الثلاثي الثاني (Trimestre 2)</option>
                    <option value="الثلاثي الثالث">الثلاثي الثالث (Trimestre 3)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>نوع التقييم / الفرض *</label>
                  <select
                    className="input-field"
                    value={form.examType}
                    onChange={(e) => setForm({ ...form, examType: e.target.value })}
                  >
                    <option value="فرض مراقبة 1">فرض مراقبة 1 (Contrôle 1)</option>
                    <option value="فرض مراقبة 2">فرض مراقبة 2 (Contrôle 2)</option>
                    <option value="فرض تأليفي">فرض تأليفي (Synthèse)</option>
                    <option value="تقييم مستمر / شفاهي">تقييم مستمر / شفاهي</option>
                    <option value="واجب منزلي / مشروع">واجب منزلي / مشروع</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                <div className="form-group">
                  <label>العدد المسند *</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    max={Number(form.maxScore || 20)}
                    className="input-field"
                    placeholder="مثال: 16.5"
                    value={form.score}
                    onChange={(e) => setForm({ ...form, score: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>من مجموع (سلم التقييم)</label>
                  <select
                    className="input-field"
                    value={form.maxScore}
                    onChange={(e) => setForm({ ...form, maxScore: e.target.value })}
                  >
                    <option value="20">من 20 (النظام التونسي الرسمي)</option>
                    <option value="10">من 10</option>
                    <option value="40">من 40</option>
                    <option value="100">من 100</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>تاريخ إجراء الاختبار / التقييم *</label>
                <input
                  type="date"
                  className="input-field"
                  value={form.recordedDate}
                  onChange={(e) => setForm({ ...form, recordedDate: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>ملاحظات المعلم والتقدير</label>
                <input
                  className="input-field"
                  placeholder="مثال: ممتاز، عمل جيد، يحتاج لمزيد من الاجتهاد..."
                  value={form.comments}
                  onChange={(e) => setForm({ ...form, comments: e.target.value })}
                />
              </div>

              <div className="modal-actions" style={{ marginTop: '16px' }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'جاري الحفظ...' : editing ? 'حفظ التعديلات' : 'رصد الدرجة'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
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

export default GradesPage;

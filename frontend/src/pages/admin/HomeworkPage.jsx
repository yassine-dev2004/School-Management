import { useState, useEffect } from 'react';
import { Search, Plus, Pencil, Trash2, X, BookOpen, Download, Calendar, Users, GraduationCap, RefreshCw } from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import './CrudPage.css';

const HomeworkPage = () => {
  const { showToast, confirm } = useToast();
  const [items, setItems] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    classId: '',
    subjectId: '',
    teacherId: '',
  });

  useEffect(() => {
    loadItems();
    loadDropdowns();
  }, []);

  const loadDropdowns = async () => {
    try {
      const [clRes, sbRes, tcRes] = await Promise.all([
        api.get('/classes').catch(() => ({ data: [] })),
        api.get('/subjects').catch(() => ({ data: [] })),
        api.get('/teachers').catch(() => ({ data: [] })),
      ]);
      setClasses(Array.isArray(clRes.data) ? clRes.data : []);
      setSubjects(Array.isArray(sbRes.data) ? sbRes.data : []);
      setTeachers(Array.isArray(tcRes.data) ? tcRes.data : []);
    } catch {}
  };

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await api.get('/homework');
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch {
      setItems([]);
      showToast('فشل تحميل الواجبات المدرسية', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, title) => {
    const isConfirmed = await confirm({
      title: 'حذف واجب مدرسي',
      message: `هل أنت متأكد من حذف الواجب "${title}"؟`,
      confirmText: 'حذف الواجب',
      type: 'danger',
    });

    if (!isConfirmed) return;

    try {
      await api.delete(`/homework/${id}`);
      setItems((prev) => prev.filter((i) => i.id !== id));
      showToast('تم حذف الواجب بنجاح', 'success');
    } catch (err) {
      showToast('فشل حذف الواجب: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  const handleOpenModal = (hw = null) => {
    if (hw) {
      setEditing(hw);
      setForm({
        title: hw.title || '',
        description: hw.description || '',
        dueDate: hw.dueDate ? new Date(hw.dueDate).toISOString().split('T')[0] : '',
        classId: hw.schoolClass?.id ? String(hw.schoolClass.id) : '',
        subjectId: hw.subject?.id ? String(hw.subject.id) : '',
        teacherId: hw.teacher?.id ? String(hw.teacher.id) : '',
      });
    } else {
      setEditing(null);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      setForm({
        title: '',
        description: '',
        dueDate: tomorrow.toISOString().split('T')[0],
        classId: classes[0]?.id ? String(classes[0].id) : '',
        subjectId: subjects[0]?.id ? String(subjects[0].id) : '',
        teacherId: teachers[0]?.id ? String(teachers[0].id) : '',
      });
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!form.title.trim()) {
      showToast('الرجاء كتابة عنوان الواجب', 'warning');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        dueDate: form.dueDate ? new Date(form.dueDate) : null,
        classId: form.classId ? Number(form.classId) : null,
        subjectId: form.subjectId ? Number(form.subjectId) : null,
        teacherId: form.teacherId ? Number(form.teacherId) : null,
      };

      if (editing) {
        await api.put(`/homework/${editing.id}`, payload);
        showToast('تم تحديث الواجب بنجاح ✨', 'success');
      } else {
        await api.post('/homework', payload);
        showToast('تم نشر الواجب الجديد للطلاب بنجاح 🎉', 'success');
      }

      setShowModal(false);
      setEditing(null);
      await loadItems();
    } catch (err) {
      showToast('فشل حفظ الواجب: ' + (err.response?.data?.message || err.message || 'خطأ أثناء الاتصال'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const exportCSV = () => {
    if (items.length === 0) {
      showToast('لا توجد واجبات للتصدير', 'warning');
      return;
    }
    const headers = ['#', 'عنوان الواجب', 'المادة', 'الفصل', 'المعلم', 'تاريخ التسليم', 'الوصف'];
    const rows = filtered.map((h, idx) => [
      idx + 1,
      h.title || '',
      h.subject?.name || '',
      h.schoolClass ? `${h.schoolClass.name} - ${h.schoolClass.section}` : '',
      h.teacher?.user ? `${h.teacher.user.firstName} ${h.teacher.user.lastName}` : '',
      h.dueDate ? new Date(h.dueDate).toLocaleDateString('ar-EG-u-nu-latn') : '',
      h.description || '',
    ]);

    const csvContent = '\uFEFF' + [headers, ...rows].map((e) => e.map((val) => `"${val}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `homework_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('تم تصدير الواجبات بنجاح', 'success');
  };

  const filtered = (Array.isArray(items) ? items : []).filter((i) => {
    if (!i) return false;
    const title = (i.title || '').toLowerCase();
    const desc = (i.description || '').toLowerCase();
    const matchesSearch = title.includes(search.toLowerCase()) || desc.includes(search.toLowerCase());
    const matchesClass = !selectedClassFilter || (i.schoolClass && String(i.schoolClass.id) === String(selectedClassFilter));
    return matchesSearch && matchesClass;
  });

  return (
    <div className="crud-page animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">الواجبات والتكليفات المدرسية</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            إنشاء الواجبات وتحديد مواعيد التسليم ومتابعة حلول الطلاب
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
            <Plus size={18} /> إضافة واجب جديد
          </button>
        </div>
      </div>

      <div className="crud-toolbar glass-panel" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: '240px' }}>
          <Search size={18} />
          <input
            className="input-field"
            placeholder="البحث بعنوان الواجب أو الوصف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ minWidth: '180px' }}>
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

        <span className="result-count badge badge-primary">{filtered.length} واجب</span>
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
                  <th>عنوان الواجب</th>
                  <th>المادة الدراسية</th>
                  <th>الفصل المستهدف</th>
                  <th>المعلم المشرف</th>
                  <th>تاريخ الاستحقاق</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => {
                  const teacherName = item.teacher?.user
                    ? `${item.teacher.user.firstName} ${item.teacher.user.lastName}`
                    : '—';
                  const dueDateStr = item.dueDate
                    ? new Date(item.dueDate).toLocaleDateString('ar-EG-u-nu-latn')
                    : 'غير محدد';

                  return (
                    <tr key={item.id}>
                      <td>{idx + 1}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.98rem' }}>{item.title}</div>
                        {item.description && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="badge badge-accent">{item.subject?.name || '—'}</span>
                      </td>
                      <td>
                        {item.schoolClass ? (
                          <span className="badge badge-primary">{item.schoolClass.name} - {item.schoolClass.section}</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>جميع الفصول</span>
                        )}
                      </td>
                      <td>{teacherName}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                          <Calendar size={14} color="var(--primary)" />
                          <span>{dueDateStr}</span>
                        </div>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button className="btn-icon" title="تعديل" onClick={() => handleOpenModal(item)}>
                            <Pencil size={16} />
                          </button>
                          <button
                            className="btn-icon"
                            title="حذف"
                            onClick={() => handleDelete(item.id, item.title)}
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
              <BookOpen size={48} />
              <p>لا توجد واجبات مسجلة</p>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <h2>{editing ? 'تعديل واجب مدرسي' : 'إضافة واجب جديد'}</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="modal-form">
              <div className="form-group">
                <label>عنوان الواجب *</label>
                <input
                  className="input-field"
                  placeholder="مثال: حل تمارين الجبر صفحة 45"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                <div className="form-group">
                  <label>المادة الدراسية *</label>
                  <select
                    className="input-field"
                    value={form.subjectId}
                    onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                  >
                    <option value="">-- اختر المادة --</option>
                    {subjects.map((sb) => (
                      <option key={sb.id} value={sb.id}>
                        {sb.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>الفصل المستهدف *</label>
                  <select
                    className="input-field"
                    value={form.classId}
                    onChange={(e) => setForm({ ...form, classId: e.target.value })}
                  >
                    <option value="">-- اختر الفصل --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} - {c.section}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                <div className="form-group">
                  <label>المعلم المشرف</label>
                  <select
                    className="input-field"
                    value={form.teacherId}
                    onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
                  >
                    <option value="">-- اختر المعلم --</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.user?.firstName} {t.user?.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>تاريخ الاستحقاق (التسليم)</label>
                  <input
                    type="date"
                    className="input-field"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>تفاصيل وتعليمات الواجب</label>
                <textarea
                  className="input-field"
                  rows={3}
                  placeholder="اكتب تفاصيل التكليف أو الملاحظات الموجهة للطلاب..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="modal-actions" style={{ marginTop: '16px' }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'جاري الحفظ...' : editing ? 'حفظ التعديلات' : 'نشر الواجب'}
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

export default HomeworkPage;

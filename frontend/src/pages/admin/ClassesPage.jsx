import { useState, useEffect } from 'react';
import { Search, Plus, Pencil, Trash2, X, School, Users, GraduationCap, Download, RefreshCw } from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import './CrudPage.css';

const ClassesPage = () => {
  const { showToast, confirm } = useToast();
  const [items, setItems] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', section: '', teacherId: '' });

  useEffect(() => {
    loadItems();
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    try {
      const res = await api.get('/teachers');
      setTeachers(Array.isArray(res.data) ? res.data : []);
    } catch {
      setTeachers([]);
    }
  };

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await api.get('/classes');
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch {
      setItems([]);
      showToast('فشل تحميل الفصول الدراسية', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    const isConfirmed = await confirm({
      title: 'حذف فصل دراسي',
      message: `هل أنت متأكد من حذف الفصل "${name}"؟ سيتم إلغاء تسكين الطلاب في هذا الفصل تلقائياً دون حذفهم.`,
      confirmText: 'حذف الفصل',
      type: 'danger',
    });

    if (!isConfirmed) return;

    try {
      await api.delete(`/classes/${id}`);
      setItems((prev) => prev.filter((i) => i.id !== id));
      showToast('تم حذف الفصل بنجاح', 'success');
    } catch (err) {
      showToast('فشل حذف الفصل: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  const handleOpenModal = (cls = null) => {
    if (cls) {
      setEditing(cls);
      setForm({
        name: cls.name || '',
        section: cls.section || '',
        teacherId: cls.teacher?.id ? String(cls.teacher.id) : '',
      });
    } else {
      setEditing(null);
      setForm({
        name: '',
        section: '',
        teacherId: '',
      });
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!form.name.trim()) {
      showToast('الرجاء إدخال اسم الفصل', 'warning');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        section: form.section.trim(),
        teacherId: form.teacherId ? Number(form.teacherId) : null,
      };

      if (editing) {
        await api.put(`/classes/${editing.id}`, payload);
        showToast('تم تحديث بيانات الفصل بنجاح ✨', 'success');
      } else {
        await api.post('/classes', payload);
        showToast('تمت إضافة الفصل الجديد بنجاح 🎉', 'success');
      }

      setShowModal(false);
      setEditing(null);
      await loadItems();
    } catch (err) {
      showToast('فشل حفظ الفصل: ' + (err.response?.data?.message || err.message || 'خطأ أثناء الاتصال'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const exportCSV = () => {
    if (items.length === 0) {
      showToast('لا توجد بيانات للتصدير', 'warning');
      return;
    }
    const headers = ['#', 'اسم الفصل', 'الشعبة', 'المعلم المسؤول', 'عدد الطلاب'];
    const rows = filtered.map((c, idx) => [
      idx + 1,
      c.name || '',
      c.section || '',
      c.teacher?.user ? `${c.teacher.user.firstName} ${c.teacher.user.lastName}` : 'غير معين',
      c.students?.length || 0,
    ]);

    const csvContent = '\uFEFF' + [headers, ...rows].map((e) => e.map((val) => `"${val}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `classes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('تم تصدير الفصول بنجاح', 'success');
  };

  const filtered = (Array.isArray(items) ? items : []).filter((i) => {
    if (!i) return false;
    const name = (i.name || '').toLowerCase();
    const section = (i.section || '').toLowerCase();
    const teacherName = i.teacher?.user ? `${i.teacher.user.firstName} ${i.teacher.user.lastName}`.toLowerCase() : '';
    return name.includes(search.toLowerCase()) || section.includes(search.toLowerCase()) || teacherName.includes(search.toLowerCase());
  });

  return (
    <div className="crud-page animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">الفصول الدراسية</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            تنظيم المراحل التعليمية وتوزيع الشعب وتعيين رواد الفصول
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-ghost" 
            onClick={() => { loadItems(); loadTeachers(); }} 
            disabled={loading}
            title="تحديث البيانات"
          >
            <RefreshCw size={18} className={loading ? 'spinning' : ''} /> تحديث
          </button>
          <button className="btn btn-ghost" onClick={exportCSV}>
            <Download size={18} /> تصدير Excel/CSV
          </button>
          <button className="btn btn-primary" onClick={() => handleOpenModal(null)}>
            <Plus size={18} /> إضافة فصل جديد
          </button>
        </div>
      </div>

      <div className="crud-toolbar glass-panel" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: '240px' }}>
          <Search size={18} />
          <input
            className="input-field"
            placeholder="البحث باسم الفصل أو الشعبة أو المعلم..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="result-count badge badge-primary">{filtered.length} فصل</span>
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
                  <th>اسم الفصل</th>
                  <th>الشعبة</th>
                  <th>رائد الفصل (المعلم المسؤول)</th>
                  <th>عدد الطلاب المقيدين</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => {
                  const teacherName = item.teacher?.user ? `${item.teacher.user.firstName} ${item.teacher.user.lastName}` : null;
                  return (
                    <tr key={item.id}>
                      <td>{idx + 1}</td>
                      <td style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '1rem' }}>
                        {item.name || '—'}
                      </td>
                      <td>
                        <span className="badge badge-primary">{item.section || 'عام'}</span>
                      </td>
                      <td>
                        {teacherName ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <GraduationCap size={16} color="var(--primary)" />
                            <span>{teacherName}</span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>غير معين</span>
                        )}
                      </td>
                      <td>
                        <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Users size={14} />
                          {item.students?.length || 0} طالب
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button className="btn-icon" title="تعديل" onClick={() => handleOpenModal(item)}>
                            <Pencil size={16} />
                          </button>
                          <button className="btn-icon" title="حذف" onClick={() => handleDelete(item.id, `${item.name} - ${item.section}`)} style={{ color: 'var(--danger)' }}>
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
              <School size={48} />
              <p>لا توجد فصول دراسية مسجلة</p>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>{editing ? 'تعديل فصل دراسي' : 'إضافة فصل دراسي جديد'}</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="modal-form">
              <div className="form-group">
                <label>اسم الفصل *</label>
                <input
                  className="input-field"
                  placeholder="مثال: الصف الأول المتوسط / الصف السادس"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>الشعبة / القسم</label>
                <input
                  className="input-field"
                  placeholder="مثال: أ / ب / 1 / علمي"
                  value={form.section}
                  onChange={(e) => setForm({ ...form, section: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>المعلم المسؤول (رائد الفصل)</label>
                <select
                  className="input-field"
                  value={form.teacherId}
                  onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
                >
                  <option value="">-- بدون معلم مسؤول حالياً --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.user?.firstName} {t.user?.lastName} {t.qualification ? `(${t.qualification})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-actions" style={{ marginTop: '16px' }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'جاري الحفظ...' : editing ? 'حفظ التعديلات' : 'إضافة الفصل'}
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

export default ClassesPage;

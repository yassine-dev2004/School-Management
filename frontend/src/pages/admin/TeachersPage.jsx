import { useState, useEffect } from 'react';
import { Search, Plus, Pencil, Trash2, X, GraduationCap, Download, BookOpen, Check, RefreshCw } from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import './CrudPage.css';

const TeachersPage = () => {
  const { showToast, confirm } = useToast();
  const [items, setItems] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    qualification: '',
    joiningDate: '',
    subjectIds: [],
  });

  useEffect(() => {
    loadItems();
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      const res = await api.get('/subjects');
      setSubjects(Array.isArray(res.data) ? res.data : []);
    } catch {
      setSubjects([]);
    }
  };

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await api.get('/teachers');
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch {
      setItems([]);
      showToast('فشل تحميل قائمة المعلمين', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    const isConfirmed = await confirm({
      title: 'حذف معلم',
      message: `هل أنت متأكد من حذف المعلم "${name}"؟ سيتم إلغاء تعيينه كمعلم مسؤول من الفصول الدراسية تلقائياً وبأمان.`,
      confirmText: 'حذف المعلم',
      type: 'danger',
    });

    if (!isConfirmed) return;

    try {
      await api.delete(`/teachers/${id}`);
      setItems((prev) => prev.filter((i) => i.id !== id));
      showToast('تم حذف المعلم بنجاح', 'success');
    } catch (err) {
      showToast('فشل حذف المعلم: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  const handleOpenModal = (teacher = null) => {
    if (teacher) {
      setEditing(teacher);
      setForm({
        firstName: teacher.user?.firstName || '',
        lastName: teacher.user?.lastName || '',
        username: teacher.user?.username || '',
        email: teacher.user?.email || '',
        phone: teacher.user?.phone || '',
        password: '',
        qualification: teacher.qualification || '',
        joiningDate: teacher.joiningDate || '',
        subjectIds: Array.isArray(teacher.subjects) ? teacher.subjects.map((s) => s.id) : [],
      });
    } else {
      setEditing(null);
      setForm({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        phone: '',
        password: '',
        qualification: '',
        joiningDate: new Date().toISOString().split('T')[0],
        subjectIds: [],
      });
    }
    setShowModal(true);
  };

  const toggleSubject = (id) => {
    setForm((prev) => {
      const exists = prev.subjectIds.includes(id);
      return {
        ...prev,
        subjectIds: exists ? prev.subjectIds.filter((sId) => sId !== id) : [...prev.subjectIds, id],
      };
    });
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) {
      showToast('الرجاء إدخال الاسم الأول والاسم الأخير للمعلم', 'warning');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        username: form.username.trim() || undefined,
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        password: form.password.trim() || undefined,
        qualification: form.qualification.trim() || '',
        joiningDate: form.joiningDate || '',
        subjectIds: form.subjectIds,
      };

      if (editing) {
        await api.put(`/teachers/${editing.id}`, payload);
        showToast('تم تحديث بيانات المعلم بنجاح ✨', 'success');
      } else {
        await api.post('/teachers', payload);
        showToast('تمت إضافة المعلم الجديد بنجاح 🎉', 'success');
      }

      setShowModal(false);
      setEditing(null);
      await loadItems();
    } catch (err) {
      showToast('فشل حفظ المعلم: ' + (err.response?.data?.message || err.message || 'خطأ أثناء الاتصال'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const exportCSV = () => {
    if (items.length === 0) {
      showToast('لا توجد بيانات للتصدير', 'warning');
      return;
    }
    const headers = ['#', 'الاسم', 'اسم المستخدم', 'البريد الإلكتروني', 'الهاتف', 'المؤهل العلمي', 'تاريخ الانضمام', 'المواد'];
    const rows = filtered.map((t, idx) => [
      idx + 1,
      `${t.user?.firstName || ''} ${t.user?.lastName || ''}`.trim(),
      t.user?.username || '',
      t.user?.email || '',
      t.user?.phone || '',
      t.qualification || '',
      t.joiningDate || '',
      t.subjects?.map((s) => s.name).join('; ') || '',
    ]);

    const csvContent = '\uFEFF' + [headers, ...rows].map((e) => e.map((val) => `"${val}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `teachers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('تم تصدير ملف المعلمين بنجاح', 'success');
  };

  const filtered = (Array.isArray(items) ? items : []).filter((i) => {
    if (!i) return false;
    const name = `${i.user?.firstName || ''} ${i.user?.lastName || ''}`.toLowerCase();
    const username = (i.user?.username || '').toLowerCase();
    const qualification = (i.qualification || '').toLowerCase();
    return name.includes(search.toLowerCase()) || username.includes(search.toLowerCase()) || qualification.includes(search.toLowerCase());
  });

  return (
    <div className="crud-page animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">إدارة المعلمين</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            سجل الكادر التعليمي وتخصيص المواد والفصول
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-ghost" 
            onClick={() => { loadItems(); loadSubjects(); }} 
            disabled={loading}
            title="تحديث البيانات"
          >
            <RefreshCw size={18} className={loading ? 'spinning' : ''} /> تحديث
          </button>
          <button className="btn btn-ghost" onClick={exportCSV}>
            <Download size={18} /> تصدير Excel/CSV
          </button>
          <button className="btn btn-primary" onClick={() => handleOpenModal(null)}>
            <Plus size={18} /> إضافة معلم جديد
          </button>
        </div>
      </div>

      <div className="crud-toolbar glass-panel" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: '240px' }}>
          <Search size={18} />
          <input
            className="input-field"
            placeholder="البحث بالاسم أو المؤهل أو اسم المستخدم..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="result-count badge badge-primary">{filtered.length} معلم</span>
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
                  <th>اسم المعلم</th>
                  <th>معرف الدخول</th>
                  <th>المؤهل العلمي</th>
                  <th>المواد المسندة</th>
                  <th>الهاتف</th>
                  <th>تاريخ الانضمام</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => {
                  const fullName = `${item.user?.firstName || ''} ${item.user?.lastName || ''}`.trim() || 'معلم';
                  return (
                    <tr key={item.id}>
                      <td>{idx + 1}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(99, 102, 241, 0.2)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
                            {item.user?.firstName?.charAt(0) || 'م'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{fullName}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.user?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <code style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.82rem' }}>
                          {item.user?.username || '—'}
                        </code>
                      </td>
                      <td>{item.qualification || '—'}</td>
                      <td>
                        {item.subjects && item.subjects.length > 0 ? (
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {item.subjects.map((s) => (
                              <span key={s.id} className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
                                {s.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>لم تسند مواد</span>
                        )}
                      </td>
                      <td>{item.user?.phone || '—'}</td>
                      <td>{item.joiningDate || '—'}</td>
                      <td>
                        <div className="table-actions">
                          <button className="btn-icon" title="تعديل" onClick={() => handleOpenModal(item)}>
                            <Pencil size={16} />
                          </button>
                          <button className="btn-icon" title="حذف" onClick={() => handleDelete(item.id, fullName)} style={{ color: 'var(--danger)' }}>
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
              <GraduationCap size={48} />
              <p>لا يوجد معلمين يطابقون خيارات البحث</p>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>{editing ? 'تعديل بيانات معلم' : 'إضافة معلم جديد'}</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="modal-form">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                <div className="form-group">
                  <label>الاسم الأول *</label>
                  <input
                    className="input-field"
                    placeholder="مثال: يوسف"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>الاسم الأخير *</label>
                  <input
                    className="input-field"
                    placeholder="مثال: الغامدي"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                <div className="form-group">
                  <label>اسم المستخدم (معرف الدخول)</label>
                  <input
                    className="input-field"
                    placeholder="تلقائي إذا ترك فارغاً"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>كلمة المرور {editing ? '(اتركه فارغاً لعدم التغيير)' : ''}</label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder={editing ? '••••••••' : 'افتراضي: teacher123'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                <div className="form-group">
                  <label>البريد الإلكتروني</label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="teacher@school.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>رقم الهاتف</label>
                  <input
                    className="input-field"
                    placeholder="05XXXXXXXX"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                <div className="form-group">
                  <label>المؤهل العلمي</label>
                  <input
                    className="input-field"
                    placeholder="بكالوريوس تربية / ماجستير"
                    value={form.qualification}
                    onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>تاريخ الانضمام</label>
                  <input
                    type="date"
                    className="input-field"
                    value={form.joiningDate}
                    onChange={(e) => setForm({ ...form, joiningDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <BookOpen size={16} /> المواد التي يُدرسها المعلم:
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', maxHeight: '120px', overflowY: 'auto', padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  {subjects.map((sb) => {
                    const isSelected = form.subjectIds.includes(sb.id);
                    return (
                      <button
                        type="button"
                        key={sb.id}
                        onClick={() => toggleSubject(sb.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: '20px',
                          border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                          background: isSelected ? 'var(--primary)' : 'transparent',
                          color: isSelected ? '#ffffff' : 'var(--text-main)',
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        {isSelected && <Check size={14} />}
                        {sb.name} ({sb.code || '—'})
                      </button>
                    );
                  })}
                  {subjects.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>لا توجد مواد مسجلة حالياً</span>}
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: '16px' }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'جاري الحفظ...' : editing ? 'حفظ التعديلات' : 'إضافة المعلم'}
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

export default TeachersPage;

import { useState, useEffect } from 'react';
import { Search, Plus, Pencil, Trash2, X, Users, Download, Phone, Mail, User, ShieldCheck, RefreshCw } from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import './CrudPage.css';

const StudentsPage = () => {
  const { showToast, confirm } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [parents, setParents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    status: 'نشط',
    emergencyContact: '',
    parentId: '',
    classId: '',
  });

  useEffect(() => {
    loadItems();
    loadParentsAndClasses();
  }, []);

  const loadParentsAndClasses = async () => {
    try {
      const [parentsRes, classesRes] = await Promise.all([
        api.get('/parents').catch(() => ({ data: [] })),
        api.get('/classes').catch(() => ({ data: [] })),
      ]);
      setParents(Array.isArray(parentsRes.data) ? parentsRes.data : []);
      setClasses(Array.isArray(classesRes.data) ? classesRes.data : []);
    } catch {}
  };

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await api.get('/students');
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setItems([]);
      showToast('فشل تحميل قائمة الطلاب', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    const isConfirmed = await confirm({
      title: 'حذف طالب',
      message: `هل أنت متأكد من حذف الطالب "${name}"؟ سيتم حذف سجلات الحضور والدرجات المرتبطة به تلقائياً وبأمان.`,
      confirmText: 'حذف نهائي',
      type: 'danger',
    });

    if (!isConfirmed) return;

    try {
      await api.delete(`/students/${id}`);
      setItems((prev) => prev.filter((i) => i.id !== id));
      showToast('تم حذف الطالب بنجاح', 'success');
    } catch (err) {
      showToast('فشل حذف الطالب: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  const handleOpenModal = (student = null) => {
    if (student) {
      setEditing(student);
      setForm({
        firstName: student.user?.firstName || '',
        lastName: student.user?.lastName || '',
        username: student.user?.username || '',
        email: student.user?.email || '',
        phone: student.user?.phone || '',
        password: '',
        status: student.status || 'نشط',
        emergencyContact: student.emergencyContact || '',
        parentId: student.parent?.id ? String(student.parent.id) : '',
        classId: student.schoolClass?.id ? String(student.schoolClass.id) : '',
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
        status: 'نشط',
        emergencyContact: '',
        parentId: '',
        classId: '',
      });
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) {
      showToast('الرجاء إدخال الاسم الأول والاسم الأخير للطالب', 'warning');
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
        status: form.status || 'نشط',
        emergencyContact: form.emergencyContact.trim() || '',
        parentId: form.parentId ? Number(form.parentId) : null,
        classId: form.classId ? Number(form.classId) : null,
      };

      if (editing) {
        await api.put(`/students/${editing.id}`, payload);
        showToast('تم تحديث بيانات الطالب بنجاح ✨', 'success');
      } else {
        await api.post('/students', payload);
        showToast('تمت إضافة الطالب الجديد بنجاح 🎉', 'success');
      }

      setShowModal(false);
      setEditing(null);
      await loadItems();
    } catch (err) {
      showToast('فشل الحفظ: ' + (err.response?.data?.message || err.message || 'خطأ أثناء الاتصال'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const exportCSV = () => {
    if (items.length === 0) {
      showToast('لا توجد بيانات للتصدير', 'warning');
      return;
    }
    const headers = ['#', 'الاسم الأول', 'الاسم الأخير', 'اسم المستخدم', 'البريد', 'الهاتف', 'الفصل', 'الحالة', 'رقم الطوارئ'];
    const rows = filtered.map((s, idx) => [
      idx + 1,
      s.user?.firstName || '',
      s.user?.lastName || '',
      s.user?.username || '',
      s.user?.email || '',
      s.user?.phone || '',
      s.schoolClass ? `${s.schoolClass.name} - ${s.schoolClass.section}` : '',
      s.status || 'نشط',
      s.emergencyContact || '',
    ]);

    const csvContent = '\uFEFF' + [headers, ...rows].map((e) => e.map((val) => `"${val}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `students_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('تم تصدير ملف CSV بنجاح', 'success');
  };

  const filtered = (Array.isArray(items) ? items : []).filter((i) => {
    if (!i) return false;
    const name = `${i.user?.firstName || ''} ${i.user?.lastName || ''}`.toLowerCase();
    const username = (i.user?.username || '').toLowerCase();
    const email = (i.user?.email || '').toLowerCase();
    const matchesSearch = name.includes(search.toLowerCase()) || username.includes(search.toLowerCase()) || email.includes(search.toLowerCase());
    const matchesClass = !selectedClassFilter || (i.schoolClass && String(i.schoolClass.id) === String(selectedClassFilter));
    return matchesSearch && matchesClass;
  });

  return (
    <div className="crud-page animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">إدارة الطلاب</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            سجل الطلاب والبيانات الشخصية وتوزيع الفصول
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-ghost" 
            onClick={() => { loadItems(); loadParentsAndClasses(); }} 
            disabled={loading}
            title="تحديث البيانات"
          >
            <RefreshCw size={18} className={loading ? 'spinning' : ''} /> تحديث
          </button>
          <button className="btn btn-ghost" onClick={exportCSV} title="تصدير CSV">
            <Download size={18} /> تصدير Excel/CSV
          </button>
          <button className="btn btn-primary" onClick={() => handleOpenModal(null)}>
            <Plus size={18} /> إضافة طالب جديد
          </button>
        </div>
      </div>

      <div className="crud-toolbar glass-panel" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: '220px' }}>
          <Search size={18} />
          <input
            className="input-field"
            placeholder="البحث بالاسم أو اسم المستخدم أو البريد..."
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
        <span className="result-count badge badge-primary">{filtered.length} طالب</span>
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
                  <th>معرف الدخول</th>
                  <th>ولي الأمر</th>
                  <th>الفصل</th>
                  <th>رقم الطوارئ</th>
                  <th>الحالة</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => {
                  const fullName = `${item.user?.firstName || ''} ${item.user?.lastName || ''}`.trim() || 'طالب غير مسمى';
                  const parentName = item.parent?.user ? `${item.parent.user.firstName} ${item.parent.user.lastName}` : null;
                  return (
                    <tr key={item.id}>
                      <td>{idx + 1}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
                            {item.user?.firstName?.charAt(0) || 'ط'}
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
                      <td>{parentName ? <span style={{ color: 'var(--text-main)' }}>{parentName}</span> : <span style={{ color: 'var(--text-muted)' }}>غير محدد</span>}</td>
                      <td>
                        {item.schoolClass ? (
                          <span className="badge badge-primary">{item.schoolClass.name} - {item.schoolClass.section}</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>غير مسكن</span>
                        )}
                      </td>
                      <td>{item.emergencyContact || '—'}</td>
                      <td>
                        <span className={`badge ${item.status === 'نشط' ? 'badge-success' : 'badge-warning'}`}>
                          {item.status || 'نشط'}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="btn-icon"
                            title="تعديل"
                            onClick={() => handleOpenModal(item)}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            className="btn-icon"
                            title="حذف"
                            onClick={() => handleDelete(item.id, fullName)}
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
              <Users size={48} />
              <p>لا يوجد طلاب يطابقون خيارات البحث</p>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <h2>{editing ? 'تعديل بيانات طالب' : 'إضافة طالب جديد'}</h2>
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
                    placeholder="مثال: أحمد"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>الاسم الأخير *</label>
                  <input
                    className="input-field"
                    placeholder="مثال: المنصوري"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>

              {editing && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                  <div className="form-group">
                    <label>اسم المستخدم (معرف الدخول)</label>
                    <input
                      className="input-field"
                      placeholder="اسم المستخدم"
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>كلمة المرور (اتركه فارغاً لعدم التغيير)</label>
                    <input
                      type="password"
                      className="input-field"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                <div className="form-group">
                  <label>البريد الإلكتروني</label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="student@school.com"
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
                  <label>ولي الأمر</label>
                  <select
                    className="input-field"
                    value={form.parentId}
                    onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                  >
                    <option value="">-- بدون ولي أمر حالياً --</option>
                    {parents.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.user?.firstName} {p.user?.lastName} {p.occupation ? `(${p.occupation})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>الفصل الدراسي</label>
                  <select
                    className="input-field"
                    value={form.classId}
                    onChange={(e) => setForm({ ...form, classId: e.target.value })}
                  >
                    <option value="">-- غير مسكن بفصل --</option>
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
                  <label>حالة القيد</label>
                  <select
                    className="input-field"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="نشط">نشط (Active)</option>
                    <option value="غير نشط">غير نشط (Inactive)</option>
                    <option value="معلق">معلق (Suspended)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>جهة اتصال الطوارئ</label>
                  <input
                    className="input-field"
                    placeholder="رقم هاتف الطوارئ"
                    value={form.emergencyContact}
                    onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: '16px' }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'جاري الحفظ...' : editing ? 'حفظ التعديلات' : 'إضافة الطالب'}
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

export default StudentsPage;

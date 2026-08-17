import { useState, useEffect } from 'react';
import { Search, Plus, Pencil, Trash2, X, BookOpen, Download } from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import './CrudPage.css';

const SubjectsPage = () => {
  const { showToast, confirm } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', code: '' });

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await api.get('/subjects');
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch {
      setItems([]);
      showToast('فشل تحميل المواد الدراسية', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    const isConfirmed = await confirm({
      title: 'حذف مادة دراسية',
      message: `هل أنت متأكد من حذف المادة "${name}"؟ سيتم حذف سجلات الدرجات المرتبطة بها تلقائياً وبأمان.`,
      confirmText: 'حذف المادة',
      type: 'danger',
    });

    if (!isConfirmed) return;

    try {
      await api.delete(`/subjects/${id}`);
      setItems((prev) => prev.filter((i) => i.id !== id));
      showToast('تم حذف المادة بنجاح', 'success');
    } catch (err) {
      showToast('فشل حذف المادة: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  const handleOpenModal = (subject = null) => {
    if (subject) {
      setEditing(subject);
      setForm({ name: subject.name || '', code: subject.code || '' });
    } else {
      setEditing(null);
      setForm({ name: '', code: '' });
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!form.name.trim()) {
      showToast('الرجاء إدخال اسم المادة الدراسية', 'warning');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
      };

      if (editing) {
        await api.put(`/subjects/${editing.id}`, payload);
        showToast('تم تحديث المادة بنجاح ✨', 'success');
      } else {
        await api.post('/subjects', payload);
        showToast('تمت إضافة المادة الجديدة بنجاح 🎉', 'success');
      }

      setShowModal(false);
      setEditing(null);
      await loadItems();
    } catch (err) {
      showToast('فشل حفظ المادة: ' + (err.response?.data?.message || err.message || 'خطأ أثناء الاتصال'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const exportCSV = () => {
    if (items.length === 0) {
      showToast('لا توجد مواد للتصدير', 'warning');
      return;
    }
    const headers = ['#', 'اسم المادة', 'الرمز الأكاديمي'];
    const rows = filtered.map((s, idx) => [idx + 1, s.name || '', s.code || '']);

    const csvContent = '\uFEFF' + [headers, ...rows].map((e) => e.map((val) => `"${val}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `subjects_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('تم تصدير المواد بنجاح', 'success');
  };

  const filtered = (Array.isArray(items) ? items : []).filter((i) => {
    if (!i) return false;
    const name = (i.name || '').toLowerCase();
    const code = (i.code || '').toLowerCase();
    return name.includes(search.toLowerCase()) || code.includes(search.toLowerCase());
  });

  return (
    <div className="crud-page animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">المواد الدراسية</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            المناهج والمقررات والرموز الأكاديمية للمدرسة
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-ghost" onClick={exportCSV}>
            <Download size={18} /> تصدير Excel/CSV
          </button>
          <button className="btn btn-primary" onClick={() => handleOpenModal(null)}>
            <Plus size={18} /> إضافة مادة جديدة
          </button>
        </div>
      </div>

      <div className="crud-toolbar glass-panel" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: '240px' }}>
          <Search size={18} />
          <input
            className="input-field"
            placeholder="البحث باسم المادة أو الرمز الأكاديمي..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="result-count badge badge-primary">{filtered.length} مادة</span>
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
                  <th>اسم المادة الدراسية</th>
                  <th>الرمز الأكاديمي</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => (
                  <tr key={item.id}>
                    <td>{idx + 1}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BookOpen size={18} color="var(--primary)" />
                        {item.name || '—'}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-primary">{item.code || '—'}</span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="btn-icon" title="تعديل" onClick={() => handleOpenModal(item)}>
                          <Pencil size={16} />
                        </button>
                        <button className="btn-icon" title="حذف" onClick={() => handleDelete(item.id, item.name)} style={{ color: 'var(--danger)' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="empty-state">
              <BookOpen size={48} />
              <p>لا توجد مواد دراسية مسجلة</p>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h2>{editing ? 'تعديل مادة دراسية' : 'إضافة مادة جديدة'}</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="modal-form">
              <div className="form-group">
                <label>اسم المادة *</label>
                <input
                  className="input-field"
                  placeholder="مثال: الرياضيات / اللغة العربية / العلوم"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>الرمز الأكاديمي (Code)</label>
                <input
                  className="input-field"
                  placeholder="مثال: MATH101 / ARB201 / SCI"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                />
              </div>
              <div className="modal-actions" style={{ marginTop: '16px' }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'جاري الحفظ...' : editing ? 'حفظ التعديلات' : 'إضافة المادة'}
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

export default SubjectsPage;

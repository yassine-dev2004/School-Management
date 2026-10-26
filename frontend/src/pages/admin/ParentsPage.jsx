import { useState, useEffect } from 'react';
import { Search, Plus, Pencil, Trash2, X, Baby, Download, Phone, Mail, UserCheck, RefreshCw } from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import './CrudPage.css';

const ParentsPage = () => {
  const { showToast, confirm } = useToast();
  const [items, setItems] = useState([]);
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
    occupation: '',
    address: '',
  });

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await api.get('/parents');
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch {
      setItems([]);
      showToast('فشل تحميل أولياء الأمور', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    const isConfirmed = await confirm({
      title: 'حذف ولي أمر',
      message: `هل أنت متأكد من حذف ولي الأمر "${name}"؟ سيتم فك ارتباط الأبناء تلقائياً وبأمان دون حذف الطلاب.`,
      confirmText: 'حذف ولي الأمر',
      type: 'danger',
    });

    if (!isConfirmed) return;

    try {
      await api.delete(`/parents/${id}`);
      setItems((prev) => prev.filter((i) => i.id !== id));
      showToast('تم حذف ولي الأمر بنجاح', 'success');
    } catch (err) {
      showToast('فشل حذف ولي الأمر: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  const handleOpenModal = (parent = null) => {
    if (parent) {
      setEditing(parent);
      setForm({
        firstName: parent.user?.firstName || '',
        lastName: parent.user?.lastName || '',
        username: parent.user?.username || '',
        email: parent.user?.email || '',
        phone: parent.user?.phone || '',
        password: '',
        occupation: parent.occupation || '',
        address: parent.address || '',
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
        occupation: '',
        address: '',
      });
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) {
      showToast('الرجاء إدخال الاسم الأول والاسم الأخير', 'warning');
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
        occupation: form.occupation.trim() || '',
        address: form.address.trim() || '',
      };

      if (editing) {
        await api.put(`/parents/${editing.id}`, payload);
        showToast('تم تحديث بيانات ولي الأمر بنجاح ✨', 'success');
      } else {
        await api.post('/parents', payload);
        showToast('تمت إضافة ولي الأمر بنجاح 🎉', 'success');
      }

      setShowModal(false);
      setEditing(null);
      await loadItems();
    } catch (err) {
      showToast('فشل حفظ ولي الأمر: ' + (err.response?.data?.message || err.message || 'خطأ أثناء الاتصال'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const exportCSV = () => {
    if (items.length === 0) {
      showToast('لا توجد بيانات للتصدير', 'warning');
      return;
    }
    const headers = ['#', 'الاسم', 'اسم المستخدم', 'البريد', 'الهاتف', 'المهنة', 'العنوان', 'عدد الأبناء'];
    const rows = filtered.map((p, idx) => [
      idx + 1,
      `${p.user?.firstName || ''} ${p.user?.lastName || ''}`.trim(),
      p.user?.username || '',
      p.user?.email || '',
      p.user?.phone || '',
      p.occupation || '',
      p.address || '',
      p.children?.length || 0,
    ]);

    const csvContent = '\uFEFF' + [headers, ...rows].map((e) => e.map((val) => `"${val}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `parents_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('تم تصدير ملف أولياء الأمور بنجاح', 'success');
  };

  const filtered = (Array.isArray(items) ? items : []).filter((i) => {
    if (!i) return false;
    const name = `${i.user?.firstName || ''} ${i.user?.lastName || ''}`.toLowerCase();
    const email = (i.user?.email || '').toLowerCase();
    const username = (i.user?.username || '').toLowerCase();
    return name.includes(search.toLowerCase()) || email.includes(search.toLowerCase()) || username.includes(search.toLowerCase());
  });

  return (
    <div className="crud-page animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">أولياء الأمور</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            بيانات أولياء الأمور والتواصل مع الأسر ومتابعة الأبناء
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-ghost" 
            onClick={loadItems} 
            disabled={loading}
            title="تحديث البيانات"
          >
            <RefreshCw size={18} className={loading ? 'spinning' : ''} /> تحديث
          </button>
          <button className="btn btn-ghost" onClick={exportCSV}>
            <Download size={18} /> تصدير Excel/CSV
          </button>
          <button className="btn btn-primary" onClick={() => handleOpenModal(null)}>
            <Plus size={18} /> إضافة ولي أمر
          </button>
        </div>
      </div>

      <div className="crud-toolbar glass-panel" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: '240px' }}>
          <Search size={18} />
          <input
            className="input-field"
            placeholder="البحث بالاسم أو البريد أو اسم المستخدم..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="result-count badge badge-primary">{filtered.length} ولي أمر</span>
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
                  <th>الاسم الكامل</th>
                  <th>معرف الدخول</th>
                  <th>الهاتف</th>
                  <th>المهنة</th>
                  <th>العنوان</th>
                  <th>الأبناء</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => {
                  const fullName = `${item.user?.firstName || ''} ${item.user?.lastName || ''}`.trim() || 'ولي أمر';
                  return (
                    <tr key={item.id}>
                      <td>{idx + 1}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
                            {item.user?.firstName?.charAt(0) || 'و'}
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
                      <td>{item.user?.phone || '—'}</td>
                      <td>{item.occupation || '—'}</td>
                      <td>{item.address || '—'}</td>
                      <td>
                        {item.children && item.children.length > 0 ? (
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {item.children.map((c) => (
                              <span key={c.id} className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                                {c.user?.firstName} {c.user?.lastName}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
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
              <Baby size={48} />
              <p>لا يوجد أولياء أمور مسجلين</p>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <h2>{editing ? 'تعديل بيانات ولي أمر' : 'إضافة ولي أمر جديد'}</h2>
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
                    placeholder="مثال: خالد"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>الاسم الأخير *</label>
                  <input
                    className="input-field"
                    placeholder="مثال: العتيبي"
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
                    placeholder={editing ? '••••••••' : 'افتراضي: parent123'}
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
                    placeholder="parent@school.com"
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
                  <label>المهنة</label>
                  <input
                    className="input-field"
                    placeholder="مثال: مهندس برمجيات"
                    value={form.occupation}
                    onChange={(e) => setForm({ ...form, occupation: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>العنوان</label>
                  <input
                    className="input-field"
                    placeholder="المدينة، الحي"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: '16px' }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'جاري الحفظ...' : editing ? 'حفظ التعديلات' : 'إضافة ولي الأمر'}
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

export default ParentsPage;

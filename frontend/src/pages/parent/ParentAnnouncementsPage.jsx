import { useState, useEffect } from 'react';
import { Megaphone, RefreshCw } from 'lucide-react';
import api from '../../api/axios';
import '../admin/CrudPage.css';

const ParentAnnouncementsPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadItems(); }, []);

  const loadItems = async () => {
    setLoading(true);
    try { const res = await api.get('/announcements/role/PARENT'); setItems(res.data); }
    catch {
      setItems([
        { id: 1, title: 'اجتماع أولياء الأمور', content: 'سيتم عقد اجتماع أولياء الأمور يوم الثلاثاء القادم الساعة 4 مساءً في القاعة الرئيسية. نرجو الحضور.', datePosted: '2025-06-05T14:30:00' },
        { id: 2, title: 'تقارير نهاية الفصل', content: 'سيتم إرسال تقارير نهاية الفصل الدراسي عبر البريد الإلكتروني خلال الأسبوع القادم.', datePosted: '2025-06-10T10:00:00' },
        { id: 3, title: 'إجازة منتصف العام', content: 'تبدأ إجازة منتصف العام الدراسي من يوم الخميس الموافق 15 يونيو وتنتهي يوم 1 يوليو.', datePosted: '2025-06-12T08:00:00' },
      ]);
    }
    setLoading(false);
  };

  return (
    <div className="crud-page animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">الإعلانات</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            التعاميم والأخبار والتنبيهات الموجهة لأولياء الأمور
          </p>
        </div>
        <button 
          className="btn btn-ghost" 
          onClick={loadItems} 
          disabled={loading}
          title="تحديث البيانات"
        >
          <RefreshCw size={18} className={loading ? 'spinning' : ''} /> تحديث
        </button>
      </div>

      {loading ? <div className="spinner"></div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          {items.map(item => (
            <div key={item.id} className="glass-panel" style={{ padding: 'var(--spacing-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-md)' }}>
                <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Megaphone size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 'var(--spacing-xs)' }}>{item.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7 }}>{item.content}</p>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 'var(--spacing-sm)', display: 'block' }}>
                    {item.datePosted ? new Date(item.datePosted).toLocaleDateString('ar-EG-u-nu-latn', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="glass-panel empty-state"><Megaphone size={48} /><p>لا توجد إعلانات حالياً</p></div>}
        </div>
      )}
    </div>
  );
};

export default ParentAnnouncementsPage;

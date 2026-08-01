import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Users, ClipboardList, UserCheck, BookOpen } from 'lucide-react';
import api from '../../api/axios';
import '../admin/CrudPage.css';

const ChildrenPage = () => {
  const { user } = useAuth();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState(null);
  const [grades, setGrades] = useState([]);

  useEffect(() => { loadChildren(); }, []);

  const loadChildren = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/parents/${user.id}/children`);
      setChildren(res.data);
    } catch {
      setChildren([
        { id: 1, user: { firstName: 'أحمد', lastName: 'خالد' }, schoolClass: { name: 'الصف الأول', section: 'أ' }, status: 'نشط' },
        { id: 2, user: { firstName: 'سارة', lastName: 'خالد' }, schoolClass: { name: 'الصف الثالث', section: 'ب' }, status: 'نشط' },
      ]);
    }
    setLoading(false);
  };

  const viewGrades = async (childId) => {
    setSelectedChild(childId);
    try {
      const res = await api.get(`/grades/student/${childId}`);
      setGrades(res.data);
    } catch {
      setGrades([
        { id: 1, subject: { name: 'الرياضيات' }, examType: 'اختبار نهائي', score: 92, comments: 'ممتاز' },
        { id: 2, subject: { name: 'العلوم' }, examType: 'اختبار شهري', score: 85, comments: 'جيد جداً' },
        { id: 3, subject: { name: 'اللغة العربية' }, examType: 'واجب', score: 78, comments: 'جيد' },
      ]);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'var(--success)';
    if (score >= 70) return 'var(--primary)';
    if (score >= 50) return 'var(--warning)';
    return 'var(--danger)';
  };

  return (
    <div className="crud-page animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">أبنائي</h1>
      </div>

      {loading ? <div className="spinner"></div> : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-xl)' }}>
            {children.map(child => (
              <div key={child.id} className="glass-panel" style={{ padding: 'var(--spacing-lg)', cursor: 'pointer', border: selectedChild === child.id ? '1px solid var(--primary)' : '1px solid var(--border-color)' }} onClick={() => viewGrades(child.id)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-full)', background: 'linear-gradient(135deg, var(--primary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>
                    {child.user?.firstName?.charAt(0)}
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>{child.user?.firstName} {child.user?.lastName}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{child.schoolClass ? `${child.schoolClass.name} - ${child.schoolClass.section}` : ''}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-md)' }}>
                  <span className="badge badge-success">{child.status || 'نشط'}</span>
                </div>
              </div>
            ))}
          </div>

          {selectedChild && (
            <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: 'var(--spacing-lg)', borderBottom: '1px solid var(--border-color)' }}>
                <h2 style={{ fontWeight: 700, fontSize: '1.1rem' }}>📊 درجات الطالب</h2>
              </div>
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead><tr><th>المادة</th><th>نوع الاختبار</th><th>الدرجة</th><th>ملاحظات</th></tr></thead>
                  <tbody>
                    {grades.map(g => (
                      <tr key={g.id}>
                        <td style={{ fontWeight: 600 }}>{g.subject?.name}</td>
                        <td><span className="badge badge-primary">{g.examType}</span></td>
                        <td><span style={{ fontWeight: 700, color: getScoreColor(g.score), fontSize: '1.1rem' }}>{g.score}</span></td>
                        <td>{g.comments || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {grades.length === 0 && <div className="empty-state"><ClipboardList size={48} /><p>لا توجد درجات</p></div>}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ChildrenPage;

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Users, ClipboardList, UserCheck, BookOpen, Calendar, ChevronDown } from 'lucide-react';
import api from '../../api/axios';
import '../admin/CrudPage.css';

const ChildrenPage = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState(null);
  const [activeTab, setActiveTab] = useState('grades');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/parents/my-dashboard');
      setDashboard(res.data);
      if (res.data.children?.length > 0) {
        setSelectedChild(res.data.children[0]);
      }
    } catch {
      setDashboard({ children: [] });
    }
    setLoading(false);
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'var(--success)';
    if (score >= 70) return 'var(--primary)';
    if (score >= 50) return '#f59e0b';
    return 'var(--danger)';
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'present' || s === 'حاضر') return { class: 'badge-success', text: status };
    if (s === 'absent' || s === 'غائب') return { class: 'badge-danger', text: status };
    if (s === 'late' || s === 'متأخر') return { class: 'badge-warning', text: status };
    return { class: 'badge-primary', text: status };
  };

  const children = dashboard?.children || [];

  return (
    <div className="crud-page animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">أبنائي</h1>
      </div>

      {loading ? <div className="spinner"></div> : (
        <>
          {/* Children Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-xl)' }}>
            {children.map(child => (
              <div
                key={child.id}
                className="glass-panel"
                style={{
                  padding: 'var(--spacing-lg)',
                  cursor: 'pointer',
                  border: selectedChild?.id === child.id ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => { setSelectedChild(child); setActiveTab('grades'); }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-full)', background: 'linear-gradient(135deg, var(--primary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '1.1rem' }}>
                    {child.firstName?.charAt(0)}
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>{child.firstName} {child.lastName}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {child.schoolClass ? `${child.schoolClass.name} - ${child.schoolClass.section}` : 'غير محدد'}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-md)', flexWrap: 'wrap' }}>
                  <span className="badge badge-success">{child.status || 'نشط'}</span>
                  <span className="badge badge-primary">{child.grades?.length || 0} درجة</span>
                  <span className="badge badge-accent">{child.attendance?.length || 0} سجل حضور</span>
                </div>
              </div>
            ))}
            {children.length === 0 && (
              <div className="glass-panel empty-state" style={{ padding: 'var(--spacing-xl)', gridColumn: '1 / -1' }}>
                <Users size={48} />
                <p>لا يوجد أبناء مسجلين</p>
              </div>
            )}
          </div>

          {/* Selected Child Details */}
          {selectedChild && (
            <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Child Info Header */}
              <div style={{ padding: 'var(--spacing-lg)', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-full)', background: 'linear-gradient(135deg, var(--primary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>
                    {selectedChild.firstName?.charAt(0)}
                  </div>
                  <div>
                    <h2 style={{ fontWeight: 700, fontSize: '1.1rem' }}>{selectedChild.firstName} {selectedChild.lastName}</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {selectedChild.schoolClass ? `${selectedChild.schoolClass.name} - ${selectedChild.schoolClass.section}` : ''}
                      {selectedChild.email ? ` | ${selectedChild.email}` : ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', padding: '0 var(--spacing-lg)' }}>
                {[
                  { id: 'grades', icon: ClipboardList, label: 'الدرجات' },
                  { id: 'attendance', icon: UserCheck, label: 'الحضور والغياب' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: 'var(--spacing-md) var(--spacing-lg)',
                      border: 'none', background: 'none', cursor: 'pointer',
                      color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                      borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                      fontWeight: activeTab === tab.id ? 700 : 400,
                      fontSize: '0.9rem', transition: 'all 0.2s ease'
                    }}
                  >
                    <tab.icon size={16} />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Grades Tab */}
              {activeTab === 'grades' && (
                <div>
                  {selectedChild.grades?.length > 0 ? (
                    <div className="data-table-wrapper">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>المادة</th>
                            <th>نوع الاختبار</th>
                            <th>الدرجة</th>
                            <th>ملاحظات</th>
                            <th>التاريخ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedChild.grades.map((g, idx) => (
                            <tr key={g.id || idx}>
                              <td>{idx + 1}</td>
                              <td style={{ fontWeight: 600 }}>{g.subjectName}</td>
                              <td><span className="badge badge-primary">{g.examType}</span></td>
                              <td>
                                <span style={{ fontWeight: 700, color: getScoreColor(g.score), fontSize: '1.1rem' }}>
                                  {g.score}
                                </span>
                              </td>
                              <td>{g.comments || '—'}</td>
                              <td>{g.recordedDate ? new Date(g.recordedDate).toLocaleDateString('ar-EG-u-nu-latn') : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="empty-state" style={{ padding: 'var(--spacing-xl)' }}>
                      <ClipboardList size={48} />
                      <p>لا توجد درجات مسجلة</p>
                    </div>
                  )}

                  {/* Grade Summary */}
                  {selectedChild.grades?.length > 0 && (
                    <div style={{ padding: 'var(--spacing-lg)', borderTop: '1px solid var(--border-color)', display: 'flex', gap: 'var(--spacing-xl)', flexWrap: 'wrap' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>إجمالي الدرجات</span>
                        <p style={{ fontWeight: 700, fontSize: '1.2rem' }}>{selectedChild.grades.length}</p>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>المتوسط</span>
                        <p style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--primary)' }}>
                          {(selectedChild.grades.reduce((sum, g) => sum + (g.score || 0), 0) / selectedChild.grades.length).toFixed(1)}
                        </p>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>أعلى درجة</span>
                        <p style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--success)' }}>
                          {Math.max(...selectedChild.grades.map(g => g.score || 0))}
                        </p>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>أدنى درجة</span>
                        <p style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--danger)' }}>
                          {Math.min(...selectedChild.grades.map(g => g.score || 0))}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Attendance Tab */}
              {activeTab === 'attendance' && (
                <div>
                  {selectedChild.attendance?.length > 0 ? (
                    <>
                      {/* Attendance Summary */}
                      <div style={{ padding: 'var(--spacing-lg)', display: 'flex', gap: 'var(--spacing-xl)', flexWrap: 'wrap', borderBottom: '1px solid var(--border-color)' }}>
                        <div>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>إجمالي السجلات</span>
                          <p style={{ fontWeight: 700, fontSize: '1.2rem' }}>{selectedChild.attendance.length}</p>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>حاضر</span>
                          <p style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--success)' }}>
                            {selectedChild.attendance.filter(a => a.status === 'Present' || a.status === 'حاضر').length}
                          </p>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>غائب</span>
                          <p style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--danger)' }}>
                            {selectedChild.attendance.filter(a => a.status === 'Absent' || a.status === 'غائب').length}
                          </p>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>متأخر</span>
                          <p style={{ fontWeight: 700, fontSize: '1.2rem', color: '#f59e0b' }}>
                            {selectedChild.attendance.filter(a => a.status === 'Late' || a.status === 'متأخر').length}
                          </p>
                        </div>
                      </div>

                      <div className="data-table-wrapper">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>التاريخ</th>
                              <th>الحالة</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedChild.attendance.map((a, idx) => {
                              const badge = getStatusBadge(a.status);
                              return (
                                <tr key={a.id || idx}>
                                  <td>{idx + 1}</td>
                                  <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <Calendar size={14} color="var(--text-muted)" />
                                      {a.date ? new Date(a.date).toLocaleDateString('ar-EG-u-nu-latn', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                                    </div>
                                  </td>
                                  <td>
                                    <span className={`badge ${badge.class}`}>{badge.text}</span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <div className="empty-state" style={{ padding: 'var(--spacing-xl)' }}>
                      <UserCheck size={48} />
                      <p>لا توجد سجلات حضور</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ChildrenPage;

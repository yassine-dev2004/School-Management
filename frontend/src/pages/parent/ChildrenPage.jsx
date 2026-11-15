import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Users, ClipboardList, UserCheck, BookOpen, Calendar,
  CreditCard, BookCheck, CheckCircle2, AlertCircle, Clock,
  RefreshCw, DollarSign
} from 'lucide-react';
import api from '../../api/axios';
import { formatDateSafe } from '../../utils/dateUtils';
import '../admin/CrudPage.css';

const ChildrenPage = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState(null);
  const [activeTab, setActiveTab] = useState('lessons'); // Default to daily lessons

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
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">متابعة أبنائي (الدروس، الرسوم، الدرجات والحضور)</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            متابعة شاملة ويومية في مدرسة ابن خلدون: ما درسه ابنك اليوم، مستحقات الرسوم، والحضور
          </p>
        </div>
        <button 
          className="btn btn-ghost" 
          onClick={loadData} 
          disabled={loading}
          title="تحديث البيانات"
        >
          <RefreshCw size={18} className={loading ? 'spinning' : ''} /> تحديث
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="spinner"></div>
        </div>
      ) : (
        <>
          {/* Children Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-xl)' }}>
            {children.map(child => {
              const tuition = child.tuitionSummary || {};
              const missing = tuition.missingAmount != null ? tuition.missingAmount : 0;
              const isPaid = tuition.yearStatus === 'PAID';

              return (
                <div
                  key={child.id}
                  className="glass-panel"
                  style={{
                    padding: 'var(--spacing-lg)',
                    cursor: 'pointer',
                    border: selectedChild?.id === child.id ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => { setSelectedChild(child); }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-full)', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '1.1rem' }}>
                      {child.firstName?.charAt(0)}
                    </div>
                    <div>
                      <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>{child.firstName} {child.lastName}</h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {child.schoolClass ? `${child.schoolClass.name} - ${child.schoolClass.section}` : 'غير محدد'}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-md)', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span className="badge badge-success">{child.status || 'نشط'}</span>
                    <span className={isPaid ? 'badge badge-success' : missing > 0 ? 'badge badge-danger' : 'badge badge-warning'}>
                      {isPaid ? 'الرسوم خالصة' : `متبقي للدفع: ${missing} د.ت`}
                    </span>
                    <span className="badge badge-primary">{child.todayLessons?.length || 0} درس اليوم</span>
                  </div>
                </div>
              );
            })}
            {children.length === 0 && (
              <div className="glass-panel empty-state" style={{ padding: 'var(--spacing-xl)', gridColumn: '1 / -1' }}>
                <Users size={48} />
                <p>لا يوجد أبناء مسجلين بحسابك</p>
              </div>
            )}
          </div>

          {/* Selected Child Details */}
          {selectedChild && (
            <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Child Info Header */}
              <div style={{ padding: 'var(--spacing-lg)', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-full)', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>
                      {selectedChild.firstName?.charAt(0)}
                    </div>
                    <div>
                      <h2 style={{ fontWeight: 800, fontSize: '1.15rem' }}>{selectedChild.firstName} {selectedChild.lastName}</h2>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        الفصل: <strong>{selectedChild.schoolClass ? `${selectedChild.schoolClass.name} (${selectedChild.schoolClass.section})` : 'غير معين'}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Quick Tuition Badge in Header */}
                  {selectedChild.tuitionSummary && (
                    <div style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      background: selectedChild.tuitionSummary.missingAmount > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                      border: selectedChild.tuitionSummary.missingAmount > 0 ? '1px solid #ef4444' : '1px solid #10b981',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.9rem'
                    }}>
                      <CreditCard size={18} color={selectedChild.tuitionSummary.missingAmount > 0 ? '#ef4444' : '#10b981'} />
                      <span>
                        المتبقي من الرسوم السنوية: <strong style={{ color: selectedChild.tuitionSummary.missingAmount > 0 ? '#ef4444' : '#10b981' }}>{selectedChild.tuitionSummary.missingAmount} د.ت</strong>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', padding: '0 var(--spacing-lg)', overflowX: 'auto' }}>
                {[
                  { id: 'lessons', icon: BookCheck, label: 'ما تم تدريسه (كراس الدروس)' },
                  { id: 'tuition', icon: CreditCard, label: 'الرسوم والأقساط' },
                  { id: 'grades', icon: ClipboardList, label: 'الدرجات والتقييم' },
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
                      fontSize: '0.9rem', transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <tab.icon size={16} />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* TAB 1: DAILY LESSON LOGBOOK */}
              {activeTab === 'lessons' && (
                <div style={{ padding: 'var(--spacing-lg)' }}>
                  <h3 style={{ fontSize: '1.05rem', marginBottom: '14px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BookCheck size={20} color="var(--primary)" />
                    ما درسه ابنك اليوم وفي الأيام الأخيرة (Cahier de Texte)
                  </h3>

                  {(!selectedChild.recentLessons || selectedChild.recentLessons.length === 0) ? (
                    <div className="empty-state" style={{ padding: '2.5rem' }}>
                      <BookOpen size={48} style={{ opacity: 0.4 }} />
                      <p>لم يتم تسجيل دروس حديثة لهذا الفصل بعد</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {selectedChild.recentLessons.map((l) => (
                        <div key={l.id} className="glass-panel" style={{ padding: '16px', borderRight: '4px solid var(--primary)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                            <div>
                              <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-main)', fontWeight: 700 }}>
                                {l.title}
                              </h4>
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px', flexWrap: 'wrap' }}>
                                {l.subject && <span className="badge badge-primary">{l.subject.name}</span>}
                                {l.period && <span className="badge badge-secondary">{l.period}</span>}
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                  📅 {l.logDate}
                                </span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                  👨‍🏫 الأستاذ: {l.teacherName || l.teacher?.user?.firstName || 'المعلم'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div style={{ marginTop: '12px', padding: '10px 12px', background: 'var(--surface)', borderRadius: '8px', lineHeight: '1.5' }}>
                            <strong style={{ color: 'var(--primary)', display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>
                              المحتوى الذي تم تدريسه في الفصل:
                            </strong>
                            {l.summary}
                          </div>

                          {l.homeworkAssigned && (
                            <div style={{ marginTop: '8px', padding: '8px 12px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '6px', fontSize: '0.9rem', color: '#d97706' }}>
                              <strong>العمل المنزلي المطلوب:</strong> {l.homeworkAssigned}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: TUITION AND PAYMENTS */}
              {activeTab === 'tuition' && (
                <div style={{ padding: 'var(--spacing-lg)' }}>
                  {selectedChild.tuitionSummary ? (
                    <div>
                      {/* Financial KPI */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '12px',
                        marginBottom: '20px'
                      }}>
                        <div className="glass-panel" style={{ padding: '14px', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>الرسوم الدراسية السنوية</span>
                          <p style={{ fontWeight: 800, fontSize: '1.3rem', marginTop: '4px' }}>
                            {selectedChild.tuitionSummary.annualFee} د.ت
                          </p>
                        </div>

                        <div className="glass-panel" style={{ padding: '14px', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>إجمالي ما تم دفعه</span>
                          <p style={{ fontWeight: 800, fontSize: '1.3rem', color: '#10b981', marginTop: '4px' }}>
                            {selectedChild.tuitionSummary.totalPaid} د.ت
                          </p>
                        </div>

                        <div className="glass-panel" style={{ padding: '14px', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 600 }}>المتبقي في الذمة للدفع</span>
                          <p style={{ fontWeight: 800, fontSize: '1.3rem', color: '#ef4444', marginTop: '4px' }}>
                            {selectedChild.tuitionSummary.missingAmount} د.ت
                          </p>
                        </div>

                        <div className="glass-panel" style={{ padding: '14px', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>الحالة العامة للسنة</span>
                          <p style={{ marginTop: '6px' }}>
                            {selectedChild.tuitionSummary.yearStatus === 'PAID' ? (
                              <span className="badge badge-success" style={{ fontSize: '0.9rem' }}>خالص بالكامل 🎉</span>
                            ) : selectedChild.tuitionSummary.yearStatus === 'PARTIAL' ? (
                              <span className="badge badge-warning" style={{ fontSize: '0.9rem' }}>تسديد جزئي ⏳</span>
                            ) : (
                              <span className="badge badge-danger" style={{ fontSize: '0.9rem' }}>غير خالص ⚠️</span>
                            )}
                          </p>
                        </div>
                      </div>

                      <h4 style={{ margin: '14px 0 8px 0', fontSize: '0.95rem' }}>جدول الأشهر الدراسية العشرة</h4>
                      <div className="data-table-wrapper">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>الشهر الدراسي</th>
                              <th>المبلغ التقديري</th>
                              <th>المبلغ المسدد</th>
                              <th>الحالة</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedChild.tuitionSummary.monthlyBreakdown?.map((m) => (
                              <tr key={m.month}>
                                <td style={{ fontWeight: 600 }}>{m.monthName}</td>
                                <td>{m.expectedAmount} د.ت</td>
                                <td style={{ color: m.paidAmount > 0 ? '#10b981' : 'inherit', fontWeight: 600 }}>
                                  {m.paidAmount} د.ت
                                </td>
                                <td>
                                  {m.isPaid ? (
                                    <span className="badge badge-success">خالص</span>
                                  ) : m.isPartial ? (
                                    <span className="badge badge-warning">دفع جزئي</span>
                                  ) : (
                                    <span className="badge badge-danger">غير مسدد</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="empty-state" style={{ padding: '2rem' }}>
                      <CreditCard size={48} />
                      <p>بيانات الرسوم غير متوفرة حالياً</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: GRADES */}
              {activeTab === 'grades' && (
                <div>
                  {selectedChild.grades?.length > 0 ? (
                    <div className="data-table-wrapper">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>المادة</th>
                            <th>الثلاثي</th>
                            <th>نوع التقييم</th>
                            <th>العدد المسند</th>
                            <th>ملاحظات</th>
                            <th>تاريخ التقييم</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedChild.grades.map((g, idx) => (
                            <tr key={g.id || idx}>
                              <td>{idx + 1}</td>
                              <td style={{ fontWeight: 600 }}>{g.subjectName}</td>
                              <td><span className="badge badge-primary">{g.term || 'الثلاثي الأول'}</span></td>
                              <td><span className="badge badge-accent">{g.examType}</span></td>
                              <td>
                                <span style={{ fontWeight: 700, color: getScoreColor(g.score), fontSize: '1.1rem' }}>
                                  {g.score} <small style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>/ {g.maxScore || 20}</small>
                                </span>
                              </td>
                              <td>{g.comments || '—'}</td>
                              <td>{formatDateSafe(g.recordedDate, { year: 'numeric', month: 'short', day: 'numeric' })}</td>
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
                </div>
              )}

              {/* TAB 4: ATTENDANCE */}
              {activeTab === 'attendance' && (
                <div>
                  {selectedChild.attendance?.length > 0 ? (
                    <div className="data-table-wrapper">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>التاريخ</th>
                            <th>الحالة</th>
                            <th>ملاحظات / تبرير</th>
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
                                    {formatDateSafe(a.date)}
                                  </div>
                                </td>
                                <td>
                                  <span className={`badge ${badge.class}`}>{badge.text}</span>
                                </td>
                                <td>
                                  <span style={{ color: a.remarks ? 'var(--text-main)' : 'var(--text-muted)', fontSize: '0.9rem' }}>
                                    {a.remarks || '—'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
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

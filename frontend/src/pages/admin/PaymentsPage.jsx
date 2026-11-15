import { useState, useEffect, useMemo } from 'react';
import {
  CreditCard, Search, Plus, Filter, CheckCircle2, AlertCircle, Clock,
  Calendar, User, School, Download, RefreshCw, X, Receipt, DollarSign
} from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import './CrudPage.css';

const MONTH_NAMES = {
  SEPTEMBER: 'سبتمبر',
  OCTOBER: 'أكتوبر',
  NOVEMBER: 'نوفمبر',
  DECEMBER: 'ديسمبر',
  JANUARY: 'جانفي',
  FEBRUARY: 'فيفري',
  MARCH: 'مارس',
  APRIL: 'أفريل',
  MAY: 'ماي',
  JUNE: 'جوان',
};

const ACADEMIC_MONTHS = [
  'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE'
];

const PaymentsPage = () => {
  const { showToast } = useToast();
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [academicYear, setAcademicYear] = useState('2025-2026');

  // Modal State for adding/updating a payment
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    academicYear: '2025-2026',
    month: 'SEPTEMBER',
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'نقداً (Cash)',
    receiptNumber: '',
    status: 'PAID',
    notes: '',
  });
  const [savingPayment, setSavingPayment] = useState(false);

  // Student summary detail modal
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    loadData();
  }, [academicYear]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [stuRes, clsRes] = await Promise.all([
        api.get('/students'),
        api.get('/classes'),
      ]);
      const stuList = Array.isArray(stuRes.data) ? stuRes.data : [];
      setClasses(Array.isArray(clsRes.data) ? clsRes.data : []);

      // Fetch tuition summaries for each student
      const studentsWithSummaries = await Promise.all(
        stuList.map(async (st) => {
          try {
            const sumRes = await api.get(`/payments/student/${st.id}/summary?academicYear=${academicYear}`);
            return { ...st, tuition: sumRes.data };
          } catch {
            return {
              ...st,
              tuition: {
                annualFee: st.schoolClass?.annualFee || 1200,
                totalPaid: 0,
                missingAmount: st.schoolClass?.annualFee || 1200,
                yearStatus: 'UNPAID',
                monthlyBreakdown: [],
              },
            };
          }
        })
      );
      setStudents(studentsWithSummaries);
    } catch {
      showToast('فشل تحميل بيانات الطلاب والأقساط', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPaymentModal = (st, defaultMonth = 'SEPTEMBER') => {
    setSelectedStudent(st);
    const standardMonthly = st.schoolClass?.annualFee ? Math.round(st.schoolClass.annualFee / 10) : 120;
    setPaymentForm({
      academicYear: academicYear,
      month: defaultMonth,
      amount: standardMonthly.toString(),
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'نقداً (Cash)',
      receiptNumber: `REC-${Date.now().toString().slice(-6)}`,
      status: 'PAID',
      notes: '',
    });
    setShowPaymentModal(true);
  };

  const handleSavePayment = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    if (!paymentForm.amount || Number(paymentForm.amount) <= 0) {
      showToast('الرجاء إدخال مبلغ صحيح', 'warning');
      return;
    }

    setSavingPayment(true);
    try {
      await api.post('/payments', {
        studentId: selectedStudent.id,
        student: { id: selectedStudent.id },
        academicYear: paymentForm.academicYear,
        month: paymentForm.month,
        amount: Number(paymentForm.amount),
        paymentDate: paymentForm.paymentDate,
        paymentMethod: paymentForm.paymentMethod,
        receiptNumber: paymentForm.receiptNumber,
        status: paymentForm.status,
        notes: paymentForm.notes,
      });

      showToast(`تم تسجيل دفعة ${selectedStudent.user?.firstName || ''} بنجاح 🎉`, 'success');
      setShowPaymentModal(false);
      await loadData();
    } catch (err) {
      showToast('فشل تسجيل الدفعة: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setSavingPayment(false);
    }
  };

  const handleQuickStatus = async (st, targetStatus) => {
    const isPaid = targetStatus === 'PAID';
    const stName = `${st.user?.firstName || ''} ${st.user?.lastName || ''}`.trim();
    const msg = isPaid
      ? `هل تريد تأكيد خلاص السنة الدراسية ${academicYear} بالكامل للطالب "${stName}" وتسوية المتبقي كخالص؟`
      : `هل تريد تغيير حالة السنة للطالب "${stName}" إلى غير خالص؟`;

    if (!window.confirm(msg)) return;

    try {
      await api.post(`/payments/student/${st.id}/quick-status`, {
        academicYear,
        status: targetStatus,
      });
      showToast(isPaid ? 'تم تسجيل خلاص السنة بالكامل للطالب بنجاح 🎉' : 'تم تحديث الحالة إلى غير خالص', 'success');
      await loadData();
    } catch (err) {
      showToast('فشل تحديث الحالة: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  const handleOpenSummary = async (st) => {
    setSelectedStudent(st);
    setLoadingSummary(true);
    setShowSummaryModal(true);
    try {
      const res = await api.get(`/payments/student/${st.id}/summary?academicYear=${academicYear}`);
      setSummaryData(res.data);
    } catch {
      showToast('تعذر تحميل كشف حساب الطالب', 'error');
    } finally {
      setLoadingSummary(false);
    }
  };

  // Filtered List
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const fullName = `${s.user?.firstName || ''} ${s.user?.lastName || ''}`.toLowerCase();
      const code = (s.studentCode || '').toLowerCase();
      const matchSearch = !search || fullName.includes(search.toLowerCase()) || code.includes(search.toLowerCase());
      const matchClass = !classFilter || String(s.schoolClass?.id) === String(classFilter);
      const matchStatus = statusFilter === 'ALL' || s.tuition?.yearStatus === statusFilter;
      return matchSearch && matchClass && matchStatus;
    });
  }, [students, search, classFilter, statusFilter]);

  // Overall Financial Statistics
  const stats = useMemo(() => {
    let totalExpected = 0;
    let totalCollected = 0;
    let totalMissing = 0;
    let paidCount = 0;
    let partialCount = 0;
    let unpaidCount = 0;

    students.forEach((s) => {
      const fee = s.tuition?.annualFee || s.schoolClass?.annualFee || 1200;
      const paid = s.tuition?.totalPaid || 0;
      const missing = s.tuition?.missingAmount != null ? s.tuition.missingAmount : Math.max(0, fee - paid);
      totalExpected += fee;
      totalCollected += paid;
      totalMissing += missing;

      if (s.tuition?.yearStatus === 'PAID') paidCount++;
      else if (s.tuition?.yearStatus === 'PARTIAL') partialCount++;
      else unpaidCount++;
    });

    return { totalExpected, totalCollected, totalMissing, paidCount, partialCount, unpaidCount };
  }, [students]);

  const exportPaymentsCSV = () => {
    if (filteredStudents.length === 0) {
      showToast('لا توجد بيانات لتصديرها', 'warning');
      return;
    }
    const headers = ['#', 'اسم الطالب', 'الفصل', 'السنة الدراسية', 'الرسوم السنوية (د.ت)', 'المبلغ المدفوع (د.ت)', 'المتبقي (د.ت)', 'الحالة'];
    const rows = filteredStudents.map((s, idx) => [
      idx + 1,
      `${s.user?.firstName || ''} ${s.user?.lastName || ''}`,
      s.schoolClass?.name || 'غير مسكن',
      academicYear,
      s.tuition?.annualFee || 1200,
      s.tuition?.totalPaid || 0,
      s.tuition?.missingAmount || 0,
      s.tuition?.yearStatus === 'PAID' ? 'خالص' : s.tuition?.yearStatus === 'PARTIAL' ? 'دفع جزئي' : 'غير خالص',
    ]);
    const csvContent = '\uFEFF' + [headers, ...rows].map((e) => e.map((val) => `"${val}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payments_report_${academicYear}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('تم تصدير كشف الأقساط بنجاح', 'success');
  };

  return (
    <div className="crud-page animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">إدارة الأقساط والرسوم الدراسية</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
            متابعة حالة سداد كل طالب شهرياً وسنوياً واحتساب المبالغ المتبقية في مدرسة ابن خلدون
          </p>
        </div>
        <div className="page-header-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <select
            className="input-field"
            style={{ width: 'auto', fontWeight: 600, padding: '8px 12px' }}
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
          >
            <option value="2025-2026">السنة الدراسية 2025-2026</option>
            <option value="2024-2025">السنة الدراسية 2024-2025</option>
            <option value="2026-2027">السنة الدراسية 2026-2027</option>
          </select>
          <button className="btn btn-secondary" onClick={exportPaymentsCSV}>
            <Download size={16} /> تصدير Excel/CSV
          </button>
          <button className="btn btn-ghost" onClick={loadData} disabled={loading} title="تحديث">
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '20px'
      }}>
        <div className="glass-panel" style={{ padding: '16px', borderRight: '4px solid var(--primary)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>إجمالي الرسوم المستحقة</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
            {stats.totalExpected.toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>د.ت</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>{students.length} طالب مسجل</div>
        </div>

        <div className="glass-panel" style={{ padding: '16px', borderRight: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>إجمالي المداخيل المحصلة</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
            {stats.totalCollected.toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>د.ت</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>{stats.paidCount} طالب خالص كلياً</div>
        </div>

        <div className="glass-panel" style={{ padding: '16px', borderRight: '4px solid #ef4444' }}>
          <div style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 600 }}>المتبقي في ذمة الأولياء (المفقود)</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ef4444', marginTop: '4px' }}>
            {stats.totalMissing.toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>د.ت</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {stats.unpaidCount} غير خالص / {stats.partialCount} دفع جزئي
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="crud-toolbar glass-panel" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: '220px' }}>
          <Search size={18} />
          <input
            className="input-field"
            placeholder="البحث باسم الطالب أو المعرف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="input-field"
          style={{ width: 'auto', minWidth: '150px' }}
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
        >
          <option value="">جميع الفصول</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.name} {c.section ? `(${c.section})` : ''}</option>
          ))}
        </select>

        <select
          className="input-field"
          style={{ width: 'auto', minWidth: '140px' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">كل الحالات</option>
          <option value="PAID">خالص (Paid)</option>
          <option value="PARTIAL">دفع جزئي (Partial)</option>
          <option value="UNPAID">غير خالص (Unpaid)</option>
        </select>

        <span className="badge badge-primary">{filteredStudents.length} طالب</span>
      </div>

      {/* Main Table */}
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
                  <th>الطالب</th>
                  <th>الفصل الدراسي</th>
                  <th>الرسوم السنوية</th>
                  <th>المسدد</th>
                  <th>المتبقي للدفع</th>
                  <th>الحالة العامة</th>
                  <th>تتبع الأشهر (9 - 6)</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      لا توجد سجلات مطابقة للبحث
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((st, idx) => {
                    const tuition = st.tuition || {};
                    const fee = tuition.annualFee || st.schoolClass?.annualFee || 1200;
                    const paid = tuition.totalPaid || 0;
                    const missing = tuition.missingAmount != null ? tuition.missingAmount : Math.max(0, fee - paid);
                    const status = tuition.yearStatus || (missing <= 0 ? 'PAID' : paid > 0 ? 'PARTIAL' : 'UNPAID');

                    // Map breakdown for months
                    const breakdownMap = {};
                    (tuition.monthlyBreakdown || []).forEach((m) => {
                      breakdownMap[m.month] = m;
                    });

                    return (
                      <tr key={st.id}>
                        <td>{idx + 1}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: 'var(--primary-glow)',
                              color: 'var(--primary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.85rem'
                            }}>
                              {st.user?.firstName?.[0] || 'ط'}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                                {st.user?.firstName} {st.user?.lastName}
                              </div>
                              <small style={{ color: 'var(--text-muted)' }}>
                                كود: {st.studentCode || st.id}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-secondary">
                            {st.schoolClass?.name || 'غير مسكن'} {st.schoolClass?.section ? `(${st.schoolClass.section})` : ''}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{fee.toLocaleString()} د.ت</td>
                        <td style={{ color: '#10b981', fontWeight: 700 }}>
                          {paid.toLocaleString()} د.ت
                        </td>
                        <td>
                          <span style={{
                            color: missing > 0 ? '#ef4444' : '#10b981',
                            fontWeight: 800,
                            background: missing > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                            padding: '3px 8px',
                            borderRadius: '6px'
                          }}>
                            {missing.toLocaleString()} د.ت
                          </span>
                        </td>
                        <td>
                          {status === 'PAID' ? (
                            <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle2 size={13} /> خالص
                            </span>
                          ) : status === 'PARTIAL' ? (
                            <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={13} /> دفع جزئي
                            </span>
                          ) : (
                            <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <AlertCircle size={13} /> غير خالص
                            </span>
                          )}
                        </td>
                        <td>
                          {/* 10-month progress indicator */}
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxWidth: '240px' }}>
                            {ACADEMIC_MONTHS.map((m, mIdx) => {
                              const b = breakdownMap[m];
                              const isPaid = b?.isPaid;
                              const isPartial = b?.isPartial;
                              const label = (mIdx + 1) <= 4 ? (mIdx + 9) : (mIdx - 3); // 9,10,11,12,1,2,3,4,5,6
                              return (
                                <span
                                  key={m}
                                  title={`${MONTH_NAMES[m]}: ${isPaid ? 'خالص (' + b.paidAmount + ' د.ت)' : isPartial ? 'جزئي (' + b.paidAmount + ' د.ت)' : 'غير مسدد'}`}
                                  onClick={() => handleOpenPaymentModal(st, m)}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '20px',
                                    height: '20px',
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    color: '#fff',
                                    background: isPaid ? '#10b981' : isPartial ? '#f59e0b' : '#374151',
                                    border: isPaid ? '1px solid #059669' : '1px solid rgba(255,255,255,0.1)',
                                  }}
                                >
                                  {label}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <button
                              className={`btn btn-sm ${status === 'PAID' ? 'btn-ghost' : 'btn-primary'}`}
                              onClick={() => handleQuickStatus(st, status === 'PAID' ? 'UNPAID' : 'PAID')}
                              title={status === 'PAID' ? 'إعادة التعيين كغير خالص' : 'تسوية سريعة: تعيين السنة كاملة كخالص (100%)'}
                              style={{
                                background: status === 'PAID' ? 'rgba(239, 68, 68, 0.12)' : '#10b981',
                                color: status === 'PAID' ? '#ef4444' : '#ffffff',
                                border: status === 'PAID' ? '1px solid rgba(239, 68, 68, 0.3)' : 'none',
                                fontWeight: 700,
                                fontSize: '0.78rem',
                                padding: '4px 8px'
                              }}
                            >
                              {status === 'PAID' ? 'تعيين غير خالص' : '⚡ خلاص كامل'}
                            </button>
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => handleOpenPaymentModal(st)}
                              title="تسجيل دفعة شهرية"
                              style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                            >
                              <Plus size={13} /> دفعة
                            </button>
                            <button
                              className="btn btn-sm btn-ghost"
                              onClick={() => handleOpenSummary(st)}
                              title="كشف حساب مفصل"
                              style={{ padding: '4px 8px' }}
                            >
                              <Receipt size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Record Payment Modal */}
      {showPaymentModal && selectedStudent && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h2>تسجيل دفعة قسط دراسي</h2>
              <button className="btn-icon" onClick={() => setShowPaymentModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSavePayment} className="modal-form">
              <div style={{
                padding: '12px 14px',
                background: 'var(--bg-base, #f1f5f9)',
                borderRadius: '10px',
                border: '1px solid var(--border-color, #e2e8f0)',
                fontSize: '0.9rem',
                color: 'var(--text-main, #0f172a)'
              }}>
                <strong style={{ color: 'var(--primary)' }}>الطالب:</strong> {selectedStudent.user?.firstName} {selectedStudent.user?.lastName} | 
                <strong style={{ color: 'var(--primary)', marginRight: '8px' }}>الفصل:</strong> {selectedStudent.schoolClass?.name || 'غير معين'}
              </div>

              <div className="form-group">
                <label>السنة الدراسية</label>
                <input
                  className="input-field"
                  value={paymentForm.academicYear}
                  onChange={(e) => setPaymentForm({ ...paymentForm, academicYear: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>الشهر الدراسي المستهدف</label>
                <select
                  className="input-field"
                  value={paymentForm.month}
                  onChange={(e) => setPaymentForm({ ...paymentForm, month: e.target.value })}
                >
                  {ACADEMIC_MONTHS.map((m) => (
                    <option key={m} value={m}>{MONTH_NAMES[m]}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>المبلغ المدفوع (دينار تونسي TND)</label>
                <input
                  type="number"
                  step="any"
                  min="1"
                  className="input-field"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>تاريخ السداد</label>
                <input
                  type="date"
                  className="input-field"
                  value={paymentForm.paymentDate}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>طريقة الدفع</label>
                <select
                  className="input-field"
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                >
                  <option value="نقداً (Cash)">نقداً (Cash)</option>
                  <option value="شيك بنكي (Chèque)">شيك بنكي (Chèque)</option>
                  <option value="تحويل بنكي (Virement)">تحويل بنكي (Virement)</option>
                  <option value="بطاقة بنكية (Carte)">بطاقة بنكية (Carte)</option>
                </select>
              </div>

              <div className="form-group">
                <label>رقم الوصل / الإيصال</label>
                <input
                  className="input-field"
                  value={paymentForm.receiptNumber}
                  onChange={(e) => setPaymentForm({ ...paymentForm, receiptNumber: e.target.value })}
                  placeholder="مثال: REC-00123"
                />
              </div>

              <div className="form-group">
                <label>حالة الدفعة الشهرية</label>
                <select
                  className="input-field"
                  value={paymentForm.status}
                  onChange={(e) => setPaymentForm({ ...paymentForm, status: e.target.value })}
                >
                  <option value="PAID">خالص بالكامل (Paid)</option>
                  <option value="PARTIAL">تسديد جزئي (Partial)</option>
                  <option value="UNPAID">غير مسدد (Unpaid)</option>
                </select>
              </div>

              <div className="form-group">
                <label>ملاحظات إضافية</label>
                <textarea
                  rows="2"
                  className="input-field"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  placeholder="أي توضيحات أو تفاصيل خاصة بالشيك أو القسط..."
                ></textarea>
              </div>

              <div className="modal-actions" style={{ marginTop: '16px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowPaymentModal(false)}>
                  إلغاء
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingPayment}>
                  {savingPayment ? 'جارٍ الحفظ...' : 'حفظ الدفعة وتحديث الرصيد'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Summary Detail Modal */}
      {showSummaryModal && selectedStudent && (
        <div className="modal-overlay" onClick={() => setShowSummaryModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h2>كشف الأقساط والرسوم للطالب: {selectedStudent.user?.firstName} {selectedStudent.user?.lastName}</h2>
              <button className="btn-icon" onClick={() => setShowSummaryModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {loadingSummary || !summaryData ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                  <div className="spinner"></div>
                </div>
              ) : (
                <>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '10px',
                    textAlign: 'center',
                  }}>
                    <div className="glass-panel" style={{ padding: '10px' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>الرسوم السنوية</div>
                      <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>{summaryData.annualFee} د.ت</div>
                    </div>
                    <div className="glass-panel" style={{ padding: '10px' }}>
                      <div style={{ fontSize: '0.8rem', color: '#10b981' }}>إجمالي المدفوع</div>
                      <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#10b981' }}>{summaryData.totalPaid} د.ت</div>
                    </div>
                    <div className="glass-panel" style={{ padding: '10px' }}>
                      <div style={{ fontSize: '0.8rem', color: '#ef4444' }}>المتبقي في الذمة</div>
                      <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#ef4444' }}>{summaryData.missingAmount} د.ت</div>
                    </div>
                  </div>

                  <h4 style={{ margin: '8px 0 4px 0', fontSize: '0.95rem' }}>جدول الأشهر الدراسية (السنة {academicYear})</h4>
                  <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                    <table className="data-table" style={{ fontSize: '0.85rem' }}>
                      <thead>
                        <tr>
                          <th>الشهر</th>
                          <th>المبلغ المقدر</th>
                          <th>المبلغ المدفوع</th>
                          <th>الحالة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summaryData.monthlyBreakdown?.map((m) => (
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

                  {summaryData.payments && summaryData.payments.length > 0 && (
                    <>
                      <h4 style={{ margin: '8px 0 4px 0', fontSize: '0.95rem' }}>سجل الإيصالات والدفعات المسجلة</h4>
                      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        <table className="data-table" style={{ fontSize: '0.8rem' }}>
                          <thead>
                            <tr>
                              <th>رقم الإيصال</th>
                              <th>التاريخ</th>
                              <th>الشهر</th>
                              <th>المبلغ</th>
                              <th>الطريقة</th>
                              <th>سجل بواسطة</th>
                            </tr>
                          </thead>
                          <tbody>
                            {summaryData.payments.map((p) => (
                              <tr key={p.id}>
                                <td><code>{p.receiptNumber || `REC-${p.id}`}</code></td>
                                <td>{p.paymentDate}</td>
                                <td>{MONTH_NAMES[p.month] || p.month}</td>
                                <td style={{ fontWeight: 700, color: '#10b981' }}>{p.amount} د.ت</td>
                                <td>{p.paymentMethod}</td>
                                <td>{p.recordedBy}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={() => setShowSummaryModal(false)}>
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsPage;

import { useState, useEffect } from 'react';
import { Search, UserCheck, UserX, Clock } from 'lucide-react';
import api from '../../api/axios';
import './CrudPage.css';

const AttendancePage = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => { loadRecords(); }, [selectedDate]);

  const loadRecords = async () => {
    setLoading(true);
    try { const res = await api.get(`/attendance/date/${selectedDate}`); setRecords(res.data); }
    catch {
      setRecords([
        { id: 1, student: { user: { firstName: 'أحمد', lastName: 'محمد' }, schoolClass: { name: 'الصف الأول', section: 'أ' } }, status: 'حاضر', date: selectedDate },
        { id: 2, student: { user: { firstName: 'فاطمة', lastName: 'علي' }, schoolClass: { name: 'الصف الثاني', section: 'ب' } }, status: 'غائب', date: selectedDate },
        { id: 3, student: { user: { firstName: 'عمر', lastName: 'خالد' }, schoolClass: { name: 'الصف الأول', section: 'أ' } }, status: 'متأخر', date: selectedDate },
        { id: 4, student: { user: { firstName: 'نورة', lastName: 'سعد' }, schoolClass: { name: 'الصف الثالث', section: 'أ' } }, status: 'حاضر', date: selectedDate },
      ]);
    }
    setLoading(false);
  };

  const getStatusBadge = (status) => {
    if (status === 'حاضر' || status === 'Present') return <span className="badge badge-success"><UserCheck size={12} /> حاضر</span>;
    if (status === 'غائب' || status === 'Absent') return <span className="badge badge-danger"><UserX size={12} /> غائب</span>;
    return <span className="badge badge-warning"><Clock size={12} /> متأخر</span>;
  };

  const stats = {
    present: records.filter(r => r.status === 'حاضر' || r.status === 'Present').length,
    absent: records.filter(r => r.status === 'غائب' || r.status === 'Absent').length,
    late: records.filter(r => r.status === 'متأخر' || r.status === 'Late').length,
  };

  return (
    <div className="crud-page animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">الحضور والغياب</h1>
      </div>

      <div className="crud-toolbar glass-panel">
        <div className="form-group" style={{ margin: 0 }}>
          <input type="date" className="input-field" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
          <span className="badge badge-success">حاضر: {stats.present}</span>
          <span className="badge badge-danger">غائب: {stats.absent}</span>
          <span className="badge badge-warning">متأخر: {stats.late}</span>
        </div>
      </div>

      {loading ? <div className="spinner"></div> : (
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead><tr><th>#</th><th>اسم الطالب</th><th>الفصل</th><th>الحالة</th><th>التاريخ</th></tr></thead>
              <tbody>
                {records.map((r, idx) => (
                  <tr key={r.id}>
                    <td>{idx + 1}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{r.student?.user?.firstName} {r.student?.user?.lastName}</td>
                    <td>{r.student?.schoolClass ? `${r.student.schoolClass.name} - ${r.student.schoolClass.section}` : '—'}</td>
                    <td>{getStatusBadge(r.status)}</td>
                    <td>{r.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {records.length === 0 && <div className="empty-state"><UserCheck size={48} /><p>لا توجد سجلات حضور لهذا التاريخ</p></div>}
        </div>
      )}
    </div>
  );
};

export default AttendancePage;

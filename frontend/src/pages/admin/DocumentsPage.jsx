import { useState, useEffect, useRef } from 'react';
import {
  Files, Upload, Camera, FileText, FileSpreadsheet, Image as ImageIcon,
  Search, Trash2, ExternalLink, Download, CheckCircle2, AlertCircle,
  RefreshCw, X, User, Calendar, School, Eye
} from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import './CrudPage.css';

const PURPOSES = [
  'فرض / امتحان كتابي',
  'مذكرة درس / تحضير بيداغوجي',
  'صورة ورقة إجابة / كشف',
  'شهادة طبية / تبرير غياب',
  'تقرير إداري أو تربوي',
  'جدول أوقات / برنامج',
  'أخرى (مستند عام)'
];

const DocumentsPage = () => {
  const { showToast, confirm } = useToast();
  const { user, isAdmin, isTeacher } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [purposeFilter, setPurposeFilter] = useState('');

  // Upload Form State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [title, setTitle] = useState('');
  const [purpose, setPurpose] = useState(PURPOSES[0]);
  const [classId, setClassId] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  useEffect(() => {
    loadDocuments();
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const res = await api.get('/classes');
      setClasses(Array.isArray(res.data) ? res.data : []);
    } catch {
      // ignore
    }
  };

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/documents');
      setDocuments(Array.isArray(res.data) ? res.data : []);
    } catch {
      setDocuments([]);
      showToast('فشل تحميل قائمة الوثائق', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setFilePreview(reader.result);
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleOpenModal = () => {
    setTitle('');
    setPurpose(PURPOSES[0]);
    setClassId('');
    setNotes('');
    setSelectedFile(null);
    setFilePreview(null);
    setShowUploadModal(true);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      showToast('الرجاء اختيار ملف أو التقاط صورة', 'warning');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', title.trim() || selectedFile.name);
      formData.append('purpose', purpose);
      if (classId) formData.append('classId', classId);
      if (notes) formData.append('notes', notes);

      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      showToast('تم رفع الوثيقة بنجاح وإشعار الإدارة 🎉', 'success');
      setShowUploadModal(false);
      await loadDocuments();
    } catch (err) {
      showToast('فشل رفع الملف: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id, docTitle) => {
    const isConfirmed = await confirm({
      title: 'حذف الوثيقة',
      message: `هل أنت متأكد من حذف الوثيقة "${docTitle}"؟ سيتم حذف الملف نهائياً من الخادم.`,
      confirmText: 'حذف نهائي',
      type: 'danger',
    });
    if (!isConfirmed) return;

    try {
      await api.delete(`/documents/${id}`);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      showToast('تم حذف الوثيقة بنجاح', 'success');
    } catch (err) {
      showToast('فشل حذف الوثيقة', 'error');
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (fileType = '', fileName = '') => {
    const lower = (fileName + ' ' + fileType).toLowerCase();
    if (lower.includes('pdf')) return <FileText size={22} color="#ef4444" />;
    if (lower.includes('xls') || lower.includes('csv') || lower.includes('sheet')) return <FileSpreadsheet size={22} color="#10b981" />;
    if (lower.includes('doc') || lower.includes('word')) return <FileText size={22} color="#3b82f6" />;
    if (lower.includes('image') || lower.includes('png') || lower.includes('jpg') || lower.includes('jpeg')) return <ImageIcon size={22} color="#8b5cf6" />;
    return <Files size={22} color="var(--primary)" />;
  };

  const filteredDocs = documents.filter((d) => {
    const matchSearch = !search ||
      d.title?.toLowerCase().includes(search.toLowerCase()) ||
      d.submittedByName?.toLowerCase().includes(search.toLowerCase()) ||
      d.fileName?.toLowerCase().includes(search.toLowerCase());
    const matchPurpose = !purposeFilter || d.purpose === purposeFilter;
    return matchSearch && matchPurpose;
  });

  return (
    <div className="crud-page animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">مستودع الوثائق والمستندات (PDF / Word / Excel / صور)</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
            منصة رفع وتوثيق أوراق الفروض والشهادات والتقارير عبر رفع الملفات أو التصوير المباشر بالكاميرا
          </p>
        </div>
        <div className="page-header-actions" style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-primary" onClick={handleOpenModal}>
            <Upload size={18} /> رفع وثيقة / تصوير ورقة
          </button>
          <button className="btn btn-ghost" onClick={loadDocuments} disabled={loading} title="تحديث">
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
          </button>
        </div>
      </div>

      {/* Toolbar / Filters */}
      <div className="crud-toolbar glass-panel" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: '220px' }}>
          <Search size={18} />
          <input
            className="input-field"
            placeholder="البحث باسم الوثيقة أو الأستاذ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="input-field"
          style={{ width: 'auto', minWidth: '180px' }}
          value={purposeFilter}
          onChange={(e) => setPurposeFilter(e.target.value)}
        >
          <option value="">جميع الأغراض والتصنيفات</option>
          {PURPOSES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <span className="badge badge-primary">{filteredDocs.length} وثيقة ومستند</span>
      </div>

      {/* Documents Table */}
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
                  <th>الوثيقة</th>
                  <th>الغرض والتصنيف</th>
                  <th>مقدم الوثيقة</th>
                  <th>الفصل المرتبط</th>
                  <th>الحجم</th>
                  <th>تاريخ ووقت التقديم</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                      لا توجد وثائق مرفوعة حتى الآن
                    </td>
                  </tr>
                ) : (
                  filteredDocs.map((doc, idx) => {
                    const downloadUrl = api.defaults.baseURL ? `${api.defaults.baseURL}/documents/download/${doc.fileName}` : `/api/documents/download/${doc.fileName}`;
                    const viewUrl = api.defaults.baseURL ? `${api.defaults.baseURL}/documents/view/${doc.fileName}` : `/api/documents/view/${doc.fileName}`;

                    return (
                      <tr key={doc.id}>
                        <td>{idx + 1}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '8px',
                              background: 'var(--surface)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '1px solid var(--border)'
                            }}>
                              {getFileIcon(doc.fileType, doc.originalFileName || doc.fileName)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                                {doc.title}
                              </div>
                              <small style={{ color: 'var(--text-muted)' }}>
                                {doc.originalFileName || doc.fileName}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-primary" style={{ fontSize: '0.8rem' }}>
                            {doc.purpose}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <User size={14} color="var(--primary)" />
                            <div>
                              <div style={{ fontWeight: 600 }}>{doc.submittedByName || doc.submittedBy}</div>
                              <small className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>
                                {doc.submitterRole === 'TEACHER' ? 'أستاذ' : 'إدارة'}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td>
                          {doc.schoolClass ? (
                            <span className="badge badge-secondary">{doc.schoolClass.name}</span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>
                        <td style={{ fontSize: '0.85rem' }}>{formatFileSize(doc.fileSize)}</td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          {doc.submissionDate}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <a
                              href={viewUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-sm btn-ghost"
                              title="معاينة / فتح"
                            >
                              <Eye size={15} />
                            </a>
                            <a
                              href={downloadUrl}
                              download
                              className="btn btn-sm btn-secondary"
                              title="تحميل"
                            >
                              <Download size={15} />
                            </a>
                            {(isAdmin() || user?.username === doc.submittedBy) && (
                              <button
                                className="btn-icon"
                                title="حذف"
                                onClick={() => handleDelete(doc.id, doc.title)}
                                style={{ color: 'var(--danger)' }}
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
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

      {/* Upload Document / Photo Modal */}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="modal-card animate-scale-up" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3>رفع وثيقة أو التقاط صورة لورقة</h3>
              <button className="btn-icon" onClick={() => setShowUploadModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUpload}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Upload or Camera Options */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ height: '54px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={18} />
                    <span style={{ fontSize: '0.8rem', marginTop: '2px' }}>اختر ملف (PDF, Word, Excel)</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ height: '54px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderColor: 'var(--primary)' }}
                    onClick={() => cameraInputRef.current?.click()}
                  >
                    <Camera size={18} color="var(--primary)" />
                    <span style={{ fontSize: '0.8rem', marginTop: '2px', color: 'var(--primary)', fontWeight: 600 }}>التقاط صورة بالكاميرا</span>
                  </button>
                </div>

                {/* Hidden File Inputs */}
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                />
                <input
                  type="file"
                  ref={cameraInputRef}
                  style={{ display: 'none' }}
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                />

                {/* Selected File Notice or Image Preview */}
                {selectedFile && (
                  <div style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    {getFileIcon(selectedFile.type, selectedFile.name)}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {selectedFile.name}
                      </div>
                      <small style={{ color: 'var(--text-muted)' }}>
                        {formatFileSize(selectedFile.size)}
                      </small>
                    </div>
                  </div>
                )}

                {filePreview && (
                  <div style={{ textAlign: 'center', maxHeight: '180px', overflow: 'hidden', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <img src={filePreview} alt="معاينة الورقة" style={{ maxWidth: '100%', maxHeight: '180px', objectFit: 'contain' }} />
                  </div>
                )}

                <div className="form-group">
                  <label>عنوان الوثيقة / المستند</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="مثال: فرض مراقبة عدد 1 في مادة الرياضيات"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>الغرض من الوثيقة (Purpose)</label>
                  <select
                    className="input-field"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                  >
                    {PURPOSES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>الفصل المرتبط (اختياري)</label>
                  <select
                    className="input-field"
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                  >
                    <option value="">-- بدون فصل محدد (عام) --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} {c.section ? `(${c.section})` : ''}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>ملاحظات إضافية أو تفاصيل للإدارة</label>
                  <textarea
                    rows="2"
                    className="input-field"
                    placeholder="أي ملاحظات أو توضيحات تود إرفاقها مع الوثيقة..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  ></textarea>
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowUploadModal(false)}>
                  إلغاء
                </button>
                <button type="submit" className="btn btn-primary" disabled={uploading || !selectedFile}>
                  {uploading ? 'جارٍ رفع الوثيقة...' : 'تأكيد الرفع والإرسال'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;

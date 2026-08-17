import { useToast } from '../context/ToastContext';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmModal = () => {
  const { confirmModal } = useToast();

  if (!confirmModal || !confirmModal.isOpen) return null;

  const isDanger = confirmModal.type === 'danger';

  return (
    <div
      className="modal-overlay animate-fade-in"
      onClick={confirmModal.onCancel}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px',
      }}
    >
      <div
        className="modal-content animate-scale-up"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-surface, #18181f)',
          borderRadius: '16px',
          border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.6)',
          maxWidth: '440px',
          width: '100%',
          padding: '24px',
          color: 'var(--text-main, #ffffff)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: isDanger ? 'rgba(239, 68, 68, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isDanger ? 'var(--danger, #ef4444)' : 'var(--primary, #6366f1)',
              }}
            >
              <AlertTriangle size={22} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>{confirmModal.title}</h3>
          </div>
          <button
            className="btn-icon"
            onClick={confirmModal.onCancel}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted, #9ca3af)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <p style={{ color: 'var(--text-secondary, #d1d5db)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '24px' }}>
          {confirmModal.message}
        </p>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={confirmModal.onCancel}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              cursor: 'pointer',
            }}
          >
            {confirmModal.cancelText}
          </button>
          <button
            type="button"
            className={`btn ${isDanger ? 'btn-danger' : 'btn-primary'}`}
            onClick={confirmModal.onConfirm}
            style={{
              padding: '10px 22px',
              borderRadius: '10px',
              cursor: 'pointer',
              background: isDanger ? 'var(--danger, #ef4444)' : 'var(--primary, #6366f1)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 600,
            }}
          >
            {confirmModal.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;

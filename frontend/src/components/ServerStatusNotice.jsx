import { useState, useEffect } from 'react';
import { CloudLightning, Loader2 } from 'lucide-react';

const ServerStatusNotice = () => {
  const [waking, setWaking] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      setWaking(Boolean(e.detail?.waking));
    };

    window.addEventListener('server-wake-status', handler);
    return () => window.removeEventListener('server-wake-status', handler);
  }, []);

  if (!waking) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.95), rgba(15, 23, 42, 0.95))',
        border: '1px solid rgba(99, 102, 241, 0.35)',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5), 0 0 16px rgba(99, 102, 241, 0.25)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: '12px',
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        color: '#ffffff',
        animation: 'fadeInUp 0.3s ease-out',
        maxWidth: '420px',
      }}
    >
      <div
        style={{
          width: '34px',
          height: '34px',
          borderRadius: '50%',
          background: 'rgba(99, 102, 241, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#818cf8',
          flexShrink: 0,
        }}
      >
        <CloudLightning size={18} className="spinning" />
      </div>
      <div style={{ flex: 1, fontSize: '0.85rem', lineHeight: 1.4 }}>
        <div style={{ fontWeight: 600, color: '#e0e7ff', marginBottom: '2px' }}>
          جاري إيقاظ الخادم السحابي...
        </div>
        <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.78rem' }}>
          خادم Render في مرحلة التشغيل (قد يستغرق بضع ثوانٍ لأول طلب).
        </div>
      </div>
    </div>
  );
};

export default ServerStatusNotice;

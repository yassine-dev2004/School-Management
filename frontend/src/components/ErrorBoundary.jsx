import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          padding: '2rem',
          textAlign: 'center',
          color: '#fff'
        }}>
          <div className="glass-panel" style={{ padding: '2.5rem', maxWidth: '500px', width: '100%' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--danger)' }}>
              ⚠️حدث خطأ غير متوقع
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              تعذر تحميل هذه الصفحة بسبب خطأ في البيانات. نرجو إعادة التحديث.
            </p>
            <button className="btn btn-primary" onClick={this.handleReset} style={{ margin: '0 auto' }}>
              إعادة تحميل الصفحة 🔄
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

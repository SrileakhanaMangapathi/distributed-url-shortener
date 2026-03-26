import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('React Error Boundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            background: '#0a0a0a',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            fontFamily: "'Courier New', monospace",
            color: '#fff',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>!</div>
          <h2 style={{ color: '#ff4444', marginBottom: '1rem' }}>Something went wrong</h2>
          <pre
            style={{
              color: '#ff6666',
              fontSize: '0.8rem',
              background: '#1a0a0a',
              border: '1px solid #ff444433',
              borderRadius: '8px',
              padding: '1rem',
              maxWidth: '600px',
              width: '100%',
              textAlign: 'left',
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {this.state.error?.message}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '1.5rem',
              padding: '10px 24px',
              background: '#00ff88',
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              fontFamily: "'Courier New', monospace",
            }}
          >
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

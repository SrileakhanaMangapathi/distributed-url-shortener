import { useState } from 'react';
import { useUrls } from '../hooks/useUrls';

const Home = () => {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const { shortenUrl } = useUrls();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    const res = await shortenUrl(url.trim());
    setLoading(false);

    if (res.success) {
      setResult(res.data);
      setUrl('');
    } else {
      setError(res.message);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result.shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 60px)',
        background: '#0a0a0a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        fontFamily: "'Courier New', monospace",
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1
          style={{
            fontSize: 'clamp(2.5rem, 6vw, 5rem)',
            fontWeight: 800,
            color: '#fff',
            margin: 0,
            lineHeight: 1.1,
            letterSpacing: '-2px',
          }}
        >
          Shorten.
          <br />
          <span style={{ color: '#00ff88' }}>Track.</span>
          <br />
          Share.
        </h1>
        <p
          style={{
            color: '#555',
            marginTop: '1.5rem',
            fontSize: '1rem',
            maxWidth: '400px',
          }}
        >
          Turn long URLs into short, trackable links with real-time analytics.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          width: '100%',
          maxWidth: '600px',
          display: 'flex',
          gap: '0.75rem',
          flexWrap: 'wrap',
        }}
      >
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://your-very-long-url.com/paste-here"
          required
          style={{
            flex: 1,
            minWidth: '280px',
            padding: '14px 18px',
            background: '#111',
            border: '1px solid #2a2a2a',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '0.95rem',
            fontFamily: "'Courier New', monospace",
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '14px 28px',
            background: loading ? '#333' : '#00ff88',
            color: '#000',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: "'Courier New', monospace",
            transition: 'all 0.2s',
            whiteSpace: 'nowrap',
          }}
        >
          {loading ? 'Shortening...' : 'Shorten ->'}
        </button>
      </form>

      {error && (
        <div
          style={{
            marginTop: '1rem',
            padding: '12px 18px',
            background: '#1a0a0a',
            border: '1px solid #ff4444',
            borderRadius: '8px',
            color: '#ff6666',
            fontSize: '0.9rem',
            maxWidth: '600px',
            width: '100%',
          }}
        >
          {error}
        </div>
      )}

      {result && (
        <div
          style={{
            marginTop: '1.5rem',
            padding: '1.5rem',
            background: '#0d1a0d',
            border: '1px solid #00ff8833',
            borderRadius: '12px',
            maxWidth: '600px',
            width: '100%',
          }}
        >
          <p style={{ color: '#555', fontSize: '0.8rem', margin: '0 0 0.5rem' }}>
            Your short link is ready:
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <a
              href={result.shortUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                color: '#00ff88',
                fontSize: '1.2rem',
                fontWeight: 700,
                textDecoration: 'none',
                flex: 1,
              }}
            >
              {result.shortUrl}
            </a>
            <button
              onClick={handleCopy}
              style={{
                padding: '8px 16px',
                background: copied ? '#00ff8822' : '#1a1a1a',
                border: `1px solid ${copied ? '#00ff88' : '#333'}`,
                borderRadius: '6px',
                color: copied ? '#00ff88' : '#ccc',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontFamily: "'Courier New', monospace",
                transition: 'all 0.2s',
              }}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p style={{ color: '#444', fontSize: '0.8rem', margin: '0.75rem 0 0' }}>
            Original: <span style={{ color: '#666' }}>{result.originalUrl}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default Home;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useUrls } from '../hooks/useUrls';

const Dashboard = () => {
  const { user } = useAuth();
  const { urls, loading, fetchUrls, deleteUrl } = useUrls();
  const navigate = useNavigate();
  const [copiedId, setCopiedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchUrls();
  }, [user, navigate, fetchUrls]);

  const handleCopy = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this link?')) return;
    setDeletingId(id);
    await deleteUrl(id);
    setDeletingId(null);
  };

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 60px)',
        background: '#0a0a0a',
        padding: '2rem',
        fontFamily: "'Courier New', monospace",
      }}
    >
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ color: '#fff', margin: '0 0 0.5rem', fontSize: '1.8rem', fontWeight: 700 }}>
            Your links
          </h1>
          <p style={{ color: '#555', margin: 0, fontSize: '0.9rem' }}>
            {urls.length} link{urls.length !== 1 ? 's' : ''} created
          </p>
        </div>

        {loading && (
          <div style={{ color: '#555', textAlign: 'center', padding: '3rem' }}>Loading your links...</div>
        )}

        {!loading && urls.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '4rem 2rem',
              border: '1px dashed #1a1a1a',
              borderRadius: '12px',
              color: '#333',
            }}
          >
            <p style={{ margin: '0 0 1rem' }}>No links yet</p>
            <button
              onClick={() => navigate('/')}
              style={{
                padding: '10px 20px',
                background: '#00ff88',
                color: '#000',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: "'Courier New', monospace",
              }}
            >
              Create your first link
            </button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {urls.map((url) => (
            <div
              key={url.id}
              style={{
                background: '#0f0f0f',
                border: '1px solid #1a1a1a',
                borderRadius: '12px',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ flex: 1, minWidth: '200px' }}>
                <a
                  href={url.shortUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: '#00ff88',
                    textDecoration: 'none',
                    fontWeight: 700,
                    fontSize: '1rem',
                    display: 'block',
                    marginBottom: '4px',
                  }}
                >
                  {url.shortUrl}
                </a>
                <span
                  style={{
                    color: '#444',
                    fontSize: '0.8rem',
                    display: 'block',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '350px',
                  }}
                >
                  {url.originalUrl}
                </span>
              </div>

              <div style={{ textAlign: 'center', minWidth: '60px' }}>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.2rem' }}>{url.clicks}</div>
                <div style={{ color: '#444', fontSize: '0.75rem' }}>clicks</div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => handleCopy(url.shortUrl, url.id)}
                  style={{
                    padding: '7px 14px',
                    background: copiedId === url.id ? '#00ff8822' : '#1a1a1a',
                    border: `1px solid ${copiedId === url.id ? '#00ff88' : '#2a2a2a'}`,
                    borderRadius: '6px',
                    color: copiedId === url.id ? '#00ff88' : '#888',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontFamily: "'Courier New', monospace",
                  }}
                >
                  {copiedId === url.id ? 'OK' : 'Copy'}
                </button>

                <button
                  onClick={() => navigate(`/analytics/${url.shortCode}`)}
                  style={{
                    padding: '7px 14px',
                    background: '#1a1a1a',
                    border: '1px solid #2a2a2a',
                    borderRadius: '6px',
                    color: '#888',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontFamily: "'Courier New', monospace",
                  }}
                >
                  Stats
                </button>

                <button
                  onClick={() => handleDelete(url.id)}
                  disabled={deletingId === url.id}
                  style={{
                    padding: '7px 14px',
                    background: '#1a0a0a',
                    border: '1px solid #2a1a1a',
                    borderRadius: '6px',
                    color: '#ff4444',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontFamily: "'Courier New', monospace",
                  }}
                >
                  {deletingId === url.id ? '...' : 'Del'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

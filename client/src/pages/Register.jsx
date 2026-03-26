import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await register(name, email, password);
    if (res.success) {
      navigate('/dashboard');
    } else {
      setError(res.message);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    background: '#111',
    border: '1px solid #2a2a2a',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '0.95rem',
    fontFamily: "'Courier New', monospace",
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 60px)',
        background: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        fontFamily: "'Courier New', monospace",
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          background: '#0f0f0f',
          border: '1px solid #1a1a1a',
          borderRadius: '16px',
          padding: '2.5rem',
        }}
      >
        <h2 style={{ color: '#fff', margin: '0 0 0.5rem', fontSize: '1.8rem', fontWeight: 700 }}>
          Create account
        </h2>
        <p style={{ color: '#555', margin: '0 0 2rem', fontSize: '0.9rem' }}>
          Start shortening and tracking links
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ color: '#666', fontSize: '0.8rem', display: 'block', marginBottom: '6px' }}>
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ color: '#666', fontSize: '0.8rem', display: 'block', marginBottom: '6px' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ color: '#666', fontSize: '0.8rem', display: 'block', marginBottom: '6px' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              minLength={6}
              required
              style={inputStyle}
            />
          </div>

          {error && (
            <div
              style={{
                padding: '10px 14px',
                background: '#1a0a0a',
                border: '1px solid #ff4444',
                borderRadius: '6px',
                color: '#ff6666',
                fontSize: '0.85rem',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px',
              background: loading ? '#333' : '#00ff88',
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: "'Courier New', monospace",
              marginTop: '0.5rem',
            }}
          >
            {loading ? 'Creating account...' : 'Create account ->'}
          </button>
        </form>

        <p style={{ color: '#444', fontSize: '0.85rem', textAlign: 'center', marginTop: '1.5rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#00ff88', textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

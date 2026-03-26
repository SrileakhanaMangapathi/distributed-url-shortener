import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav
      style={{
        background: '#0a0a0a',
        borderBottom: '1px solid #1a1a1a',
        padding: '0 2rem',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <Link to="/" style={{ textDecoration: 'none' }}>
        <span
          style={{
            fontFamily: "'Courier New', monospace",
            fontSize: '1.2rem',
            fontWeight: 700,
            color: '#00ff88',
            letterSpacing: '-0.5px',
          }}
        >
          short<span style={{ color: '#fff' }}>.ly</span>
        </span>
      </Link>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {user ? (
          <>
            <span style={{ color: '#666', fontSize: '0.85rem' }}>{user.name}</span>
            <Link
              to="/dashboard"
              style={{
                color: '#ccc',
                textDecoration: 'none',
                fontSize: '0.9rem',
                padding: '6px 14px',
                border: '1px solid #333',
                borderRadius: '6px',
                transition: 'all 0.2s',
              }}
            >
              Dashboard
            </Link>
            <button
              onClick={handleLogout}
              style={{
                background: 'transparent',
                border: '1px solid #333',
                color: '#666',
                padding: '6px 14px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                transition: 'all 0.2s',
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              style={{
                color: '#ccc',
                textDecoration: 'none',
                fontSize: '0.9rem',
              }}
            >
              Login
            </Link>
            <Link
              to="/register"
              style={{
                background: '#00ff88',
                color: '#000',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: 600,
                padding: '6px 16px',
                borderRadius: '6px',
              }}
            >
              Sign up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

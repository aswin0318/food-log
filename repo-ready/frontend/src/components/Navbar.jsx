import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authApi } from '../api'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try { await authApi.logout() } catch {}
    logout()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="navbar-logo">🔥</span>
        <span className="gradient-text" style={{ fontWeight: 700, fontSize: '1.1rem' }}>NutriTrack</span>
      </div>

      <div className="navbar-links">
        <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span>📊</span> Dashboard
        </NavLink>
        <NavLink to="/food-log" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span>🍽️</span> Food Log
        </NavLink>
        <NavLink to="/alerts" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span>🔔</span> Alerts
        </NavLink>
      </div>

      <div className="navbar-user">
        <div className="user-avatar">{user?.username?.[0]?.toUpperCase() || 'U'}</div>
        <span className="text-sm">{user?.username || 'User'}</span>
        <button className="btn btn-outline btn-sm" onClick={handleLogout}>Logout</button>
      </div>

      <style>{`
        .navbar {
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          width: 240px;
          background: rgba(5, 5, 16, 0.95);
          border-right: 1px solid var(--border);
          padding: 1.5rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
          z-index: 50;
          backdrop-filter: blur(20px);
        }
        .navbar-brand { display: flex; align-items: center; gap: 0.75rem; padding: 0 0.5rem; }
        .navbar-logo { font-size: 1.5rem; }
        .navbar-links { display: flex; flex-direction: column; gap: 0.25rem; flex: 1; }
        .nav-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 0.2s;
        }
        .nav-link:hover { background: var(--bg-card); color: white; }
        .nav-link.active { background: rgba(139, 92, 246, 0.15); color: var(--accent-violet); }
        .navbar-user {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          border-top: 1px solid var(--border);
          padding-top: 1.5rem;
        }
        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--gradient);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.8rem;
        }
        @media (max-width: 768px) {
          .navbar {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            top: auto;
            width: 100%;
            height: auto;
            flex-direction: row;
            padding: 0.5rem 1rem;
            border-right: none;
            border-top: 1px solid var(--border);
          }
          .navbar-brand, .navbar-user { display: none; }
          .navbar-links { flex-direction: row; justify-content: space-around; }
        }
      `}</style>
    </nav>
  )
}

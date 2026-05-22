import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/companies', label: 'Companies', icon: '🏢' },
  { to: '/logbook', label: 'Logbook', icon: '📓' },
  { to: '/documents', label: 'Documents', icon: '📄' },
  { to: '/interview', label: 'Interview Prep', icon: '🎤' },
  { to: '/shares', label: 'Batch Share', icon: '🌐' },
  { to: '/profile', label: 'Profile', icon: '⚙️' },
];

export default function Layout({ children }) {
  const { user, signout } = useAuth();
  const navigate = useNavigate();

  const handleSignout = () => {
    signout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">🎓</span>
          <span className="brand-name">OJT Buddy</span>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
            <div className="user-details">
              <div className="user-name">{user?.name}</div>
              <div className="user-batch">{user?.batch || 'No batch set'}</div>
            </div>
          </div>
          <button className="signout-btn" onClick={handleSignout}>Sign out</button>
        </div>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}

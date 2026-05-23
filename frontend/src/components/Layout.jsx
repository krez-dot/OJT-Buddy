import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Building2, BookOpen,
  FileText, Mic2, Globe, Settings,
  ChevronLeft, ChevronRight, LogOut, Sun, Moon, GraduationCap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getLogbookStats } from '../api';

const navItems = [
  { to: '/dashboard', label: 'Dashboard',     Icon: LayoutDashboard },
  { to: '/companies', label: 'Companies',     Icon: Building2 },
  { to: '/logbook',   label: 'Logbook',       Icon: BookOpen },
  { to: '/documents', label: 'Documents',     Icon: FileText },
  { to: '/interview', label: 'Interview Prep', Icon: Mic2 },
  { to: '/shares',    label: 'Batch Share',   Icon: Globe },
  { to: '/profile',   label: 'Profile',       Icon: Settings },
];

const _now = new Date();
const TODAY = _now.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' });

export default function Layout({ children }) {
  const { user, signout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar-collapsed') === 'true');
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', collapsed);
  }, [collapsed]);

  useEffect(() => {
    getLogbookStats().then(r => setStats(r.data)).catch(() => {});
  }, []);

  const handleSignout = () => { signout(); navigate('/login'); };
  const closeMobile = () => setMobileOpen(false);

  const totalHours = parseFloat(stats?.total_hours || 0);
  const required = user?.required_hours || 486;
  const pct = Math.min(100, Math.round((totalHours / required) * 100));

  return (
    <div className="layout">
      <div className={`sidebar-overlay ${mobileOpen ? 'open' : ''}`} onClick={closeMobile} />

      <aside className={`sidebar ${mobileOpen ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`}>

        {/* Brand */}
        <div className={`sidebar-brand ${collapsed ? 'sidebar-brand--collapsed' : ''}`}>
          {collapsed ? (
            <button className="collapse-btn collapse-btn--center" onClick={() => setCollapsed(false)} title="Expand">
              <ChevronRight size={17} />
            </button>
          ) : (
            <>
              <GraduationCap size={22} strokeWidth={1.8} className="brand-icon" />
              <span className="brand-name">OJT Buddy</span>
              <button className="collapse-btn" onClick={() => setCollapsed(true)} title="Collapse">
                <ChevronLeft size={16} />
              </button>
            </>
          )}
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {navItems.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={closeMobile}
              data-label={label}
            >
              <span className="nav-icon"><Icon size={19} strokeWidth={1.8} /></span>
              {!collapsed && <span className="nav-label">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Progress widget */}
        {!collapsed && (
          <div className="sidebar-widget">
            <div className="sw-date">{TODAY}</div>
            <div className="sw-title">OJT Progress</div>
            <div className="sw-numbers">
              <span className="sw-value">{totalHours.toFixed(0)}</span>
              <span className="sw-total">/ {required}h</span>
            </div>
            <div className="sw-bar">
              <div className="sw-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="sw-pct">{pct}% complete · {Math.max(0, required - totalHours).toFixed(0)}h left</div>
            <div className="sw-days">📅 {stats?.total_days || 0} days logged</div>
          </div>
        )}

        {/* Footer */}
        <div className={`sidebar-footer ${collapsed ? 'sidebar-footer--collapsed' : ''}`}>
          {collapsed ? (
            <>
              <div className="user-avatar" style={{ margin: '0 auto 10px' }}>
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
                <button className="theme-btn" onClick={() => setDark(d => !d)}>
                  {dark ? <Sun size={15} /> : <Moon size={15} />}
                </button>
                <button className="theme-btn" onClick={handleSignout} title="Sign out">
                  <LogOut size={15} />
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="user-info">
                <div className="user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
                <div className="user-details">
                  <div className="user-name">{user?.name}</div>
                  <div className="user-batch">{user?.batch || 'No batch set'}</div>
                </div>
              </div>
              <div className="sidebar-footer-row">
                <button className="signout-btn" onClick={handleSignout}>Sign out</button>
                <button className="theme-btn" onClick={() => setDark(d => !d)}>
                  {dark ? <Sun size={15} /> : <Moon size={15} />}
                </button>
              </div>
            </>
          )}
        </div>
      </aside>

      <div className="main-content">
        <div className="bg-orbs" aria-hidden="true">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
        </div>
        <div className="mobile-header">
          <button className="menu-btn" onClick={() => setMobileOpen(true)}>☰</button>
          <span className="brand-name">OJT Buddy</span>
        </div>
        {children}
      </div>
    </div>
  );
}

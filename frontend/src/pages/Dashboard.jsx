import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getLogbookStats, getCompanies, getLogbook } from '../api';

const STATUS_LABELS = { wishlist: 'Wishlist', applied: 'Applied', interview: 'Interview', accepted: 'Accepted', rejected: 'Rejected' };
const STATUS_COLORS = { wishlist: '#94a3b8', applied: '#3b82f6', interview: '#f59e0b', accepted: '#22c55e', rejected: '#ef4444' };
const MOOD_EMOJI = { great: '😄', good: '😊', okay: '😐', tired: '😴', rough: '😣' };

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [recentEntries, setRecentEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getLogbookStats(), getCompanies(), getLogbook()])
      .then(([s, c, l]) => {
        setStats(s.data);
        setCompanies(c.data);
        setRecentEntries(l.data.slice(0, 5));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading">Loading...</div>;

  const totalHours = parseFloat(stats?.total_hours || 0);
  const requiredHours = stats?.required_hours || user?.required_hours || 486;
  const pct = Math.min(100, Math.round((totalHours / requiredHours) * 100));

  const companyCounts = companies.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});

  const accepted = companies.find((c) => c.status === 'accepted');

  return (
    <div className="page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p className="page-subtitle">Welcome back, {user?.name?.split(' ')[0]}!</p>
      </div>

      {accepted && (
        <div className="alert-success">
          Accepted at <strong>{accepted.name}</strong> — you are all set!
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Hours Rendered</div>
          <div className="stat-value">{totalHours.toFixed(1)}</div>
          <div className="stat-sub">of {requiredHours} required</div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="stat-pct">{pct}% complete</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Days Logged</div>
          <div className="stat-value">{stats?.total_days || 0}</div>
          <div className="stat-sub">logbook entries</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Companies Tracked</div>
          <div className="stat-value">{companies.length}</div>
          <div className="stat-sub">in your pipeline</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Hours Remaining</div>
          <div className="stat-value">{Math.max(0, requiredHours - totalHours).toFixed(1)}</div>
          <div className="stat-sub">hours to go</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h2 className="card-title">Company Pipeline</h2>
          {companies.length === 0 ? (
            <p className="empty-text">No companies yet. Add one in the Companies tab.</p>
          ) : (
            <div className="pipeline-bars">
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <div key={key} className="pipeline-row">
                  <span className="pipeline-label">{label}</span>
                  <div className="pipeline-track">
                    <div
                      className="pipeline-fill"
                      style={{
                        width: companies.length ? `${((companyCounts[key] || 0) / companies.length) * 100}%` : '0%',
                        background: STATUS_COLORS[key],
                      }}
                    />
                  </div>
                  <span className="pipeline-count">{companyCounts[key] || 0}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="card-title">Recent Logbook</h2>
          {recentEntries.length === 0 ? (
            <p className="empty-text">No entries yet. Start logging in the Logbook tab.</p>
          ) : (
            <div className="recent-entries">
              {recentEntries.map((e) => (
                <div key={e.id} className="entry-row">
                  <div className="entry-date">{new Date(e.entry_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}</div>
                  <div className="entry-info">
                    <div className="entry-hours">{e.hours_rendered}h</div>
                    <div className="entry-tasks">{e.tasks_done?.slice(0, 60)}{e.tasks_done?.length > 60 ? '…' : ''}</div>
                  </div>
                  <div className="entry-mood">{MOOD_EMOJI[e.mood] || ''}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

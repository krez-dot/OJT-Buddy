import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useCountUp } from '../hooks/useCountUp';
import { useDeadlineNotifications } from '../hooks/useDeadlineNotifications';
import { getLogbookStats, getCompanies, getLogbook, getWeeklyHours } from '../api';
import { SkeletonStat, SkeletonList } from '../components/Skeleton';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const STATUS_LABELS = { wishlist: 'Wishlist', applied: 'Applied', interview: 'Interview', accepted: 'Accepted', rejected: 'Rejected' };
const STATUS_COLORS = { wishlist: '#94a3b8', applied: '#3b82f6', interview: '#f59e0b', accepted: '#22c55e', rejected: '#ef4444' };
const MOOD_EMOJI  = { great: '😄', good: '😊', okay: '😐', tired: '😴', rough: '😣' };
const MOOD_COLOR  = { great: '#22c55e', good: '#3b82f6', okay: '#f59e0b', tired: '#94a3b8', rough: '#ef4444' };

const QUICK_ACTIONS = [
  { label: 'Log Today', sub: 'Record your hours', icon: '📓', to: '/logbook' },
  { label: 'Companies', sub: 'Track applications', icon: '🏢', to: '/companies' },
  { label: 'Practice', sub: 'Interview questions', icon: '🎤', to: '/interview' },
  { label: 'Documents', sub: 'Check your checklist', icon: '📄', to: '/documents' },
];

const OJT_STAGES = [
  { key: 'searching', label: 'Searching' },
  { key: 'applied', label: 'Applied' },
  { key: 'interview', label: 'Interviewing' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'active', label: 'OJT Active' },
  { key: 'complete', label: 'Complete' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [recentEntries, setRecentEntries] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getLogbookStats(), getCompanies(), getLogbook(), getWeeklyHours()])
      .then(([s, c, l, w]) => {
        setStats(s.data);
        setCompanies(c.data);
        setRecentEntries(l.data.slice(0, 5));
        setWeeklyData(w.data.map((d) => ({ ...d, hours: parseFloat(d.hours) })));
      })
      .finally(() => setLoading(false));
  }, []);

  const totalHours = parseFloat(stats?.total_hours || 0);
  const requiredHours = stats?.required_hours || user?.required_hours || 486;
  const pct = Math.min(100, Math.round((totalHours / requiredHours) * 100));

  useDeadlineNotifications(companies);

  const animHours = useCountUp(totalHours);
  const animDays = useCountUp(stats?.total_days || 0);
  const animCompanies = useCountUp(companies.length);
  const animRemaining = useCountUp(Math.max(0, requiredHours - totalHours));

  if (loading) return (
    <div className="page">
      <div className="page-header"><div><div className="skeleton" style={{height:'24px',width:'140px'}} /></div></div>
      <div className="stats-grid">{Array.from({length:4}).map((_,i) => <SkeletonStat key={i} />)}</div>
      <div className="dashboard-grid"><SkeletonList rows={3} /><SkeletonList rows={3} /></div>
    </div>
  );

  const companyCounts = companies.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});

  const accepted = companies.find((c) => c.status === 'accepted');

  const currentStageIdx = (() => {
    if (totalHours >= requiredHours) return 5;
    if (totalHours > 0) return 4;
    if (companies.some(c => c.status === 'accepted')) return 3;
    if (companies.some(c => c.status === 'interview')) return 2;
    if (companies.some(c => c.status === 'applied')) return 1;
    return 0;
  })();

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user?.name?.split(' ')[0]}</p>
        </div>
      </div>

      {accepted && (
        <div className="alert-success">
          Accepted at <strong>{accepted.name}</strong> — you are all set!
        </div>
      )}

      <div className="stats-grid" id="stats-section">
        <div className="stat-card">
          <div className="stat-label">Hours Rendered</div>
          <div className="stat-value">{animHours.toFixed(1)}</div>
          <div className="stat-sub">of {requiredHours} required</div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="stat-pct">{pct}% complete</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Days Logged</div>
          <div className="stat-value">{Math.round(animDays)}</div>
          <div className="stat-sub">logbook entries</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Companies Tracked</div>
          <div className="stat-value">{Math.round(animCompanies)}</div>
          <div className="stat-sub">in your pipeline</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Hours Remaining</div>
          <div className="stat-value">{animRemaining.toFixed(1)}</div>
          <div className="stat-sub">hours to go</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        {QUICK_ACTIONS.map((a) => (
          <button key={a.to} className="quick-action-card" onClick={() => navigate(a.to)}>
            <div className="qa-icon-wrap">{a.icon}</div>
            <span className="qa-label">{a.label}</span>
            <span className="qa-sub">{a.sub}</span>
          </button>
        ))}
      </div>

      {/* OJT Journey */}
      <div className="ojt-journey">
        <div className="card-title">OJT Journey</div>
        <div className="stages-track">
          {OJT_STAGES.map((stage, i) => {
            const isDone = i < currentStageIdx;
            const isCurrent = i === currentStageIdx;
            return (
              <div key={stage.key} className={`stage-item ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}>
                <div className={`stage-dot ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`} />
                <span className="stage-label">{stage.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {weeklyData.length > 0 && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-title">Daily Hours (last 14 days)</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklyData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <XAxis dataKey="week" tick={{ fontSize: 10, fontFamily: 'DM Mono' }} />
              <YAxis tick={{ fontSize: 10, fontFamily: 'DM Mono' }} />
              <Tooltip formatter={(v) => [`${v}h`, 'Hours']} />
              <Bar dataKey="hours" radius={[4, 4, 0, 0]} maxBarSize={40}>
                {weeklyData.map((_, i) => <Cell key={i} fill="var(--accent)" />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="dashboard-grid" style={{ marginBottom: '20px' }}>
        <div className="card">
          <div className="card-title">Company Pipeline</div>
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
          <div className="card-title">Recent Logbook</div>
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

      {/* Mood Trend */}
      {recentEntries.length > 0 && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-title">Mood Trend</div>
          <div className="mood-trend">
            {[...recentEntries].reverse().map((e) => (
              <div key={e.id} className="mood-trend-item" title={`${new Date(e.entry_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })} — ${e.mood}`}>
                <div className="mood-trend-dot" style={{ background: MOOD_COLOR[e.mood] || '#94a3b8' }} />
                <span className="mood-trend-emoji">{MOOD_EMOJI[e.mood] || '❓'}</span>
                <span className="mood-trend-date">{new Date(e.entry_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Deadlines */}
      {(() => {
        const now = new Date();
        const soon = companies
          .filter((c) => c.deadline && c.status !== 'accepted' && c.status !== 'rejected')
          .map((c) => ({ ...c, daysLeft: Math.ceil((new Date(c.deadline) - now) / 86400000) }))
          .filter((c) => c.daysLeft >= 0 && c.daysLeft <= 14)
          .sort((a, b) => a.daysLeft - b.daysLeft);
        if (soon.length === 0) return null;
        return (
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="card-title">⏰ Upcoming Deadlines</div>
            <div className="deadlines-list">
              {soon.map((c) => (
                <div key={c.id} className="deadline-row">
                  <span className="deadline-name">{c.name}</span>
                  <span className={`deadline-badge ${c.daysLeft <= 3 ? 'urgent' : c.daysLeft <= 7 ? 'warning' : ''}`}>
                    {c.daysLeft === 0 ? 'Today' : c.daysLeft === 1 ? 'Tomorrow' : `${c.daysLeft}d left`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

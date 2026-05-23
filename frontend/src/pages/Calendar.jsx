import { useState, useEffect } from 'react';
import { getLogbook, getCompanies } from '../api';
import { SkeletonList } from '../components/Skeleton';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MOOD_EMOJI = { great: '😄', good: '😊', okay: '😐', tired: '😴', rough: '😣' };
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function fmt(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export default function Calendar() {
  const now = new Date();
  const [year, setYear]       = useState(now.getFullYear());
  const [month, setMonth]     = useState(now.getMonth());
  const [entries, setEntries] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    Promise.all([getLogbook(), getCompanies()])
      .then(([l, c]) => { setEntries(l.data); setCompanies(c.data); })
      .finally(() => setLoading(false));
  }, []);

  const prev = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); setSelected(null); };
  const next = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); setSelected(null); };

  if (loading) return (
    <div className="page">
      <div className="page-header"><div className="skeleton" style={{height:'24px',width:'120px',borderRadius:'6px'}} /></div>
      <SkeletonList rows={5} />
    </div>
  );

  // Build lookup maps
  const entryMap = {};
  entries.forEach((e) => { entryMap[e.entry_date?.slice(0, 10)] = e; });

  const deadlineMap = {};
  companies.forEach((c) => {
    if (c.deadline && c.status !== 'accepted' && c.status !== 'rejected') {
      const key = c.deadline.slice(0, 10);
      if (!deadlineMap[key]) deadlineMap[key] = [];
      deadlineMap[key].push(c);
    }
  });

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const todayStr = fmt(now.getFullYear(), now.getMonth(), now.getDate());
  const monthLabel = new Date(year, month).toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });

  const selectedDate = selected ? fmt(year, month, selected) : null;
  const selectedEntry = selectedDate ? entryMap[selectedDate] : null;
  const selectedDeadlines = selectedDate ? (deadlineMap[selectedDate] || []) : [];

  // Stats for this month
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthEntries = entries.filter((e) => e.entry_date?.startsWith(monthStr));
  const monthHours = monthEntries.reduce((s, e) => s + parseFloat(e.hours_rendered || 0), 0);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Calendar</h1>
          <p className="page-subtitle">Logged days and upcoming deadlines</p>
        </div>
      </div>

      <div className="cal-layout">
        <div className="cal-main">
          {/* Month nav */}
          <div className="cal-nav">
            <button className="cal-nav-btn" onClick={prev}><ChevronLeft size={16} /></button>
            <span className="cal-month-label">{monthLabel}</span>
            <button className="cal-nav-btn" onClick={next}><ChevronRight size={16} /></button>
          </div>

          {/* Month stats */}
          {monthEntries.length > 0 && (
            <div className="cal-month-stats">
              <span>{monthEntries.length} days logged</span>
              <span>·</span>
              <span>{monthHours.toFixed(1)}h this month</span>
            </div>
          )}

          {/* Day headers */}
          <div className="cal-grid">
            {DAYS.map((d) => (
              <div key={d} className="cal-day-header">{d}</div>
            ))}

            {cells.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} className="cal-cell cal-cell--empty" />;
              const dateStr = fmt(year, month, day);
              const entry   = entryMap[dateStr];
              const deadlines = deadlineMap[dateStr] || [];
              const isToday = dateStr === todayStr;
              const isSelected = day === selected;

              return (
                <button
                  key={dateStr}
                  className={`cal-cell ${entry ? 'cal-cell--logged' : ''} ${deadlines.length ? 'cal-cell--deadline' : ''} ${isToday ? 'cal-cell--today' : ''} ${isSelected ? 'cal-cell--selected' : ''}`}
                  onClick={() => setSelected(isSelected ? null : day)}
                >
                  <span className="cal-day-num">{day}</span>
                  {entry && <span className="cal-mood">{MOOD_EMOJI[entry.mood] || '📓'}</span>}
                  {deadlines.length > 0 && <span className="cal-deadline-dot" />}
                  {entry && <span className="cal-hours-label">{entry.hours_rendered}h</span>}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="cal-legend">
            <span className="cal-legend-item"><span className="cal-legend-dot logged" />Logged day</span>
            <span className="cal-legend-item"><span className="cal-legend-dot deadline" />Deadline</span>
            <span className="cal-legend-item"><span className="cal-legend-dot today" />Today</span>
          </div>
        </div>

        {/* Detail panel */}
        <div className="cal-detail">
          {!selected ? (
            <div className="cal-detail-empty">
              <p>Click a day to see details</p>
            </div>
          ) : (
            <div className="cal-detail-content">
              <div className="cal-detail-date">
                {new Date(year, month, selected).toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' })}
              </div>

              {selectedEntry ? (
                <div className="cal-entry-card">
                  <div className="cal-entry-meta">
                    <span className="cal-entry-hours">{selectedEntry.hours_rendered}h</span>
                    {selectedEntry.location && <span className="cal-entry-location">📍 {selectedEntry.location}</span>}
                    {selectedEntry.mood && <span>{MOOD_EMOJI[selectedEntry.mood]}</span>}
                  </div>
                  {selectedEntry.tasks_done && <p className="cal-entry-tasks">{selectedEntry.tasks_done}</p>}
                </div>
              ) : (
                <p className="cal-detail-none">No logbook entry</p>
              )}

              {selectedDeadlines.length > 0 && (
                <div className="cal-deadlines">
                  <div className="cal-deadlines-label">Deadlines</div>
                  {selectedDeadlines.map((c) => (
                    <div key={c.id} className="cal-deadline-item">
                      <span className="cal-deadline-name">{c.name}</span>
                      <span className="cal-deadline-status">{c.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

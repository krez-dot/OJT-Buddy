import { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { getLogbook, getLogbookStats, saveLogEntry, updateLogEntry, deleteLogEntry, aiLogbookHelper } from '../api';
import { useToast } from '../context/ToastContext';
import { SkeletonStat, SkeletonList } from '../components/Skeleton';

const MOODS = [
  { value: 'great', emoji: '😄', label: 'Great' },
  { value: 'good', emoji: '😊', label: 'Good' },
  { value: 'okay', emoji: '😐', label: 'Okay' },
  { value: 'tired', emoji: '😴', label: 'Tired' },
  { value: 'rough', emoji: '😣', label: 'Rough' },
];

const d = new Date();
const TODAY = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

export default function Logbook() {
  const [entries, setEntries] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [monthFilter, setMonthFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState({ entry_date: TODAY, location: '', tasks_done: '', mood: 'good', hours_rendered: 8 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [aiWriting, setAiWriting] = useState(false);
  const toast = useToast();

  const load = () =>
    Promise.all([getLogbook(), getLogbookStats()])
      .then(([l, s]) => { setEntries(l.data); setStats(s.data); })
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  const openForm = (entry = null) => {
    if (entry) {
      setEditTarget(entry);
      setForm({ entry_date: entry.entry_date.slice(0,10), location: entry.location || '', tasks_done: entry.tasks_done || '', mood: entry.mood || 'good', hours_rendered: entry.hours_rendered });
    } else {
      setEditTarget(null);
      setForm({ entry_date: TODAY, location: '', tasks_done: '', mood: 'good', hours_rendered: 8 });
    }
    setShowForm(true); setError('');
  };

  const validate = () => {
    if (!form.entry_date) return 'Date is required';
    const today = new Date().toISOString().slice(0, 10);
    if (form.entry_date > today) return 'Entry date cannot be in the future';
    const h = parseFloat(form.hours_rendered);
    if (isNaN(h) || h < 0 || h > 24) return 'Hours must be between 0 and 24';
    return null;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const validationErr = validate();
    if (validationErr) { setError(validationErr); return; }
    setSaving(true); setError('');
    try {
      if (editTarget) {
        await updateLogEntry(editTarget.id, form);
      } else {
        await saveLogEntry(form);
      }
      await load();
      setShowForm(false);
      setEditTarget(null);
      toast(editTarget ? 'Entry updated!' : 'Entry saved!');
    } catch (err) {
      const msg = err.response?.data?.error || 'Save failed';
      setError(msg);
      toast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAiRewrite = async () => {
    if (!form.tasks_done?.trim()) return;
    setAiWriting(true);
    try {
      const res = await aiLogbookHelper({ notes: form.tasks_done, hours: form.hours_rendered, location: form.location });
      setForm((f) => ({ ...f, tasks_done: res.data.result }));
    } catch {
      // silently fail — user keeps their original text
    } finally {
      setAiWriting(false);
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('OJT Logbook', 14, 20);
    doc.setFontSize(11);
    doc.text(`Total Hours: ${totalHours.toFixed(1)} / ${requiredHours}h`, 14, 30);
    doc.text(`Days Logged: ${stats?.total_days || 0}`, 14, 37);

    let y = 50;
    entries.forEach((e) => {
      if (y > 270) { doc.addPage(); y = 20; }
      const date = new Date(e.entry_date).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`${date} — ${e.hours_rendered}h`, 14, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      if (e.location) { doc.text(`Location: ${e.location}`, 14, y); y += 5; }
      if (e.tasks_done) {
        const lines = doc.splitTextToSize(e.tasks_done, 180);
        doc.text(lines, 14, y);
        y += lines.length * 5;
      }
      y += 6;
    });

    doc.save('ojt-logbook.pdf');
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this entry?')) return;
    await deleteLogEntry(id);
    setEntries(entries.filter((e) => e.id !== id));
    const res = await getLogbookStats();
    setStats(res.data);
  };

  if (loading) return (
    <div className="page">
      <div className="page-header"><div className="skeleton" style={{height:'24px',width:'120px',borderRadius:'6px'}} /></div>
      <div className="logbook-stats">{Array.from({length:3}).map((_,i) => <SkeletonStat key={i} />)}</div>
      <SkeletonList rows={5} />
    </div>
  );

  const totalHours = parseFloat(stats?.total_hours || 0);
  const requiredHours = stats?.required_hours || 486;
  const pct = Math.min(100, Math.round((totalHours / requiredHours) * 100));

  const months = ['all', ...new Set(entries.map((e) => e.entry_date.slice(0, 7)))].reverse();
  const filtered = entries
    .filter((e) => monthFilter === 'all' || e.entry_date.startsWith(monthFilter))
    .filter((e) => !search || e.tasks_done?.toLowerCase().includes(search.toLowerCase()) || e.location?.toLowerCase().includes(search.toLowerCase()));
  const monthLabel = (m) => m === 'all' ? 'All' : new Date(m + '-01').toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Logbook</h1>
          <p className="page-subtitle">Track your daily OJT hours</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {entries.length > 0 && <button className="btn-ghost" onClick={exportPDF}>Export PDF</button>}
          <button className="btn-primary" onClick={() => openForm()}>+ Log Today</button>
        </div>
      </div>

      <div className="logbook-stats">
        <div className="stat-card">
          <div className="stat-label">Total Hours</div>
          <div className="stat-value">{totalHours.toFixed(1)}</div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="stat-pct">{pct}% of {requiredHours}h</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Days Logged</div>
          <div className="stat-value">{stats?.total_days || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Remaining</div>
          <div className="stat-value">{Math.max(0, requiredHours - totalHours).toFixed(1)}h</div>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editTarget ? 'Edit Entry' : 'Log Entry'}</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <form onSubmit={handleSave} className="modal-form">
              {error && <div className="form-error">{error}</div>}
              <div className="form-row">
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" value={form.entry_date} onChange={set('entry_date')} required />
                </div>
                <div className="form-group">
                  <label>Hours Rendered</label>
                  <input type="number" step="0.5" min="0" max="24" value={form.hours_rendered} onChange={set('hours_rendered')} />
                </div>
              </div>
              <div className="form-group">
                <label>Location / Company</label>
                <input value={form.location} onChange={set('location')} placeholder="e.g. Ayala Office, WFH" />
              </div>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <label style={{ margin: 0 }}>Tasks Done</label>
                  <button
                    type="button"
                    className="ai-inline-btn"
                    onClick={handleAiRewrite}
                    disabled={aiWriting || !form.tasks_done?.trim()}
                    title="Rewrite with AI"
                  >
                    {aiWriting ? '✦ Rewriting...' : '✦ Polish with AI'}
                  </button>
                </div>
                <textarea rows={14} value={form.tasks_done} onChange={set('tasks_done')} placeholder="Rough notes are fine — AI can polish them for you" />
              </div>
              <div className="form-group">
                <label>Mood</label>
                <div className="mood-picker">
                  {MOODS.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      className={`mood-btn ${form.mood === m.value ? 'active' : ''}`}
                      onClick={() => setForm({ ...form, mood: m.value })}
                    >
                      <span>{m.emoji}</span>
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Entry'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {entries.length > 0 && (
        <div className="search-bar-wrap">
          <input className="search-bar" placeholder="Search entries..." value={search} onChange={(e) => setSearch(e.target.value)} />
          {search && <button className="search-clear" onClick={() => setSearch('')}>×</button>}
        </div>
      )}

      {entries.length > 0 && months.length > 2 && (
        <div className="filter-tabs" style={{ marginBottom: '16px' }}>
          {months.map((m) => (
            <button key={m} className={`filter-tab ${monthFilter === m ? 'active' : ''}`} onClick={() => setMonthFilter(m)}>
              {monthLabel(m)}
              <span className="tab-count">
                {m === 'all' ? entries.length : entries.filter((e) => e.entry_date.startsWith(m)).length}
              </span>
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📓</div>
          <h3>No entries yet</h3>
          <p>Start logging your daily OJT hours</p>
          <button className="btn-primary" onClick={() => openForm()}>Log Today</button>
        </div>
      ) : (
        <div className="logbook-list">
          {filtered.map((e) => {
            const mood = MOODS.find((m) => m.value === e.mood);
            return (
              <div key={e.id} className="logbook-entry">
                <div className="entry-left">
                  <div className="entry-date-badge">
                    <div className="entry-month">{new Date(e.entry_date).toLocaleDateString('en-PH', { month: 'short' })}</div>
                    <div className="entry-day">{new Date(e.entry_date).getDate()}</div>
                  </div>
                </div>
                <div className="entry-body">
                  <div className="entry-meta">
                    <span className="entry-hours-badge">{e.hours_rendered}h</span>
                    {e.location && <span className="entry-location">📍 {e.location}</span>}
                    {mood && <span className="entry-mood-badge">{mood.emoji} {mood.label}</span>}
                  </div>
                  {e.tasks_done && <p className="entry-tasks">{e.tasks_done}</p>}
                </div>
                <div className="entry-actions">
                  <button className="btn-ghost" onClick={() => openForm(e)}>Edit</button>
                  <button className="btn-ghost danger" onClick={() => handleDelete(e.id)}>Del</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

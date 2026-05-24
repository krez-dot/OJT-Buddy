import { useState, useEffect } from 'react';
import { getCompanies, createCompany, updateCompany, deleteCompany, getCompanyHistory, aiCompanyResearch, aiSuggestCompanies, aiAutofillCompany } from '../api';
import { useToast } from '../context/ToastContext';
import { SkeletonList } from '../components/Skeleton';
import { History } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const STATUSES = ['wishlist', 'applied', 'interview', 'accepted', 'rejected'];
const STATUS_COLORS = { wishlist: '#94a3b8', applied: '#3b82f6', interview: '#f59e0b', accepted: '#22c55e', rejected: '#ef4444' };
const PRIORITIES = ['high', 'normal', 'low'];
const PRIORITY_COLORS = { high: '#ef4444', normal: '#3b82f6', low: '#94a3b8' };

const EMPTY_FORM = { name: '', address: '', contact_person: '', email: '', phone: '', status: 'wishlist', priority: 'normal', notes: '', applied_at: '', deadline: '' };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function HistoryPanel({ companyId }) {
  const [logs, setLogs] = useState(null);

  useEffect(() => {
    getCompanyHistory(companyId).then(r => setLogs(r.data));
  }, [companyId]);

  if (!logs) return <div className="history-loading">Loading…</div>;
  if (logs.length === 0) return <p className="history-empty">No status changes recorded yet.</p>;

  return (
    <div className="history-timeline">
      {logs.map((l, i) => (
        <div key={l.id} className="history-item">
          <div className="history-dot" style={{ background: STATUS_COLORS[l.status] }} />
          {i < logs.length - 1 && <div className="history-line" />}
          <div className="history-body">
            <span className="history-status" style={{ color: STATUS_COLORS[l.status] }}>{l.status}</span>
            {l.note && <span className="history-note"> — {l.note}</span>}
            <span className="history-date">
              {new Date(l.changed_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Companies() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [openHistory, setOpenHistory] = useState(null);
  const [aiResearch, setAiResearch] = useState({});
  const [aiResearching, setAiResearching] = useState({});
  const [suggestions, setSuggestions] = useState(null);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestLocation, setSuggestLocation] = useState('');
  const [autofilling, setAutofilling] = useState(false);
  const toast = useToast();

  useEffect(() => {
    getCompanies().then((r) => setCompanies(r.data)).finally(() => setLoading(false));
  }, []);

  const openAdd = () => { setForm(EMPTY_FORM); setEditTarget(null); setShowModal(true); setError(''); };
  const openEdit = (c) => { setForm({ ...c, applied_at: c.applied_at?.slice(0,10) || '', deadline: c.deadline?.slice(0,10) || '' }); setEditTarget(c); setShowModal(true); setError(''); };
  const closeModal = () => setShowModal(false);
  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  const validate = () => {
    if (!form.name?.trim()) return 'Company name is required';
    if (form.email && !EMAIL_RE.test(form.email)) return 'Invalid email address';
    return null;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const validationErr = validate();
    if (validationErr) { setError(validationErr); return; }
    setSaving(true); setError('');
    try {
      if (editTarget) {
        const res = await updateCompany(editTarget.id, form);
        setCompanies(companies.map((c) => c.id === editTarget.id ? res.data : c));
      } else {
        const res = await createCompany(form);
        setCompanies([res.data, ...companies]);
      }
      toast(editTarget ? 'Company updated!' : 'Company added!');
      closeModal();
    } catch (err) {
      const msg = err.response?.data?.error || 'Save failed';
      setError(msg);
      toast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this company?')) return;
    await deleteCompany(id);
    setCompanies(companies.filter((c) => c.id !== id));
    if (openHistory === id) setOpenHistory(null);
  };

  const handleStatusChange = async (company, newStatus) => {
    const res = await updateCompany(company.id, { ...company, status: newStatus });
    setCompanies(companies.map((c) => c.id === company.id ? res.data : c));
    setOpenHistory(null);
  };

  const toggleHistory = (id) => setOpenHistory(openHistory === id ? null : id);

  const handleResearch = async (company) => {
    if (aiResearch[company.id]) { setAiResearch((p) => ({ ...p, [company.id]: null })); return; }
    setAiResearching((p) => ({ ...p, [company.id]: true }));
    try {
      const res = await aiCompanyResearch({ company_name: company.name });
      setAiResearch((p) => ({ ...p, [company.id]: res.data.result }));
    } catch {
      setAiResearch((p) => ({ ...p, [company.id]: 'Could not fetch info. Try again.' }));
    } finally {
      setAiResearching((p) => ({ ...p, [company.id]: false }));
    }
  };

  const handleSuggest = async () => {
    if (suggestions) { setSuggestions(null); return; }
    setSuggesting(true);
    try {
      const res = await aiSuggestCompanies({ course: user?.course || 'BSIT', skills: '', location: suggestLocation || 'Philippines' });
      setSuggestions(res.data.suggestions);
    } catch {
      toast('Could not fetch suggestions. Try again.', 'error');
    } finally {
      setSuggesting(false);
    }
  };

  const handleAutofill = async () => {
    if (!form.name?.trim()) return;
    setAutofilling(true);
    try {
      const res = await aiAutofillCompany({ name: form.name });
      setForm((f) => ({
        ...f,
        address: res.data.address || f.address,
        notes: res.data.notes || f.notes,
        contact_person: res.data.contact_person || f.contact_person,
      }));
      toast('Fields filled by AI!');
    } catch {
      toast('Could not autofill. Try again.', 'error');
    } finally {
      setAutofilling(false);
    }
  };

  const addSuggested = (s) => {
    setForm({ ...EMPTY_FORM, name: s.name, notes: s.why });
    setEditTarget(null);
    setShowModal(true);
    setError('');
  };

  const filtered = companies
    .filter((c) => filter === 'all' || c.status === filter)
    .filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.address?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="page"><div className="page-header"><div className="skeleton" style={{height:'24px',width:'140px',borderRadius:'6px'}} /></div><SkeletonList rows={4} /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Companies</h1>
          <p className="page-subtitle">Track your OJT application pipeline</p>
        </div>
        <div className="companies-header-actions" style={{ display: 'flex', gap: '8px' }}>
          <input
            className="suggest-location-input"
            placeholder="City (e.g. Tarlac, Cebu...)"
            value={suggestLocation}
            onChange={(e) => setSuggestLocation(e.target.value)}
          />
          <button className={`btn-ghost ${suggestions ? 'active-ghost' : ''}`} onClick={handleSuggest} disabled={suggesting}>
            {suggesting ? '✦ Finding...' : '✦ Suggest'}
          </button>
          <button className="btn-primary" onClick={openAdd}>+ Add Company</button>
        </div>
      </div>

      <div className="search-bar-wrap">
        <input
          className="search-bar"
          placeholder="Search companies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && <button className="search-clear" onClick={() => setSearch('')}>×</button>}
      </div>

      {suggestions && (
        <div className="ai-suggest-panel">
          <div className="ai-suggest-label">✦ AI Company Suggestions for {user?.course || 'BSIT'}</div>
          <div className="ai-suggest-list">
            {suggestions.map((s, i) => (
              <div key={i} className="ai-suggest-item">
                <div className="ai-suggest-name">{s.name}</div>
                <div className="ai-suggest-desc">{s.desc} — {s.why}</div>
                <button className="ai-suggest-add" onClick={() => addSuggested(s)}>+ Add to pipeline</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="filter-tabs">
        {['all', ...STATUSES].map((s) => (
          <button key={s} className={`filter-tab ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            <span className="tab-count">{s === 'all' ? companies.length : companies.filter((c) => c.status === s).length}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏢</div>
          <h3>No companies yet</h3>
          <p>Start by adding a company to your wishlist</p>
          <button className="btn-primary" onClick={openAdd}>Add Company</button>
        </div>
      ) : (
        <div className="company-list">
          {filtered.map((c) => (
            <div key={c.id} className="company-card">
              <div className="company-card-header">
                <div className="company-info">
                  <h3 className="company-name">{c.name}</h3>
                  {c.address && <p className="company-address">{c.address}</p>}
                </div>
                <div className="company-badges">
                  <span className="badge" style={{ background: PRIORITY_COLORS[c.priority] + '22', color: PRIORITY_COLORS[c.priority] }}>
                    {c.priority}
                  </span>
                </div>
              </div>

              <div className="company-meta">
                {c.contact_person && <span>👤 {c.contact_person}</span>}
                {c.email && <span>✉️ {c.email}</span>}
                {c.phone && <span>📞 {c.phone}</span>}
                {c.deadline && <span>⏰ Due {new Date(c.deadline).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}</span>}
              </div>

              {c.notes && <p className="company-notes">{c.notes}</p>}

              <div className="company-footer">
                <div className="status-select-row">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      className={`status-pill ${c.status === s ? 'active' : ''}`}
                      style={c.status === s ? { background: STATUS_COLORS[s], color: '#fff', borderColor: STATUS_COLORS[s] } : {}}
                      onClick={() => handleStatusChange(c, s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <div className="card-actions">
                  <button
                    className={`btn-ghost ${openHistory === c.id ? 'active-ghost' : ''}`}
                    onClick={() => toggleHistory(c.id)}
                    title="Status history"
                  >
                    <History size={14} style={{ marginRight: 4 }} />
                    History
                  </button>
                  <button
                    className={`btn-ghost ${aiResearch[c.id] ? 'active-ghost' : ''}`}
                    onClick={() => handleResearch(c)}
                    disabled={aiResearching[c.id]}
                    title="AI research"
                  >
                    {aiResearching[c.id] ? '✦ ...' : '✦ Research'}
                  </button>
                  <button className="btn-ghost" onClick={() => openEdit(c)}>Edit</button>
                  <button className="btn-ghost danger" onClick={() => handleDelete(c.id)}>Delete</button>
                </div>
              </div>

              {aiResearch[c.id] && (
                <div className="ai-research-panel">
                  <div className="ai-research-label">✦ AI Research</div>
                  <p className="ai-research-text">{aiResearch[c.id]}</p>
                </div>
              )}

              {openHistory === c.id && (
                <div className="history-panel">
                  <div className="history-panel-title">Status History</div>
                  <HistoryPanel companyId={c.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editTarget ? 'Edit Company' : 'Add Company'}</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <form onSubmit={handleSave} className="modal-form">
              {error && <div className="form-error">{error}</div>}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <label style={{ margin: 0 }}>Company Name *</label>
                  <button
                    type="button"
                    className="ai-inline-btn"
                    onClick={handleAutofill}
                    disabled={autofilling || !form.name?.trim()}
                    title="Autofill details with AI"
                  >
                    {autofilling ? '✦ Filling...' : '✦ Autofill with AI'}
                  </button>
                </div>
                <input value={form.name} onChange={set('name')} required placeholder="Type a company name, then hit Autofill" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <select value={form.status} onChange={set('status')}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select value={form.priority} onChange={set('priority')}>
                    {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Address</label>
                <input value={form.address} onChange={set('address')} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Contact Person</label>
                  <input value={form.contact_person} onChange={set('contact_person')} />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input type="tel" value={form.phone} onChange={set('phone')} placeholder="e.g. 09xx-xxx-xxxx" />
                </div>
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={form.email} onChange={set('email')} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Applied At</label>
                  <input type="date" value={form.applied_at} onChange={set('applied_at')} />
                </div>
                <div className="form-group">
                  <label>Deadline</label>
                  <input type="date" value={form.deadline} onChange={set('deadline')} />
                </div>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea value={form.notes} onChange={set('notes')} rows={7} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-ghost" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

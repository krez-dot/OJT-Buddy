import { useState, useEffect } from 'react';
import { getCompanies, createCompany, updateCompany, deleteCompany } from '../api';

const STATUSES = ['wishlist', 'applied', 'interview', 'accepted', 'rejected'];
const STATUS_COLORS = { wishlist: '#94a3b8', applied: '#3b82f6', interview: '#f59e0b', accepted: '#22c55e', rejected: '#ef4444' };
const PRIORITIES = ['high', 'normal', 'low'];
const PRIORITY_COLORS = { high: '#ef4444', normal: '#3b82f6', low: '#94a3b8' };

const EMPTY_FORM = { name: '', address: '', contact_person: '', email: '', phone: '', status: 'wishlist', priority: 'normal', notes: '', applied_at: '', deadline: '' };

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filter, setFilter] = useState('all');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getCompanies().then((r) => setCompanies(r.data)).finally(() => setLoading(false));
  }, []);

  const openAdd = () => { setForm(EMPTY_FORM); setEditTarget(null); setShowModal(true); setError(''); };
  const openEdit = (c) => { setForm({ ...c, applied_at: c.applied_at?.slice(0,10) || '', deadline: c.deadline?.slice(0,10) || '' }); setEditTarget(c); setShowModal(true); setError(''); };
  const closeModal = () => setShowModal(false);
  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      if (editTarget) {
        const res = await updateCompany(editTarget.id, form);
        setCompanies(companies.map((c) => c.id === editTarget.id ? res.data : c));
      } else {
        const res = await createCompany(form);
        setCompanies([res.data, ...companies]);
      }
      closeModal();
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this company?')) return;
    await deleteCompany(id);
    setCompanies(companies.filter((c) => c.id !== id));
  };

  const handleStatusChange = async (company, newStatus) => {
    const res = await updateCompany(company.id, { ...company, status: newStatus });
    setCompanies(companies.map((c) => c.id === company.id ? res.data : c));
  };

  const filtered = filter === 'all' ? companies : companies.filter((c) => c.status === filter);

  if (loading) return <div className="page-loading">Loading...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Companies</h1>
          <p className="page-subtitle">Track your OJT application pipeline</p>
        </div>
        <button className="btn-primary" onClick={openAdd}>+ Add Company</button>
      </div>

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
                {c.deadline && <span>⏰ Due {new Date(c.deadline).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}</span>}
              </div>

              {c.notes && <p className="company-notes">{c.notes}</p>}

              <div className="company-footer">
                <div className="status-select-row">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      className={`status-pill ${c.status === s ? 'active' : ''}`}
                      style={c.status === s ? { background: STATUS_COLORS[s], color: '#fff' } : {}}
                      onClick={() => handleStatusChange(c, s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <div className="card-actions">
                  <button className="btn-ghost" onClick={() => openEdit(c)}>Edit</button>
                  <button className="btn-ghost danger" onClick={() => handleDelete(c.id)}>Delete</button>
                </div>
              </div>
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
                <label>Company Name *</label>
                <input value={form.name} onChange={set('name')} required />
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
                  <label>Email</label>
                  <input type="email" value={form.email} onChange={set('email')} />
                </div>
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
                <textarea value={form.notes} onChange={set('notes')} rows={3} />
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

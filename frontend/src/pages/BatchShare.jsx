import { useState, useEffect } from 'react';
import { getShares, createShare, getCompanies } from '../api';

const STARS = [1, 2, 3, 4, 5];

export default function BatchShare() {
  const [shares, setShares] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ company_id: '', review: '', rating: 5, is_public: true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getShares(), getCompanies()])
      .then(([s, c]) => { setShares(s.data); setCompanies(c.data); })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const res = await createShare(form);
      const newShare = { ...res.data, company_name: companies.find((c) => c.id == form.company_id)?.name, author_name: 'You' };
      setShares([newShare, ...shares]);
      setShowForm(false);
      setForm({ company_id: '', review: '', rating: 5, is_public: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Share failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page-loading">Loading...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Batch Share</h1>
          <p className="page-subtitle">Share your OJT company experience with batchmates</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>+ Share Review</button>
      </div>

      {showForm && (
        <div className="card add-question-card">
          <h3>Share a Company Review</h3>
          <form onSubmit={handleSubmit}>
            {error && <div className="form-error">{error}</div>}
            <div className="form-group">
              <label>Company</label>
              <select value={form.company_id} onChange={(e) => setForm({ ...form, company_id: e.target.value })} required>
                <option value="">Select company...</option>
                {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Rating</label>
              <div className="star-picker">
                {STARS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`star-btn ${s <= form.rating ? 'active' : ''}`}
                    onClick={() => setForm({ ...form, rating: s })}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Review</label>
              <textarea rows={4} value={form.review} onChange={(e) => setForm({ ...form, review: e.target.value })} placeholder="How was the company? What tasks did you do? Would you recommend it?" required />
            </div>
            <div className="form-group checkbox-group">
              <label>
                <input type="checkbox" checked={form.is_public} onChange={(e) => setForm({ ...form, is_public: e.target.checked })} />
                Share publicly with all batchmates
              </label>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Sharing...' : 'Post Review'}</button>
            </div>
          </form>
        </div>
      )}

      {shares.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🌐</div>
          <h3>No reviews yet</h3>
          <p>Be the first to share your company experience</p>
        </div>
      ) : (
        <div className="shares-list">
          {shares.map((s) => (
            <div key={s.id} className="share-card">
              <div className="share-header">
                <div className="share-company">
                  <strong>{s.company_name}</strong>
                  <div className="share-stars">
                    {STARS.map((n) => (
                      <span key={n} className={n <= s.rating ? 'star active' : 'star'}>★</span>
                    ))}
                  </div>
                </div>
                <div className="share-meta">
                  <span className="share-author">by {s.author_name}</span>
                  {s.batch && <span className="share-batch">{s.batch}</span>}
                  <span className="share-date">{new Date(s.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>
              <p className="share-review">{s.review}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

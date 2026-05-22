import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateMe } from '../api';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    course: user?.course || '',
    batch: user?.batch || '',
    ojt_start_date: user?.ojt_start_date?.slice(0, 10) || '',
    required_hours: user?.required_hours || 486,
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setSuccess(false); setError('');
    try {
      const res = await updateMe(form);
      setUser(res.data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Profile & Settings</h1>
          <p className="page-subtitle">Update your OJT information</p>
        </div>
      </div>

      <div className="profile-layout">
        <div className="profile-avatar-card card">
          <div className="profile-avatar-big">{user?.name?.[0]?.toUpperCase()}</div>
          <div className="profile-name">{user?.name}</div>
          <div className="profile-email">{user?.email}</div>
          <div className="profile-meta">
            <div className="profile-meta-item">
              <span className="profile-meta-label">Course</span>
              <span className="profile-meta-value">{user?.course || '—'}</span>
            </div>
            <div className="profile-meta-item">
              <span className="profile-meta-label">Batch</span>
              <span className="profile-meta-value">{user?.batch || '—'}</span>
            </div>
            <div className="profile-meta-item">
              <span className="profile-meta-label">Required Hours</span>
              <span className="profile-meta-value">{user?.required_hours}h</span>
            </div>
            <div className="profile-meta-item">
              <span className="profile-meta-label">OJT Start</span>
              <span className="profile-meta-value">
                {user?.ojt_start_date ? new Date(user.ojt_start_date).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="card-title">Edit Information</h2>
          <form onSubmit={handleSubmit} className="profile-form">
            {error && <div className="form-error">{error}</div>}
            {success && <div className="form-success">Changes saved!</div>}
            <div className="form-group">
              <label>Full Name</label>
              <input value={form.name} onChange={set('name')} required />
            </div>
            <div className="form-group">
              <label>Course</label>
              <input value={form.course} onChange={set('course')} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Batch</label>
                <input value={form.batch} onChange={set('batch')} placeholder="e.g. 2025A" />
              </div>
              <div className="form-group">
                <label>Required Hours</label>
                <input type="number" value={form.required_hours} onChange={set('required_hours')} min={1} />
              </div>
            </div>
            <div className="form-group">
              <label>OJT Start Date</label>
              <input type="date" value={form.ojt_start_date} onChange={set('ojt_start_date')} />
            </div>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

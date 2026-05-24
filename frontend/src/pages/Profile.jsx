import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateMe, getLogbookStats, getLogbook, aiResumeSummary, changePassword, deleteAccount } from '../api';
import { useToast } from '../context/ToastContext';
import { jsPDF } from 'jspdf';

const THEMES = {
  emerald: { label: 'Emerald', accent: '#059669', hover: '#047857', light: '#ecfdf5' },
  blue:    { label: 'Blue',    accent: '#3b82f6', hover: '#2563eb', light: '#eff6ff' },
  purple:  { label: 'Purple',  accent: '#8b5cf6', hover: '#7c3aed', light: '#f5f3ff' },
  rose:    { label: 'Rose',    accent: '#f43f5e', hover: '#e11d48', light: '#fff1f2' },
  orange:  { label: 'Orange',  accent: '#f97316', hover: '#ea580c', light: '#fff7ed' },
  cyan:    { label: 'Cyan',    accent: '#06b6d4', hover: '#0891b2', light: '#ecfeff' },
};

function applyTheme(key) {
  const t = THEMES[key];
  if (!t) return;
  document.documentElement.style.setProperty('--accent', t.accent);
  document.documentElement.style.setProperty('--accent-hover', t.hover);
  document.documentElement.style.setProperty('--accent-light', t.light);
  document.documentElement.style.setProperty('--sidebar-active', t.accent);
  localStorage.setItem('ojt-theme', key);
}

function generateCertificate(user, stats) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const cx = W / 2;

  // Background
  doc.setFillColor(250, 250, 255);
  doc.rect(0, 0, W, H, 'F');

  // Emerald border (double)
  doc.setDrawColor(5, 150, 105);
  doc.setLineWidth(4);
  doc.rect(8, 8, W - 16, H - 16);
  doc.setLineWidth(1);
  doc.rect(12, 12, W - 24, H - 24);

  // Corner accents
  const accent = () => { doc.setFillColor(5, 150, 105); };
  accent(); doc.rect(8, 8, 18, 2, 'F');
  accent(); doc.rect(8, 8, 2, 18, 'F');
  accent(); doc.rect(W - 26, 8, 18, 2, 'F');
  accent(); doc.rect(W - 10, 8, 2, 18, 'F');
  accent(); doc.rect(8, H - 10, 18, 2, 'F');
  accent(); doc.rect(8, H - 26, 2, 18, 'F');
  accent(); doc.rect(W - 26, H - 10, 18, 2, 'F');
  accent(); doc.rect(W - 10, H - 26, 2, 18, 'F');

  // Header label
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(5, 150, 105);
  doc.text('OJT BUDDY  ·  CERTIFICATE OF COMPLETION', cx, 28, { align: 'center', charSpace: 2 });

  // Divider line
  doc.setDrawColor(5, 150, 105);
  doc.setLineWidth(0.4);
  doc.line(cx - 60, 32, cx + 60, 32);

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(36);
  doc.setTextColor(15, 23, 42);
  doc.text('Certificate of Completion', cx, 58, { align: 'center' });

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(100, 116, 139);
  doc.text('This is to certify that', cx, 72, { align: 'center' });

  // Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(5, 150, 105);
  doc.text(user.name || 'Student Name', cx, 90, { align: 'center' });

  // Name underline
  doc.setDrawColor(5, 150, 105);
  doc.setLineWidth(0.5);
  const nameW = doc.getTextWidth(user.name || 'Student Name');
  doc.line(cx - nameW / 2, 93, cx + nameW / 2, 93);

  // Body text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(51, 65, 85);
  const totalHours = parseFloat(stats?.total_hours || 0).toFixed(1);
  const totalDays = stats?.total_days || 0;
  const required = user.required_hours || 486;
  doc.text(
    `has successfully completed the On-the-Job Training (OJT) program`,
    cx, 106, { align: 'center' }
  );
  doc.text(
    `with a total of ${totalHours} hours rendered over ${totalDays} days`,
    cx, 114, { align: 'center' }
  );
  if (user.course) {
    doc.text(`under the ${user.course} program.`, cx, 122, { align: 'center' });
  }

  // Stats boxes
  const boxY = 134;
  const boxes = [
    { label: 'Hours Rendered', value: `${totalHours}h` },
    { label: 'Days Completed', value: `${totalDays}` },
    { label: 'Required Hours', value: `${required}h` },
    { label: 'Batch', value: user.batch || '—' },
  ];
  const boxW = 44; const boxH = 18; const gap = 8;
  const totalW = boxes.length * boxW + (boxes.length - 1) * gap;
  let bx = cx - totalW / 2;
  boxes.forEach(b => {
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(5, 150, 105);
    doc.setLineWidth(0.5);
    doc.roundedRect(bx, boxY, boxW, boxH, 3, 3, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(5, 150, 105);
    doc.text(b.value, bx + boxW / 2, boxY + 8, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(b.label.toUpperCase(), bx + boxW / 2, boxY + 14, { align: 'center', charSpace: 0.5 });
    bx += boxW + gap;
  });

  // Date issued
  const issued = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text(`Issued on ${issued}  ·  Generated by OJT Buddy`, cx, H - 18, { align: 'center' });

  doc.save(`OJT_Certificate_${(user.name || 'Student').replace(/\s+/g, '_')}.pdf`);
}

export default function Profile() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: user?.name || '',
    course: user?.course || '',
    batch: user?.batch || '',
    ojt_start_date: user?.ojt_start_date?.slice(0, 10) || '',
    required_hours: user?.required_hours || 486,
  });
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [resumeSummary, setResumeSummary] = useState(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [activeTheme, setActiveTheme] = useState(localStorage.getItem('ojt-theme') || 'emerald');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [fontSize, setFontSize] = useState(localStorage.getItem('ojt-font-size') || 'normal');
  const [highContrast, setHighContrast] = useState(localStorage.getItem('ojt-high-contrast') === 'true');
  const toast = useToast();

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setSuccess(false); setError('');
    try {
      const res = await updateMe(form);
      setUser(res.data);
      setSuccess(true);
      toast('Profile updated!');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const msg = err.response?.data?.error || 'Save failed';
      setError(msg);
      toast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleResumeSummary = async () => {
    if (resumeSummary) { setResumeSummary(null); return; }
    setResumeLoading(true);
    try {
      const [logRes, statsRes] = await Promise.all([getLogbook(), getLogbookStats()]);
      const accepted = null;
      const res = await aiResumeSummary({
        entries: logRes.data,
        course: user?.course,
        company: accepted?.name,
      });
      setResumeSummary(res.data.summary);
    } catch {
      toast('Could not generate summary. Try again.', 'error');
    } finally {
      setResumeLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(resumeSummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm_password) { setPwError('Passwords do not match'); return; }
    setPwSaving(true); setPwError(''); setPwSuccess(false);
    try {
      await changePassword({ current_password: pwForm.current_password, new_password: pwForm.new_password });
      setPwSuccess(true);
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
      toast('Password changed!');
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (err) {
      setPwError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setPwSaving(false);
    }
  };

  const handleThemeChange = (key) => {
    applyTheme(key);
    setActiveTheme(key);
    toast(`Theme changed to ${THEMES[key].label}!`);
  };

  const handleFontSize = (size) => {
    setFontSize(size);
    localStorage.setItem('ojt-font-size', size);
    if (size === 'normal') {
      document.documentElement.removeAttribute('data-font-size');
    } else {
      document.documentElement.setAttribute('data-font-size', size);
    }
  };

  const handleHighContrast = () => {
    const next = !highContrast;
    setHighContrast(next);
    localStorage.setItem('ojt-high-contrast', next);
    if (next) {
      document.documentElement.setAttribute('data-contrast', 'high');
    } else {
      document.documentElement.removeAttribute('data-contrast');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') return;
    setDeleting(true);
    try {
      await deleteAccount();
      localStorage.removeItem('token');
      setUser(null);
      navigate('/');
    } catch {
      toast('Failed to delete account', 'error');
      setDeleting(false);
    }
  };

  const handleCertificate = async () => {
    setGenerating(true);
    try {
      const res = await getLogbookStats();
      generateCertificate(user, res.data);
      toast('Certificate downloaded!');
    } catch {
      toast('Failed to generate certificate', 'error');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Profile & Settings</h1>
          <p className="page-subtitle">Update your OJT information</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className={`btn-ghost ${resumeSummary ? 'active-ghost' : ''}`} onClick={handleResumeSummary} disabled={resumeLoading}>
            {resumeLoading ? '✦ Writing...' : '✦ Resume Summary'}
          </button>
          <button className="btn-primary" onClick={handleCertificate} disabled={generating}>
            {generating ? 'Generating...' : '🎓 Download Certificate'}
          </button>
        </div>
      </div>

      {resumeSummary && (
        <div className="resume-summary-panel">
          <div className="resume-summary-label">✦ AI Resume Summary — copy this into your resume</div>
          <p className="resume-summary-text">{resumeSummary}</p>
          <button className="resume-copy-btn" onClick={handleCopy}>{copied ? '✓ Copied!' : 'Copy to clipboard'}</button>
        </div>
      )}

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
              <label htmlFor="pf-name">Full Name</label>
              <input id="pf-name" value={form.name} onChange={set('name')} required />
            </div>
            <div className="form-group">
              <label htmlFor="pf-course">Course</label>
              <input id="pf-course" value={form.course} onChange={set('course')} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="pf-batch">Batch</label>
                <input id="pf-batch" value={form.batch} onChange={set('batch')} placeholder="e.g. 2025A" />
              </div>
              <div className="form-group">
                <label htmlFor="pf-hours">Required Hours</label>
                <input id="pf-hours" type="number" value={form.required_hours} onChange={set('required_hours')} min={1} />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="pf-start">OJT Start Date</label>
              <input id="pf-start" type="date" value={form.ojt_start_date} onChange={set('ojt_start_date')} />
            </div>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>

      {/* Password Change */}
      <div className="card" style={{ marginTop: '20px' }}>
        <h2 className="card-title">Change Password</h2>
        <form onSubmit={handlePasswordChange} className="profile-form">
          {pwError && <div className="form-error">{pwError}</div>}
          {pwSuccess && <div className="form-success">Password changed successfully!</div>}
          <div className="form-group">
            <label htmlFor="pw-current">Current Password</label>
            <input id="pw-current" type="password" value={pwForm.current_password} onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="pw-new">New Password</label>
              <input id="pw-new" type="password" value={pwForm.new_password} onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })} required minLength={6} />
            </div>
            <div className="form-group">
              <label htmlFor="pw-confirm">Confirm New Password</label>
              <input id="pw-confirm" type="password" value={pwForm.confirm_password} onChange={(e) => setPwForm({ ...pwForm, confirm_password: e.target.value })} required />
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={pwSaving}>{pwSaving ? 'Changing...' : 'Change Password'}</button>
        </form>
      </div>

      {/* Theme Picker */}
      <div className="card" style={{ marginTop: '20px' }}>
        <h2 className="card-title">Accent Color</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '14px' }}>Personalize the app's color theme.</p>
        <div className="theme-swatches">
          {Object.entries(THEMES).map(([key, t]) => (
            <button
              key={key}
              className={`theme-swatch ${activeTheme === key ? 'active' : ''}`}
              style={{ background: t.accent }}
              title={t.label}
              onClick={() => handleThemeChange(key)}
            >
              {activeTheme === key && <span className="theme-check">✓</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Accessibility */}
      <div className="card" style={{ marginTop: '20px' }}>
        <h2 className="card-title">Accessibility</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '18px' }}>Adjust the app to better suit your needs.</p>

        <div className="a11y-section">
          <div className="a11y-label">Text Size</div>
          <div className="a11y-options">
            {[{ key: 'normal', label: 'Normal' }, { key: 'large', label: 'Large' }, { key: 'xl', label: 'Extra Large' }].map(({ key, label }) => (
              <button
                key={key}
                className={`a11y-size-btn ${fontSize === key ? 'active' : ''}`}
                onClick={() => handleFontSize(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="a11y-section" style={{ marginTop: '16px' }}>
          <div className="a11y-label">High Contrast</div>
          <button
            className={`a11y-toggle ${highContrast ? 'active' : ''}`}
            onClick={handleHighContrast}
            aria-pressed={highContrast}
          >
            <span className="a11y-toggle-thumb" />
            <span className="a11y-toggle-label">{highContrast ? 'On' : 'Off'}</span>
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card danger-zone" style={{ marginTop: '20px' }}>
        <h2 className="card-title" style={{ color: 'var(--danger)' }}>Danger Zone</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '14px' }}>
          Permanently delete your account and all your data. This cannot be undone.
        </p>
        <div className="form-group">
          <label htmlFor="delete-confirm">Type <strong>DELETE</strong> to confirm</label>
          <input
            id="delete-confirm"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder="DELETE"
            style={{ maxWidth: '240px' }}
          />
        </div>
          <br></br>
        <button
          className="btn-danger"
          onClick={handleDeleteAccount}
          disabled={deleteConfirm !== 'DELETE' || deleting}
        >
          {deleting ? 'Deleting...' : 'Delete My Account'}
        </button>
      </div>
    </div>
  );
}

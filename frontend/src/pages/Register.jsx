import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    course: 'BS Information Technology',
    batch: '', ojt_start_date: '', required_hours: 486,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signin } = useAuth();
  const navigate = useNavigate();

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await register(form);
      signin(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide">
        <div className="auth-header">
          <span className="auth-logo">🎓</span>
          <h1>OJT Buddy</h1>
          <p>Create your account</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="form-error">{error}</div>}
          <div className="form-row">
            <div className="form-group">
              <label>Full Name</label>
              <input value={form.name} onChange={set('name')} placeholder="Juan Dela Cruz" required />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required />
            </div>
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={form.password} onChange={set('password')} placeholder="••••••••" required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Course</label>
              <input value={form.course} onChange={set('course')} />
            </div>
            <div className="form-group">
              <label>Batch (e.g. 2025A)</label>
              <input value={form.batch} onChange={set('batch')} placeholder="2025A" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>OJT Start Date</label>
              <input type="date" value={form.ojt_start_date} onChange={set('ojt_start_date')} />
            </div>
            <div className="form-group">
              <label>Required Hours</label>
              <input type="number" value={form.required_hours} onChange={set('required_hours')} min={1} />
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
        <p className="auth-link">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

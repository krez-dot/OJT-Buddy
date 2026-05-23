import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { register } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const COURSES = [
  'BS Information Technology',
  'BS Computer Science',
  'BS Information Systems',
  'BS Computer Engineering',
  'BS Electronics Engineering',
  'Other',
];

const REQUIRED_HOURS_MAP = {
  'BS Information Technology': 486,
  'BS Computer Science': 486,
  'BS Information Systems': 486,
  'BS Computer Engineering': 486,
  'BS Electronics Engineering': 486,
  'Other': 486,
};

export default function Register() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    course: 'BS Information Technology',
    batch: '', ojt_start_date: '', required_hours: 486,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { signin } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const set = (field) => (e) => {
    const val = e.target.value;
    const updated = { ...form, [field]: val };
    if (field === 'course') updated.required_hours = REQUIRED_HOURS_MAP[val] || 486;
    setForm(updated);
    if (errors[field]) setErrors({ ...errors, [field]: '' });
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email address';
    if (!form.password) e.password = 'Password is required';
    if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const { confirmPassword, ...payload } = form;
      const res = await register(payload);
      signin(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed';
      setErrors({ api: msg });
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ name, label, children }) => (
    <div className="form-group">
      <label>{label}</label>
      {children}
      {errors[name] && <span className="field-error">{errors[name]}</span>}
    </div>
  );

  return (
    <div className="auth-page">
      <div className="auth-bg-orbs" aria-hidden="true">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
      </div>
      <div className="auth-card auth-card-wide">
        <div className="auth-header">
          <div className="auth-logo-wrap">
            <GraduationCap size={28} strokeWidth={1.8} />
          </div>
          <h1>OJT Buddy</h1>
          <p>Create your account</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          {errors.api && <div className="form-error">{errors.api}</div>}
          <div className="form-row">
            <Field name="name" label="Full Name">
              <input value={form.name} onChange={set('name')} placeholder="Juan Dela Cruz" className={errors.name ? 'input-error' : ''} />
            </Field>
            <Field name="email" label="Email">
              <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" className={errors.email ? 'input-error' : ''} />
            </Field>
          </div>
          <div className="form-row">
            <Field name="password" label="Password">
              <input type="password" value={form.password} onChange={set('password')} placeholder="Min. 6 characters" className={errors.password ? 'input-error' : ''} />
            </Field>
            <Field name="confirmPassword" label="Confirm Password">
              <input type="password" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="••••••••" className={errors.confirmPassword ? 'input-error' : ''} />
            </Field>
          </div>
          <div className="form-row">
            <Field name="course" label="Course">
              <select value={form.course} onChange={set('course')}>
                {COURSES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field name="batch" label="Batch (e.g. 2025A)">
              <input value={form.batch} onChange={set('batch')} placeholder="2025A" />
            </Field>
          </div>
          <div className="form-row">
            <Field name="ojt_start_date" label="OJT Start Date">
              <input type="date" value={form.ojt_start_date} onChange={set('ojt_start_date')} />
            </Field>
            <Field name="required_hours" label="Required Hours">
              <input type="number" value={form.required_hours} onChange={set('required_hours')} min={1} />
            </Field>
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

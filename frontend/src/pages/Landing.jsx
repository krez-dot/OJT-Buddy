import { Link } from 'react-router-dom';
import { GraduationCap, BookOpen, Building2, Mic2, FileText, Sparkles, ArrowRight } from 'lucide-react';

const FEATURES = [
  { icon: Building2,    title: 'Company Tracker',     desc: 'Track every application from wishlist to accepted. Never lose track of a deadline.' },
  { icon: BookOpen,     title: 'Daily Logbook',        desc: 'Log your hours, tasks, and mood. Export a PDF report whenever you need it.' },
  { icon: Mic2,         title: 'Interview Prep',       desc: 'Practice common OJT questions and get instant AI feedback on your answers.' },
  { icon: FileText,     title: 'Document Checklist',   desc: 'Keep track of every required document per company — NBI, MOA, endorsement letters.' },
  { icon: Sparkles,     title: 'AI-Powered',           desc: 'AI helps you polish logbook entries, research companies, and coach you through mock interviews.' },
  { icon: GraduationCap, title: 'Certificate Export',  desc: 'Generate a Certificate of Completion PDF the moment you hit your required hours.' },
];

const STEPS = [
  { num: '01', title: 'Create your account',    desc: 'Set your course, batch, and required OJT hours.' },
  { num: '02', title: 'Add target companies',   desc: 'Build your wishlist and track every application stage.' },
  { num: '03', title: 'Log your daily hours',   desc: 'Record tasks, mood, and location every day.' },
  { num: '04', title: 'Get your certificate',   desc: 'Download your completion certificate when you\'re done.' },
];

export default function Landing() {
  return (
    <div className="landing">
      {/* Background */}
      <div className="landing-bg" aria-hidden="true">
        <div className="landing-orb landing-orb-1" />
        <div className="landing-orb landing-orb-2" />
        <div className="landing-orb landing-orb-3" />
      </div>

      {/* Nav */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-brand">
            <GraduationCap size={22} strokeWidth={1.8} className="landing-brand-icon" />
            <span>OJT Buddy</span>
          </div>
          <div className="landing-nav-links">
            <Link to="/login" className="landing-nav-link">Sign in</Link>
            <Link to="/register" className="btn-primary landing-nav-cta">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        <div className="hero-badge">✦ Built for Filipino IT Students</div>
        <h1 className="hero-title">
          Your OJT,<br />
          <span className="hero-accent">fully tracked.</span>
        </h1>
        <p className="hero-sub">
          Manage company applications, log daily hours, prep for interviews,
          and track documents — all in one place.
        </p>
        <div className="hero-ctas">
          <Link to="/register" className="btn-primary hero-cta-main">
            Start for free <ArrowRight size={16} style={{ marginLeft: 6 }} />
          </Link>
          <Link to="/login" className="hero-cta-ghost">Already have an account</Link>
        </div>

        {/* Stat chips */}
        <div className="hero-stats">
          {[['486h', 'Required hours tracked'], ['5 stages', 'Application pipeline'], ['AI-powered', 'Interview coaching']].map(([val, label]) => (
            <div key={val} className="hero-stat">
              <span className="hero-stat-val">{val}</span>
              <span className="hero-stat-label">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="landing-section">
        <div className="section-label">Features</div>
        <h2 className="section-title">Everything you need for OJT</h2>
        <p className="section-sub">No more spreadsheets. No more forgotten deadlines.</p>
        <div className="features-grid">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="feature-card">
              <div className="feature-icon">
                <Icon size={20} strokeWidth={1.8} />
              </div>
              <h3 className="feature-title">{title}</h3>
              <p className="feature-desc">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="landing-section">
        <div className="section-label">How it works</div>
        <h2 className="section-title">From day one to done</h2>
        <div className="steps-grid">
          {STEPS.map((s) => (
            <div key={s.num} className="step-card">
              <div className="step-num">{s.num}</div>
              <h3 className="step-title">{s.title}</h3>
              <p className="step-desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="landing-cta-section">
        <h2 className="cta-title">Ready to start your OJT journey?</h2>
        <p className="cta-sub">Free to use. No credit card required.</p>
        <Link to="/register" className="btn-primary cta-btn">
          Create your account <ArrowRight size={16} style={{ marginLeft: 6 }} />
        </Link>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-brand" style={{ justifyContent: 'center' }}>
          <GraduationCap size={16} strokeWidth={1.8} className="landing-brand-icon" />
          <span>OJT Buddy</span>
        </div>
        <p>Built for BSIT students ·  {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

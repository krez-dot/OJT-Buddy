import { useState, useEffect } from 'react';
import { getQuestions, updateConfidence, addQuestion } from '../api';

const CONFIDENCE_OPTIONS = [
  { value: 'not-practiced', label: 'Not Practiced', color: '#94a3b8', icon: '○' },
  { value: 'needs-practice', label: 'Needs Practice', color: '#f59e0b', icon: '◑' },
  { value: 'confident', label: 'Confident', color: '#22c55e', icon: '●' },
];

export default function InterviewPrep() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [newQ, setNewQ] = useState({ question: '', sample_answer: '', category: 'Custom' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getQuestions().then((r) => setQuestions(r.data)).finally(() => setLoading(false));
  }, []);

  const handleConfidence = async (id, confidence) => {
    await updateConfidence(id, confidence);
    setQuestions(questions.map((q) => q.id === id ? { ...q, confidence } : q));
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await addQuestion(newQ);
      setQuestions([...questions, { ...res.data, confidence: 'not-practiced' }]);
      setNewQ({ question: '', sample_answer: '', category: 'Custom' });
      setShowAdd(false);
    } finally {
      setSaving(false);
    }
  };

  const categories = ['all', ...new Set(questions.map((q) => q.category))];
  const filtered = filter === 'all' ? questions : questions.filter((q) => q.category === filter);

  const counts = {
    confident: questions.filter((q) => q.confidence === 'confident').length,
    'needs-practice': questions.filter((q) => q.confidence === 'needs-practice').length,
    'not-practiced': questions.filter((q) => q.confidence === 'not-practiced').length,
  };

  if (loading) return <div className="page-loading">Loading...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Interview Prep</h1>
          <p className="page-subtitle">Practice common OJT interview questions</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(!showAdd)}>+ Add Question</button>
      </div>

      <div className="confidence-summary">
        {CONFIDENCE_OPTIONS.map((c) => (
          <div key={c.value} className="confidence-chip" style={{ borderColor: c.color }}>
            <span style={{ color: c.color }}>{c.icon}</span>
            <span>{c.label}</span>
            <strong style={{ color: c.color }}>{counts[c.value]}</strong>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="card add-question-card">
          <h3>Add Custom Question</h3>
          <form onSubmit={handleAddQuestion}>
            <div className="form-group">
              <label>Question</label>
              <input value={newQ.question} onChange={(e) => setNewQ({ ...newQ, question: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Category</label>
              <input value={newQ.category} onChange={(e) => setNewQ({ ...newQ, category: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Sample Answer / Tips</label>
              <textarea rows={3} value={newQ.sample_answer} onChange={(e) => setNewQ({ ...newQ, sample_answer: e.target.value })} />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Adding...' : 'Add'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="filter-tabs">
        {categories.map((cat) => (
          <button key={cat} className={`filter-tab ${filter === cat ? 'active' : ''}`} onClick={() => setFilter(cat)}>
            {cat === 'all' ? 'All' : cat}
            <span className="tab-count">{cat === 'all' ? questions.length : questions.filter((q) => q.category === cat).length}</span>
          </button>
        ))}
      </div>

      <div className="questions-list">
        {filtered.map((q) => {
          const conf = CONFIDENCE_OPTIONS.find((c) => c.value === q.confidence);
          const isOpen = expanded === q.id;
          return (
            <div key={q.id} className={`question-card ${isOpen ? 'open' : ''}`}>
              <div className="question-header" onClick={() => setExpanded(isOpen ? null : q.id)}>
                <div className="question-left">
                  <span className="question-category">{q.category}</span>
                  <p className="question-text">{q.question}</p>
                </div>
                <div className="question-right">
                  <span className="confidence-dot" style={{ color: conf.color }} title={conf.label}>{conf.icon}</span>
                  <span className="expand-icon">{isOpen ? '▲' : '▼'}</span>
                </div>
              </div>
              {isOpen && (
                <div className="question-body">
                  {q.sample_answer && (
                    <div className="sample-answer">
                      <strong>Tips:</strong> {q.sample_answer}
                    </div>
                  )}
                  <div className="confidence-btns">
                    <span>Mark as:</span>
                    {CONFIDENCE_OPTIONS.map((c) => (
                      <button
                        key={c.value}
                        className={`confidence-btn ${q.confidence === c.value ? 'active' : ''}`}
                        style={q.confidence === c.value ? { background: c.color, color: '#fff', borderColor: c.color } : { borderColor: c.color, color: c.color }}
                        onClick={() => handleConfidence(q.id, c.value)}
                      >
                        {c.icon} {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

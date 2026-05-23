import { useState, useEffect } from 'react';
import { getQuestions, updateConfidence, addQuestion, deleteQuestion, aiInterviewFeedback } from '../api';
import { SkeletonList } from '../components/Skeleton';

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
  const [shuffleMode, setShuffleMode] = useState(false);
  const [shuffleIndex, setShuffleIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userAnswers, setUserAnswers] = useState({});
  const [aiFeedback, setAiFeedback] = useState({});
  const [aiLoading, setAiLoading] = useState({});

  useEffect(() => {
    getQuestions().then((r) => setQuestions(r.data)).finally(() => setLoading(false));
  }, []);

  const handleConfidence = async (id, confidence) => {
    await updateConfidence(id, confidence);
    setQuestions(questions.map((q) => q.id === id ? { ...q, confidence } : q));
  };

  const handleAiFeedback = async (q) => {
    const answer = userAnswers[q.id];
    if (!answer?.trim()) return;
    setAiLoading((p) => ({ ...p, [q.id]: true }));
    try {
      const res = await aiInterviewFeedback({ question: q.question, answer, category: q.category });
      setAiFeedback((p) => ({ ...p, [q.id]: res.data }));
    } catch {
      setAiFeedback((p) => ({ ...p, [q.id]: { verdict: 'Error', feedback: 'AI unavailable. Try again.', score: 0 } }));
    } finally {
      setAiLoading((p) => ({ ...p, [q.id]: false }));
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (!confirm('Delete this question?')) return;
    await deleteQuestion(id);
    setQuestions(questions.filter((q) => q.id !== id));
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

  const startShuffle = () => {
    setShuffleIndex(Math.floor(Math.random() * filtered.length));
    setShowAnswer(false);
    setShuffleMode(true);
  };
  const nextShuffle = () => {
    setShuffleIndex(Math.floor(Math.random() * filtered.length));
    setShowAnswer(false);
  };
  const shuffleQ = filtered[shuffleIndex];

  const counts = {
    confident: questions.filter((q) => q.confidence === 'confident').length,
    'needs-practice': questions.filter((q) => q.confidence === 'needs-practice').length,
    'not-practiced': questions.filter((q) => q.confidence === 'not-practiced').length,
  };

  if (loading) return (
    <div className="page">
      <div className="page-header"><div className="skeleton" style={{height:'24px',width:'160px',borderRadius:'6px'}} /></div>
      <div style={{display:'flex',gap:'10px',marginBottom:'20px'}}>
        {Array.from({length:3}).map((_,i) => <div key={i} className="skeleton" style={{height:'38px',width:'140px',borderRadius:'99px'}} />)}
      </div>
      <SkeletonList rows={5} />
    </div>
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Interview Prep</h1>
          <p className="page-subtitle">Practice common OJT interview questions</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-ghost" onClick={startShuffle}>🔀 Shuffle</button>
          <button className="btn-primary" onClick={() => setShowAdd(!showAdd)}>+ Add Question</button>
        </div>
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

      {shuffleMode && shuffleQ && (
        <div className="shuffle-card card">
          <div className="shuffle-header">
            <span className="question-category">{shuffleQ.category}</span>
            <button className="modal-close" onClick={() => setShuffleMode(false)}>×</button>
          </div>
          <p className="shuffle-question">{shuffleQ.question}</p>
          {showAnswer ? (
            <div className="sample-answer"><strong>Tips:</strong> {shuffleQ.sample_answer || 'No tips available.'}</div>
          ) : (
            <button className="btn-ghost" onClick={() => setShowAnswer(true)}>Show Answer</button>
          )}
          <div className="shuffle-footer">
            <div className="confidence-btns">
              <span>Mark as:</span>
              {CONFIDENCE_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  className={`confidence-btn ${shuffleQ.confidence === c.value ? 'active' : ''}`}
                  style={shuffleQ.confidence === c.value ? { background: c.color, color: '#fff', borderColor: c.color } : { borderColor: c.color, color: c.color }}
                  onClick={() => { handleConfidence(shuffleQ.id, c.value); nextShuffle(); }}
                >
                  {c.icon} {c.label}
                </button>
              ))}
            </div>
            <button className="btn-primary" onClick={nextShuffle}>Next →</button>
          </div>
        </div>
      )}

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

                  {/* AI Practice */}
                  <div className="ai-practice">
                    <div className="ai-practice-label">🤖 Practice with AI</div>
                    <textarea
                      className="ai-answer-input"
                      rows={3}
                      placeholder="Type your answer here and get AI feedback..."
                      value={userAnswers[q.id] || ''}
                      onChange={(e) => setUserAnswers((p) => ({ ...p, [q.id]: e.target.value }))}
                    />
                    <button
                      className="btn-primary ai-feedback-btn"
                      onClick={() => handleAiFeedback(q)}
                      disabled={aiLoading[q.id] || !userAnswers[q.id]?.trim()}
                    >
                      {aiLoading[q.id] ? '✦ Analyzing...' : '✦ Get AI Feedback'}
                    </button>
                    {aiFeedback[q.id] && (
                      <div className={`ai-feedback-panel ${aiFeedback[q.id].verdict?.toLowerCase().replace(' ','-')}`}>
                        <div className="ai-feedback-header">
                          <span className="ai-verdict">{aiFeedback[q.id].verdict}</span>
                          <span className="ai-score">{aiFeedback[q.id].score}/10</span>
                        </div>
                        <p className="ai-feedback-text">{aiFeedback[q.id].feedback}</p>
                        {aiFeedback[q.id].tip && (
                          <p className="ai-tip">💡 {aiFeedback[q.id].tip}</p>
                        )}
                      </div>
                    )}
                  </div>

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
                    {!q.is_default && (
                      <button className="btn-ghost danger" style={{ marginLeft: 'auto' }} onClick={() => handleDeleteQuestion(q.id)}>Delete</button>
                    )}
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

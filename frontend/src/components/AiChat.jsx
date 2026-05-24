import { useState, useRef, useEffect } from 'react';
import { aiChat, getChatHistory, clearChatHistory } from '../api';
import { X, Send, Sparkles, ChevronDown, Trash2 } from 'lucide-react';

const SUGGESTIONS = [
  '💼 Tips for my OJT interview?',
  '📄 What documents do I need?',
  '📓 Help me write a logbook entry',
  '🏢 How do I follow up on applications?',
];

const STRESS_LEVELS = [
  { emoji: '😌', label: 'Chill',    value: 1, color: '#22c55e' },
  { emoji: '🙂', label: 'Good',     value: 2, color: '#3b82f6' },
  { emoji: '😐', label: 'Meh',      value: 3, color: '#f59e0b' },
  { emoji: '😰', label: 'Stressed', value: 4, color: '#f97316' },
  { emoji: '😩', label: 'Burning',  value: 5, color: '#ef4444' },
];

const WELCOME = { role: 'assistant', content: "Hey! I'm your OJT Buddy AI 👋 Ask me anything, or tell me how you're feeling today." };

export default function AiChat() {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [unread, setUnread]     = useState(0);
  const [stress, setStress]     = useState(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // Load chat history once on mount
  useEffect(() => {
    getChatHistory()
      .then((res) => {
        if (res.data.messages.length > 0) {
          setMessages([WELCOME, ...res.data.messages]);
        }
      })
      .catch(() => {})
      .finally(() => setHistoryLoaded(true));
  }, []);

  useEffect(() => {
    if (open) { setUnread(0); setTimeout(() => inputRef.current?.focus(), 150); }
  }, [open]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const handleClear = async () => {
    await clearChatHistory().catch(() => {});
    setMessages([WELCOME]);
    setStress(null);
  };

  const send = async (text) => {
    const content = (text || input).trim();
    if (!content || loading) return;
    setInput('');

    const userMsg = { role: 'user', content };
    const next = [...messages, userMsg];
    setMessages(next);
    setLoading(true);

    try {
      const res = await aiChat({ messages: next });
      const reply = { role: 'assistant', content: res.data.reply };
      setMessages((m) => [...m, reply]);
      if (!open) setUnread((n) => n + 1);
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'Sorry, couldn\'t connect. Try again!' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleStress = (level) => {
    setStress(level.value);
    const msgs = {
      1: 'I\'m feeling chill today 😌 Just checking in!',
      2: 'Doing pretty good today 🙂',
      3: 'Feeling kind of meh today 😐 Could use some motivation.',
      4: 'I\'m stressed out right now 😰 Can you help me feel better?',
      5: 'I\'m completely burned out 😩 I really need some encouragement.',
    };
    send(msgs[level.value]);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const showSuggestions = messages.length === 1;

  return (
    <>
      <button
        className={`ai-chat-fab ${open ? 'ai-chat-fab--open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-label="Open AI chat"
      >
        {open ? <ChevronDown size={20} /> : <Sparkles size={20} />}
        {!open && unread > 0 && <span className="ai-chat-badge">{unread}</span>}
      </button>

      {open && (
        <div className="ai-chat-panel">
          {/* Header */}
          <div className="ai-chat-header">
            <div className="ai-chat-header-avatar"><Sparkles size={14} /></div>
            <div className="ai-chat-header-info">
              <span className="ai-chat-header-name">OJT Buddy AI</span>
              <span className="ai-chat-header-status">● Online</span>
            </div>
            <button className="ai-chat-clear" onClick={handleClear} title="Clear chat history"><Trash2 size={13} /></button>
            <button className="ai-chat-close" onClick={() => setOpen(false)}><X size={15} /></button>
          </div>

          {/* Stress check-in */}
          {messages.length <= 2 && (
            <div className="ai-stress-bar">
              <span className="ai-stress-label">How are you feeling?</span>
              <div className="ai-stress-emojis">
                {STRESS_LEVELS.map((l) => (
                  <button
                    key={l.value}
                    className={`ai-stress-btn ${stress === l.value ? 'ai-stress-btn--active' : ''}`}
                    style={stress === l.value ? { borderColor: l.color, background: l.color + '22' } : {}}
                    onClick={() => handleStress(l)}
                    title={l.label}
                  >
                    {l.emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="ai-chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={`ai-chat-msg ai-chat-msg--${m.role}`}>
                {m.role === 'assistant' && (
                  <div className="ai-chat-avatar"><Sparkles size={10} /></div>
                )}
                <div className="ai-chat-bubble">{m.content}</div>
              </div>
            ))}

            {loading && (
              <div className="ai-chat-msg ai-chat-msg--assistant">
                <div className="ai-chat-avatar"><Sparkles size={10} /></div>
                <div className="ai-chat-bubble ai-chat-typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick suggestions */}
          {showSuggestions && (
            <div className="ai-chat-suggestions">
              {SUGGESTIONS.map((s) => (
                <button key={s} className="ai-chat-suggestion" onClick={() => send(s)}>{s}</button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="ai-chat-input-row">
            <textarea
              ref={inputRef}
              className="ai-chat-input"
              placeholder="Ask anything OJT..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
            />
            <button className="ai-chat-send" onClick={() => send()} disabled={!input.trim() || loading}>
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

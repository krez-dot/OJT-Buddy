import { useState, useRef, useEffect } from 'react';
import { aiChat } from '../api';
import { X, Send, Sparkles, ChevronDown } from 'lucide-react';

const SUGGESTIONS = [
  'What documents do I need for OJT?',
  'How do I write a good logbook entry?',
  'Tips for my OJT interview?',
  'How do I follow up on my application?',
];

export default function AiChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I\'m your OJT Buddy AI. Ask me anything about your internship — companies, documents, interviews, logbook tips, you name it! 👋' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const send = async (text) => {
    const content = text || input.trim();
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
      setMessages((m) => [...m, { role: 'assistant', content: 'Sorry, I couldn\'t connect. Try again in a moment.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <>
      {/* Floating button */}
      <button
        className={`ai-chat-fab ${open ? 'ai-chat-fab--open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-label="Open AI chat"
      >
        {open ? <ChevronDown size={22} /> : <Sparkles size={22} />}
        {!open && unread > 0 && <span className="ai-chat-badge">{unread}</span>}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="ai-chat-panel">
          <div className="ai-chat-header">
            <Sparkles size={15} />
            <span>OJT Buddy AI</span>
            <button className="ai-chat-close" onClick={() => setOpen(false)}><X size={15} /></button>
          </div>

          <div className="ai-chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={`ai-chat-msg ai-chat-msg--${m.role}`}>
                {m.role === 'assistant' && <div className="ai-chat-avatar"><Sparkles size={11} /></div>}
                <div className="ai-chat-bubble">{m.content}</div>
              </div>
            ))}

            {loading && (
              <div className="ai-chat-msg ai-chat-msg--assistant">
                <div className="ai-chat-avatar"><Sparkles size={11} /></div>
                <div className="ai-chat-bubble ai-chat-typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions — only show on first message */}
          {messages.length === 1 && (
            <div className="ai-chat-suggestions">
              {SUGGESTIONS.map((s) => (
                <button key={s} className="ai-chat-suggestion" onClick={() => send(s)}>{s}</button>
              ))}
            </div>
          )}

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
            <button
              className="ai-chat-send"
              onClick={() => send()}
              disabled={!input.trim() || loading}
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

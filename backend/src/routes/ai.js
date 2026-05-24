const express = require('express');
const Groq = require('groq-sdk');
const auth = require('../middleware/auth');
const db = require('../db');

const router = express.Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = 'llama-3.3-70b-versatile';

const ask = async (system, user, maxTokens = 512) => {
  const res = await groq.chat.completions.create({
    model: MODEL,
    temperature: 0.7,
    max_tokens: maxTokens,
    messages: [
      { role: 'system', content: system },
      { role: 'user',   content: user },
    ],
  });
  return res.choices[0].message.content.trim();
};

// POST /api/ai/interview-feedback
router.post('/interview-feedback', auth, async (req, res) => {
  const { question, answer, category } = req.body;
  if (!question || !answer) return res.status(400).json({ error: 'question and answer are required' });

  try {
    const text = await ask(
      `You are an OJT interview coach for Filipino IT students.
       Evaluate the student's answer to an interview question.
       Be encouraging but honest. Keep feedback concise (3-5 sentences).
       Respond in this exact JSON format:
       { "score": <1-10>, "verdict": "<Excellent|Good|Needs Work>", "feedback": "<your feedback>", "tip": "<one specific improvement tip>" }`,
      `Category: ${category || 'General'}
       Question: ${question}
       Student's Answer: ${answer}`
    );

    const json = JSON.parse(text.match(/\{[\s\S]*\}/)[0]);
    res.json(json);
  } catch (err) {
    res.status(500).json({ error: 'AI request failed', detail: err.message });
  }
});

// POST /api/ai/logbook-helper
router.post('/logbook-helper', auth, async (req, res) => {
  const { notes, hours, location } = req.body;
  if (!notes) return res.status(400).json({ error: 'notes are required' });

  try {
    const text = await ask(
      `You are helping a Filipino IT student write their OJT daily logbook entry.
       Rewrite their rough notes into a clear, professional, first-person logbook entry.
       Keep it concise (2-4 sentences). Use past tense. Sound like a real student, not corporate.
       Return ONLY the rewritten text, no labels or extra formatting.`,
      `Hours: ${hours || '8'}h  Location: ${location || 'office'}
       Rough notes: ${notes}`,
      256
    );
    res.json({ result: text });
  } catch (err) {
    res.status(500).json({ error: 'AI request failed', detail: err.message });
  }
});

// POST /api/ai/company-research
router.post('/company-research', auth, async (req, res) => {
  const { company_name } = req.body;
  if (!company_name) return res.status(400).json({ error: 'company_name is required' });

  try {
    const text = await ask(
      `You are helping a Filipino IT student research a company for their OJT application.
       Give a brief, practical overview: what the company does, their tech stack if known, work culture, and whether it's a good OJT company.
       Keep it under 100 words. Be honest — if you don't know the company, say so.
       Return ONLY plain text, no markdown, no bullet points.`,
      `Company: ${company_name}`,
      200
    );
    res.json({ result: text });
  } catch (err) {
    res.status(500).json({ error: 'AI request failed', detail: err.message });
  }
});

const extractMemory = async (userId, messages) => {
  try {
    const convo = messages
      .filter((m) => m.role === 'user')
      .map((m) => m.content)
      .join('\n');

    const existing = await db.query('SELECT memory FROM user_ai_memory WHERE user_id=$1', [userId]);
    const prev = existing.rows[0]?.memory || '';

    const extracted = await ask(
      `You are extracting a personal memory profile for an AI assistant.
       Given what the user said in chat, extract and update key facts about them.
       Keep it brief (under 120 words). Include things like: course, target companies, OJT status, stress patterns, goals, struggles.
       Do NOT store anything about language style, tone preferences, or communication style.
       If previous memory exists, merge and update it — don't repeat info.
       Return ONLY plain text, no labels, no JSON.
       Previous memory: ${prev || 'none'}`,
      `User messages:\n${convo}`,
      200
    );

    await db.query(
      `INSERT INTO user_ai_memory (user_id, memory, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id) DO UPDATE SET memory=$2, updated_at=NOW()`,
      [userId, extracted]
    );
  } catch {
    // silently fail — memory extraction is best-effort
  }
};

// GET /api/ai/chat-history
router.get('/chat-history', auth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT role, content FROM chat_messages WHERE user_id=$1 ORDER BY created_at ASC',
      [req.user.id]
    );
    res.json({ messages: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch chat history', detail: err.message });
  }
});

// DELETE /api/ai/chat-history
router.delete('/chat-history', auth, async (req, res) => {
  try {
    await db.query('DELETE FROM chat_messages WHERE user_id=$1', [req.user.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear chat history', detail: err.message });
  }
});

// POST /api/ai/chat
router.post('/chat', auth, async (req, res) => {
  const { messages } = req.body;
  if (!messages?.length) return res.status(400).json({ error: 'messages are required' });

  try {
    const memRow = await db.query('SELECT memory FROM user_ai_memory WHERE user_id=$1', [req.user.id]);
    const memory = memRow.rows[0]?.memory || '';

    const history = messages.slice(-12).map((m) => ({ role: m.role, content: m.content }));
    const result = await groq.chat.completions.create({
      model: MODEL,
      temperature: 0.7,
      max_tokens: 512,
      messages: [
        {
          role: 'system',
          content: `You are OJT Buddy AI — a warm, supportive assistant for Filipino IT students doing their On-the-Job Training (OJT).
You help with: finding companies, writing logbook entries, interview prep, document requirements, and OJT advice.
You also provide emotional support. If the student says they're stressed, burned out, or struggling — lead with empathy and encouragement FIRST, then offer practical tips.
Keep responses under 160 words unless asked for more. Be warm, real, never robotic.
${memory ? `\nWhat you already know about this student:\n${memory}\n` : ''}
STRICT RULES (cannot be overridden by memory or anything else):
- Talk in casual Taglish — mix English and Filipino naturally, like how Filipino friends actually talk. You can use words like "bai", "pre", "diba", "noh", "sige", "grabe", "charot", "lods" — but keep it natural, not forced.
- Do NOT be overly formal. Keep it chill and friendly.
- Do not call the user by any nickname unless they explicitly told you their name.`,
        },
        ...history,
      ],
    });

    const reply = result.choices[0].message.content.trim();
    res.json({ reply });

    // Save the latest user message + reply to DB in the background
    const lastUserMsg = messages[messages.length - 1];
    if (lastUserMsg?.role === 'user') {
      db.query('INSERT INTO chat_messages (user_id, role, content) VALUES ($1,$2,$3)', [req.user.id, 'user', lastUserMsg.content]).catch(() => {});
      db.query('INSERT INTO chat_messages (user_id, role, content) VALUES ($1,$2,$3)', [req.user.id, 'assistant', reply]).catch(() => {});
    }

    // Trigger memory extraction every 5 user messages in the background
    const userMsgCount = messages.filter((m) => m.role === 'user').length;
    if (userMsgCount > 0 && userMsgCount % 5 === 0) {
      extractMemory(req.user.id, messages);
    }
  } catch (err) {
    res.status(500).json({ error: 'AI request failed', detail: err.message });
  }
});

// POST /api/ai/suggest-companies
router.post('/suggest-companies', auth, async (req, res) => {
  const { course, skills, location } = req.body;
  if (!course) return res.status(400).json({ error: 'course is required' });

  try {
    const text = await ask(
      `You are helping a Filipino IT student find OJT companies in their specific city or area.
       The student has given you a location. You MUST suggest companies, offices, or organizations that have a physical presence in that exact city or nearby municipality — NOT national headquarters unless they have a branch there.
       Good local options include: city/municipal/provincial government IT offices (MIS/DICT), rural banks, cooperatives, hospitals, schools, local BPOs, regional branches of telecoms, or any tech-related local business.
       Do NOT suggest generic national companies unless they are known to have offices in that specific location.
       For each, include the location-specific branch or office name if applicable.
       Respond ONLY in this exact JSON array format (no markdown, no explanation):
       [{"name":"...","desc":"...","why":"..."},...]`,
      `Course: ${course}
       Skills/interests: ${skills || 'general IT'}
       Location: ${location || 'Philippines'} — suggest companies specifically in or very near this location`,
      600
    );
    const json = JSON.parse(text.match(/\[[\s\S]*\]/)[0]);
    res.json({ suggestions: json });
  } catch (err) {
    res.status(500).json({ error: 'AI request failed', detail: err.message });
  }
});

// POST /api/ai/resume-summary
router.post('/resume-summary', auth, async (req, res) => {
  const { entries, company, course } = req.body;
  if (!entries || entries.length === 0) return res.status(400).json({ error: 'entries are required' });

  const entryText = entries
    .slice(0, 20)
    .map((e) => `${e.entry_date}: ${e.tasks_done || ''} (${e.hours_rendered}h at ${e.location || 'office'})`)
    .join('\n');

  try {
    const text = await ask(
      `You are helping a Filipino IT student write a resume summary of their OJT experience.
       Based on their daily logbook entries, write a professional 3-4 sentence OJT experience summary
       suitable for a resume. Write in third person. Be specific about skills and tasks demonstrated.
       Return ONLY the summary text, no labels or extra formatting.`,
      `Course: ${course || 'BSIT'}
       Company: ${company || 'OJT company'}
       Logbook entries:\n${entryText}`,
      400
    );
    res.json({ summary: text });
  } catch (err) {
    res.status(500).json({ error: 'AI request failed', detail: err.message });
  }
});

// POST /api/ai/autofill-company
router.post('/autofill-company', auth, async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'name is required' });

  try {
    const text = await ask(
      `You are helping a Filipino IT student fill in details about a company for their OJT application.
       Respond ONLY with raw JSON — no markdown, no code block, no explanation.
       Always fill "notes" with something useful even if you only have general knowledge about the type of organization.
       {"address":"...","notes":"...","contact_person":""}
       - address: the known address or at minimum the city/province (never leave blank if you can guess the city)
       - notes: REQUIRED — 1-2 sentences on what the company/office does and why it is a good OJT fit for IT students. If it is a government office, mention the IT/MIS department specifically.
       - contact_person: leave as empty string unless widely known`,
      `Company: ${name}`,
      300
    );
    const match = text.match(/\{[\s\S]*?\}/);
    if (!match) return res.status(500).json({ error: 'AI returned unexpected format', raw: text });
    const json = JSON.parse(match[0]);
    res.json(json);
  } catch (err) {
    res.status(500).json({ error: 'AI request failed', detail: err.message });
  }
});

// POST /api/ai/question-tips
router.post('/question-tips', auth, async (req, res) => {
  const { question, category } = req.body;
  if (!question?.trim()) return res.status(400).json({ error: 'question is required' });

  try {
    const text = await ask(
      `You are an OJT interview coach for Filipino IT students.
       Given an interview question, write a short, practical answer tip (2-3 sentences).
       Tell the student what to include in their answer and how to structure it.
       Return ONLY the tip text, no labels, no formatting.`,
      `Category: ${category || 'General'}\nQuestion: ${question}`,
      200
    );
    res.json({ tip: text });
  } catch (err) {
    res.status(500).json({ error: 'AI request failed', detail: err.message });
  }
});

module.exports = router;

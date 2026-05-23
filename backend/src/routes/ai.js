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
- NEVER use Filipino words or slang. Not "bai", "ka", "kuya", "ate", "pre", "bes", "lodi" — none. English only, always.
- Do not call the user by any nickname unless they explicitly told you their name.`,
        },
        ...history,
      ],
    });

    const reply = result.choices[0].message.content.trim();
    res.json({ reply });

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
      `You are helping a Filipino IT student find OJT companies.
       Suggest 4 real, specific companies in the Philippines that are good OJT hosts for their course.
       For each company include: name, a 1-sentence description of what they do, and why it's a good OJT fit.
       Respond ONLY in this exact JSON array format (no markdown):
       [{"name":"...","desc":"...","why":"..."},...]`,
      `Course: ${course}
       Skills/interests: ${skills || 'general IT'}
       Location preference: ${location || 'Metro Manila'}`,
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

module.exports = router;

const express = require('express');
const Groq = require('groq-sdk');
const auth = require('../middleware/auth');

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

module.exports = router;

const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/questions', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT iq.*, COALESCE(uqc.confidence,'not-practiced') AS confidence
       FROM interview_questions iq
       LEFT JOIN user_question_confidence uqc ON uqc.question_id=iq.id AND uqc.user_id=$1
       WHERE iq.is_default=TRUE OR iq.user_id=$1
       ORDER BY iq.category, iq.id`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/questions/:id/confidence', auth, async (req, res) => {
  const { confidence } = req.body;
  try {
    await db.query(
      `INSERT INTO user_question_confidence (user_id,question_id,confidence) VALUES ($1,$2,$3)
       ON CONFLICT (user_id,question_id) DO UPDATE SET confidence=$3`,
      [req.user.id, req.params.id, confidence]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/questions', auth, async (req, res) => {
  const { question, sample_answer, category } = req.body;
  if (!question) return res.status(400).json({ error: 'question is required' });
  try {
    const result = await db.query(
      'INSERT INTO interview_questions (question,sample_answer,category,is_default,user_id) VALUES ($1,$2,$3,FALSE,$4) RETURNING *',
      [question, sample_answer, category || 'Custom', req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/questions/:id', auth, async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM interview_questions WHERE id=$1 AND user_id=$2 AND is_default=FALSE RETURNING id',
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(403).json({ error: 'Cannot delete default questions' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

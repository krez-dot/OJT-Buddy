const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT bs.*, u.name AS author_name, u.batch, c.name AS company_name
       FROM batch_shares bs
       JOIN users u ON bs.user_id=u.id
       JOIN companies c ON bs.company_id=c.id
       WHERE bs.is_public=TRUE OR bs.user_id=$1
       ORDER BY bs.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  const { company_id, review, rating, is_public } = req.body;
  if (!company_id) return res.status(400).json({ error: 'company_id is required' });
  try {
    const owns = await db.query('SELECT id FROM companies WHERE id=$1 AND user_id=$2', [company_id, req.user.id]);
    if (!owns.rows.length) return res.status(403).json({ error: 'Forbidden' });

    const result = await db.query(
      'INSERT INTO batch_shares (user_id,company_id,review,rating,is_public) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [req.user.id, company_id, review, rating, is_public !== false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  const { review, rating, is_public } = req.body;
  try {
    const result = await db.query(
      'UPDATE batch_shares SET review=$1,rating=$2,is_public=$3 WHERE id=$4 AND user_id=$5 RETURNING *',
      [review, rating, is_public, req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await db.query('DELETE FROM batch_shares WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

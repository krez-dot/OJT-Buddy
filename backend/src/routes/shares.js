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
       WHERE bs.is_public=TRUE
       ORDER BY bs.created_at DESC`,
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

module.exports = router;

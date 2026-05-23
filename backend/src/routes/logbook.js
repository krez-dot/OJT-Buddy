const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM logbook_entries WHERE user_id=$1 ORDER BY entry_date DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/stats', auth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT COALESCE(SUM(hours_rendered),0) AS total_hours, COUNT(*) AS total_days FROM logbook_entries WHERE user_id=$1',
      [req.user.id]
    );
    const user = await db.query('SELECT required_hours FROM users WHERE id=$1', [req.user.id]);
    res.json({ ...result.rows[0], required_hours: user.rows[0].required_hours });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/weekly', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT to_char(date_trunc('week', entry_date), 'Mon DD') AS week,
              SUM(hours_rendered) AS hours
       FROM logbook_entries
       WHERE user_id=$1 AND entry_date >= NOW() - INTERVAL '8 weeks'
       GROUP BY date_trunc('week', entry_date)
       ORDER BY date_trunc('week', entry_date)`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  const { entry_date, location, tasks_done, mood, hours_rendered } = req.body;
  if (!entry_date) return res.status(400).json({ error: 'entry_date is required' });
  try {
    const result = await db.query(
      'INSERT INTO logbook_entries (user_id,entry_date,location,tasks_done,mood,hours_rendered) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (user_id,entry_date) DO UPDATE SET location=$3,tasks_done=$4,mood=$5,hours_rendered=$6 RETURNING *',
      [req.user.id, entry_date, location, tasks_done, mood, hours_rendered || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  const { entry_date, location, tasks_done, mood, hours_rendered } = req.body;
  try {
    const result = await db.query(
      'UPDATE logbook_entries SET entry_date=$1,location=$2,tasks_done=$3,mood=$4,hours_rendered=$5 WHERE id=$6 AND user_id=$7 RETURNING *',
      [entry_date, location, tasks_done, mood, hours_rendered || 0, req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await db.query('DELETE FROM logbook_entries WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

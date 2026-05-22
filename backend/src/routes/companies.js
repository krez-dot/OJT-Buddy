const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM companies WHERE user_id=$1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  const { name, address, contact_person, email, phone, status, priority, notes, applied_at, deadline } = req.body;
  if (!name) return res.status(400).json({ error: 'Company name is required' });
  try {
    const result = await db.query(
      'INSERT INTO companies (user_id,name,address,contact_person,email,phone,status,priority,notes,applied_at,deadline) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *',
      [req.user.id, name, address, contact_person, email, phone, status || 'wishlist', priority || 'normal', notes, applied_at || null, deadline || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  const { name, address, contact_person, email, phone, status, priority, notes, applied_at, deadline } = req.body;
  try {
    const result = await db.query(
      'UPDATE companies SET name=$1,address=$2,contact_person=$3,email=$4,phone=$5,status=$6,priority=$7,notes=$8,applied_at=$9,deadline=$10 WHERE id=$11 AND user_id=$12 RETURNING *',
      [name, address, contact_person, email, phone, status, priority, notes, applied_at || null, deadline || null, req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await db.query('DELETE FROM companies WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

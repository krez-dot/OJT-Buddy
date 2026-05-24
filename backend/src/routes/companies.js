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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/', auth, async (req, res) => {
  const { name, address, contact_person, email, phone, status, priority, notes, applied_at, deadline } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Company name is required' });
  if (email && !EMAIL_RE.test(email)) return res.status(400).json({ error: 'Invalid email address' });
  try {
    const result = await db.query(
      'INSERT INTO companies (user_id,name,address,contact_person,email,phone,status,priority,notes,applied_at,deadline) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *',
      [req.user.id, name, address, contact_person, email, phone, status || 'wishlist', priority || 'normal', notes, applied_at || null, deadline || null]
    );
    const company = result.rows[0];
    const docTypes = await db.query('SELECT id FROM document_types');
    for (const dt of docTypes.rows) {
      await db.query(
        'INSERT INTO company_documents (company_id, doc_type_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [company.id, dt.id]
      );
    }
    res.status(201).json(company);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  const { name, address, contact_person, email, phone, status, priority, notes, applied_at, deadline, status_note } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Company name is required' });
  if (email && !EMAIL_RE.test(email)) return res.status(400).json({ error: 'Invalid email address' });
  try {
    const prev = await db.query('SELECT status FROM companies WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    if (!prev.rows.length) return res.status(404).json({ error: 'Not found' });

    const result = await db.query(
      'UPDATE companies SET name=$1,address=$2,contact_person=$3,email=$4,phone=$5,status=$6,priority=$7,notes=$8,applied_at=$9,deadline=$10 WHERE id=$11 AND user_id=$12 RETURNING *',
      [name, address, contact_person, email, phone, status, priority, notes, applied_at || null, deadline || null, req.params.id, req.user.id]
    );

    if (prev.rows[0].status !== status) {
      await db.query(
        'INSERT INTO company_status_history (company_id, status, note) VALUES ($1, $2, $3)',
        [req.params.id, status, status_note || null]
      );
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/history', auth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM company_status_history WHERE company_id=$1 ORDER BY changed_at ASC',
      [req.params.id]
    );
    res.json(result.rows);
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

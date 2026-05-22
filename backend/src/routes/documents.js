const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/types', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM document_types ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/company/:companyId', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT cd.*, dt.name AS doc_name, dt.description AS doc_description
       FROM company_documents cd
       JOIN document_types dt ON cd.doc_type_id = dt.id
       JOIN companies c ON cd.company_id = c.id
       WHERE cd.company_id=$1 AND c.user_id=$2
       ORDER BY dt.id`,
      [req.params.companyId, req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/company/:companyId', auth, async (req, res) => {
  const { doc_type_id, status, notes } = req.body;
  try {
    const owns = await db.query('SELECT id FROM companies WHERE id=$1 AND user_id=$2', [req.params.companyId, req.user.id]);
    if (!owns.rows.length) return res.status(403).json({ error: 'Forbidden' });

    const result = await db.query(
      'INSERT INTO company_documents (company_id,doc_type_id,status,notes) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING RETURNING *',
      [req.params.companyId, doc_type_id, status || 'pending', notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  const { status, submitted_at, notes } = req.body;
  try {
    const result = await db.query(
      `UPDATE company_documents cd SET status=$1,submitted_at=$2,notes=$3
       FROM companies c WHERE cd.id=$4 AND cd.company_id=c.id AND c.user_id=$5 RETURNING cd.*`,
      [status, submitted_at || null, notes, req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

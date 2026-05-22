const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/me', auth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id,name,email,course,batch,ojt_start_date,required_hours,created_at FROM users WHERE id=$1',
      [req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/me', auth, async (req, res) => {
  const { name, course, batch, ojt_start_date, required_hours } = req.body;
  try {
    const result = await db.query(
      'UPDATE users SET name=$1,course=$2,batch=$3,ojt_start_date=$4,required_hours=$5 WHERE id=$6 RETURNING id,name,email,course,batch,ojt_start_date,required_hours',
      [name, course, batch, ojt_start_date || null, required_hours, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

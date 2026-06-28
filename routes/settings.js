const express = require('express');
const pool = require('../config/db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM settings');
    const obj = {};
    result.rows.forEach(r => { obj[r.key] = r.value; });
    res.json(obj);
  } catch (err) {
    res.status(500).json({ error: 'Sozlamalarni olishda xatolik' });
  }
});

router.put('/', async (req, res) => {
  try {
    const entries = Object.entries(req.body);
    for (const [key, value] of entries) {
      await pool.query(
        `INSERT INTO settings (key, value) VALUES ($1,$2)
         ON CONFLICT (key) DO UPDATE SET value = $2`,
        [key, String(value)]
      );
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Saqlashda xatolik' });
  }
});

module.exports = router;

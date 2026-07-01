const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { JWT_SECRET, authMiddleware } = require('../middleware/auth');

const router = express.Router();

// LOGIN
router.post('/login', async (req, res) => {
  const { login, password } = req.body;
  if (!login || !password) {
    return res.status(400).json({ error: 'Login va parol kerak' });
  }
  try {
    const result = await pool.query('SELECT * FROM users WHERE login = $1', [login]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Login yoki parol noto\'g\'ri' });
    }
    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Login yoki parol noto\'g\'ri' });
    }
    const token = jwt.sign(
      { id: user.id, login: user.login, full_name: user.full_name, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );
    res.json({
      token,
      user: { id: user.id, login: user.login, full_name: user.full_name, role: user.role }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// Joriy foydalanuvchi ma'lumoti
router.get('/me', authMiddleware, async (req, res) => {
  res.json({ user: req.user });
});

// Joriy foydalanuvchi login/parolini o'zgartirish (ochiq ro'yxatdan o'tish o'rniga)
router.put('/me', authMiddleware, async (req, res) => {
  const { login, password } = req.body;
  if (!login && !password) {
    return res.status(400).json({ error: 'Yangilanadigan maydon yo\'q' });
  }
  if (password && password.length < 6) {
    return res.status(400).json({ error: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak' });
  }
  try {
    if (login) {
      const exists = await pool.query('SELECT id FROM users WHERE login = $1 AND id != $2', [login, req.user.id]);
      if (exists.rows.length > 0) {
        return res.status(409).json({ error: 'Bu login band, boshqasini tanlang' });
      }
    }
    const fields = [];
    const values = [];
    let i = 1;
    if (login) { fields.push(`login = $${i++}`); values.push(login); }
    if (password) { fields.push(`password_hash = $${i++}`); values.push(await bcrypt.hash(password, 10)); }
    values.push(req.user.id);
    const result = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${i} RETURNING id, login, full_name, role`,
      values
    );
    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, login: user.login, full_name: user.full_name, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );
    res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

module.exports = router;

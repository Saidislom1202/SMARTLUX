const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'smartlux-maxfiy-kalit-2026';

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token topilmadi. Iltimos qayta login qiling.' });
  }
  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { id, login, full_name, role }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token yaroqsiz yoki muddati o\'tgan. Qayta login qiling.' });
  }
}

module.exports = { authMiddleware, JWT_SECRET };

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { authMiddleware } = require('./middleware/auth');

const authRoutes = require('./routes/auth');
const driversRoutes = require('./routes/drivers');
const workersRoutes = require('./routes/workers');
const companiesRoutes = require('./routes/companies');
const cargosRoutes = require('./routes/cargos');
const financeRoutes = require('./routes/finance');
const settingsRoutes = require('./routes/settings');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // Netlify frontend har qaysi domendan so'rov yuborishi mumkin
app.use(express.json({ limit: '5mb' }));

// Health check (Railway/server tekshiruvi uchun)
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'SmartLux Logistic API ishlayapti' });
});
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Auth route — login/register ochiq (token kerak emas)
app.use('/api/auth', authRoutes);

// Qolgan barcha route'lar — token talab qiladi
app.use('/api/drivers', authMiddleware, driversRoutes);
app.use('/api/workers', authMiddleware, workersRoutes);
app.use('/api/companies', authMiddleware, companiesRoutes);
app.use('/api/cargos', authMiddleware, cargosRoutes);
app.use('/api/finance', authMiddleware, financeRoutes);
app.use('/api/settings', authMiddleware, settingsRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Bu manzil topilmadi' });
});

// Global xato ushlagich
app.use((err, req, res, next) => {
  console.error('Server xatosi:', err);
  res.status(500).json({ error: 'Kutilmagan server xatosi' });
});

app.listen(PORT, () => {
  console.log(`✅ SmartLux backend ${PORT}-portda ishga tushdi`);
});

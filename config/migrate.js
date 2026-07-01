// Bazani sozlash — barcha jadvallarni yaratadi
// Ishlatish: node config/migrate.js

require('dotenv').config();
const pool = require('./db');

const SQL = `
-- Foydalanuvchilar (xodimlar)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  login VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(150),
  role VARCHAR(30) DEFAULT 'staff',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Haydovchilar
CREATE TABLE IF NOT EXISTS drivers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  jshir VARCHAR(20),
  car VARCHAR(100),
  plate VARCHAR(30),
  city VARCHAR(100),
  status VARCHAR(20) DEFAULT 'wait',
  note TEXT,
  loads INT DEFAULT 0,
  rating NUMERIC(3,1) DEFAULT 5.0,
  contract_file TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Ishchilar
CREATE TABLE IF NOT EXISTS workers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  phone VARCHAR(30),
  role VARCHAR(100),
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Korxonalar
CREATE TABLE IF NOT EXISTS companies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  phone VARCHAR(30),
  address TEXT,
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Yuklar (cargo)
CREATE TABLE IF NOT EXISTS cargos (
  id SERIAL PRIMARY KEY,
  company VARCHAR(200),
  driver VARCHAR(150),
  worker VARCHAR(150),
  weight VARCHAR(50),
  "from" VARCHAR(200),
  "to" VARCHAR(200),
  total NUMERIC(14,2) DEFAULT 0,
  nds NUMERIC(14,2) DEFAULT 0,
  driver_pay NUMERIC(14,2) DEFAULT 0,
  driver_tax BOOLEAN DEFAULT FALSE,
  worker_pay NUMERIC(14,2) DEFAULT 0,
  profit NUMERIC(14,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'wait',
  karta VARCHAR(30),
  karta_ega VARCHAR(150),
  pickup_date DATE,
  delivery_date DATE,
  cargo_date DATE DEFAULT CURRENT_DATE,
  created_by INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Moliya (qo'shimcha daromad/xarajat yozuvlari)
CREATE TABLE IF NOT EXISTS finance (
  id SERIAL PRIMARY KEY,
  type VARCHAR(20) NOT NULL, -- income / expense
  amount NUMERIC(14,2) NOT NULL,
  category VARCHAR(100),
  note TEXT,
  entry_date DATE DEFAULT CURRENT_DATE,
  created_by INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Soliqlar
CREATE TABLE IF NOT EXISTS taxes (
  id SERIAL PRIMARY KEY,
  cargo_id INT REFERENCES cargos(id) ON DELETE CASCADE,
  amount NUMERIC(14,2) NOT NULL,
  rate NUMERIC(5,2) DEFAULT 12,
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sozlamalar (key-value, masalan NDS foizi, valyuta)
CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(50) PRIMARY KEY,
  value TEXT
);

CREATE INDEX IF NOT EXISTS idx_cargos_driver ON cargos(driver);
CREATE INDEX IF NOT EXISTS idx_cargos_date ON cargos(cargo_date);
CREATE INDEX IF NOT EXISTS idx_finance_date ON finance(entry_date);
`;

async function migrate() {
  try {
    console.log('Migratsiya boshlandi...');
    await pool.query(SQL);
    console.log('✅ Barcha jadvallar yaratildi.');

    // Default admin foydalanuvchi (agar yo'q bo'lsa)
    const bcrypt = require('bcryptjs');
    const check = await pool.query('SELECT id FROM users WHERE login = $1', ['admin']);
    if (check.rows.length === 0) {
      const hash = await bcrypt.hash('admin123', 10);
      await pool.query(
        'INSERT INTO users (login, password_hash, full_name, role) VALUES ($1,$2,$3,$4)',
        ['admin', hash, 'Administrator', 'admin']
      );
      console.log('✅ Default admin yaratildi: login=admin, parol=admin123');
    } else {
      console.log('ℹ️  admin foydalanuvchi allaqachon mavjud.');
    }

    // Default sozlamalar
    await pool.query(`
      INSERT INTO settings (key, value) VALUES ('nds_rate','12'), ('currency','UZS')
      ON CONFLICT (key) DO NOTHING
    `);

    console.log('✅ Migratsiya muvaffaqiyatli tugadi.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migratsiya xatosi:', err);
    process.exit(1);
  }
}

migrate();

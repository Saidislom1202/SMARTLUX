const { Pool } = require('pg');

// Railway avtomatik DATABASE_URL beradi (Postgres qo'shilganda)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('railway')
    ? { rejectUnauthorized: false }
    : false
});

pool.on('error', (err) => {
  console.error('Postgres pool xatosi:', err);
});

module.exports = pool;

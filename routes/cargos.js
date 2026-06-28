const express = require('express');
const pool = require('../config/db');

const router = express.Router();

function calcDerived(body) {
  const total = parseFloat(body.total) || 0;
  const driver_pay = parseFloat(body.driver_pay) || 0;
  const worker_pay = parseFloat(body.worker_pay) || 0;
  const driver_tax = !!body.driver_tax;

  // QQS (NDS) formulasi: Umumiy summa / 112 * 12
  const nds = Math.round((total / 112) * 12);
  // Haydovchiga ixtiyoriy 12% soliq — agar belgilangan bo'lsa, foydadan ayriladi
  const driverTaxAmt = driver_tax ? Math.round(driver_pay * 0.12) : 0;
  const profit = total - nds - driver_pay - worker_pay - driverTaxAmt;

  return { total, nds, driver_pay, worker_pay, driver_tax, profit };
}

// Hammasini olish (filter: driver, date range ixtiyoriy)
router.get('/', async (req, res) => {
  try {
    const { driver, from, to } = req.query;
    let query = 'SELECT * FROM cargos WHERE 1=1';
    const params = [];
    if (driver) {
      params.push(driver);
      query += ` AND driver = $${params.length}`;
    }
    if (from) {
      params.push(from);
      query += ` AND cargo_date >= $${params.length}`;
    }
    if (to) {
      params.push(to);
      query += ` AND cargo_date <= $${params.length}`;
    }
    query += ' ORDER BY id DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Yuklarni olishda xatolik' });
  }
});

// Bitta yukni olish
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cargos WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Topilmadi' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Xatolik' });
  }
});

// Yangi yuk(lar) qo'shish — bir nechta qatorni birdaniga qabul qiladi
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const rows = Array.isArray(req.body) ? req.body : [req.body];
    const valid = rows.filter(r => (parseFloat(r.total) || 0) > 0);
    if (valid.length === 0) {
      return res.status(400).json({ error: 'Kamida 1 ta to\'ldirilgan qator kerak (Korxona to\'lovi > 0)' });
    }

    await client.query('BEGIN');
    const inserted = [];
    for (const r of valid) {
      const calc = calcDerived(r);
      const result = await client.query(
        `INSERT INTO cargos
         (company, driver, worker, weight, "from", "to", total, nds, driver_pay, driver_tax, worker_pay, profit, karta, karta_ega, pickup_date, delivery_date, cargo_date, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,COALESCE($17, CURRENT_DATE),$18)
         RETURNING *`,
        [
          r.company || null, r.driver || null, r.worker || null, r.weight || null,
          r.from || null, r.to || null, calc.total, calc.nds, calc.driver_pay,
          calc.driver_tax, calc.worker_pay, calc.profit, r.karta || null, r.karta_ega || null,
          r.pickup_date || null, r.delivery_date || null, r.cargo_date || null,
          req.user ? req.user.id : null
        ]
      );
      inserted.push(result.rows[0]);
    }
    await client.query('COMMIT');
    res.status(201).json({ inserted: inserted.length, rows: inserted });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Saqlashda xatolik: ' + err.message });
  } finally {
    client.release();
  }
});

// Yukni tahrirlash
router.put('/:id', async (req, res) => {
  try {
    const calc = calcDerived(req.body);
    const r = req.body;
    const result = await pool.query(
      `UPDATE cargos SET
        company=$1, driver=$2, worker=$3, weight=$4, "from"=$5, "to"=$6,
        total=$7, nds=$8, driver_pay=$9, driver_tax=$10, worker_pay=$11, profit=$12,
        karta=$13, karta_ega=$14, pickup_date=$15, delivery_date=$16, updated_at=NOW()
       WHERE id=$17 RETURNING *`,
      [
        r.company || null, r.driver || null, r.worker || null, r.weight || null,
        r.from || null, r.to || null, calc.total, calc.nds, calc.driver_pay,
        calc.driver_tax, calc.worker_pay, calc.profit, r.karta || null, r.karta_ega || null,
        r.pickup_date || null, r.delivery_date || null, req.params.id
      ]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Topilmadi' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Tahrirlashda xatolik: ' + err.message });
  }
});

// Yukni o'chirish
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM cargos WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Topilmadi' });
    res.json({ success: true, id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: 'O\'chirishda xatolik' });
  }
});

// Dashboard uchun umumiy statistika
router.get('/stats/summary', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) AS total_cargos,
        COALESCE(SUM(total),0) AS total_income,
        COALESCE(SUM(nds),0) AS total_nds,
        COALESCE(SUM(driver_pay),0) AS total_driver_pay,
        COALESCE(SUM(worker_pay),0) AS total_worker_pay,
        COALESCE(SUM(profit),0) AS total_profit
      FROM cargos
    `);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Statistika olishda xatolik' });
  }
});

module.exports = router;

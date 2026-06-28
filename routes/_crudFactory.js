// Oddiy CRUD generator — drivers, workers, companies, finance, taxes uchun
// table: jadval nomi, allowedFields: ruxsat etilgan ustunlar ro'yxati

const pool = require('../config/db');

function makeCrudRouter(express, table, allowedFields) {
  const router = express.Router();

  // Hammasini olish
  router.get('/', async (req, res) => {
    try {
      const result = await pool.query(`SELECT * FROM ${table} ORDER BY id DESC`);
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Ma\'lumotlarni olishda xatolik' });
    }
  });

  // Bitta yozuvni olish
  router.get('/:id', async (req, res) => {
    try {
      const result = await pool.query(`SELECT * FROM ${table} WHERE id = $1`, [req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Topilmadi' });
      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Xatolik' });
    }
  });

  // Yangi yozuv qo'shish
  router.post('/', async (req, res) => {
    try {
      const fields = allowedFields.filter(f => req.body[f] !== undefined);
      if (fields.length === 0) return res.status(400).json({ error: 'Hech qanday maydon yuborilmadi' });
      const values = fields.map(f => req.body[f]);
      const cols = fields.map(f => `"${f}"`).join(',');
      const placeholders = fields.map((_, idx) => `$${idx + 1}`).join(',');
      const result = await pool.query(
        `INSERT INTO ${table} (${cols}) VALUES (${placeholders}) RETURNING *`,
        values
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Saqlashda xatolik: ' + err.message });
    }
  });

  // Yozuvni tahrirlash
  router.put('/:id', async (req, res) => {
    try {
      const fields = allowedFields.filter(f => req.body[f] !== undefined);
      if (fields.length === 0) return res.status(400).json({ error: 'Hech qanday maydon yuborilmadi' });
      const values = fields.map(f => req.body[f]);
      const setClause = fields.map((f, idx) => `"${f}" = $${idx + 1}`).join(',');
      values.push(req.params.id);
      const result = await pool.query(
        `UPDATE ${table} SET ${setClause}, updated_at = NOW() WHERE id = $${fields.length + 1} RETURNING *`,
        values
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Topilmadi' });
      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Tahrirlashda xatolik: ' + err.message });
    }
  });

  // Yozuvni o'chirish
  router.delete('/:id', async (req, res) => {
    try {
      const result = await pool.query(`DELETE FROM ${table} WHERE id = $1 RETURNING id`, [req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Topilmadi' });
      res.json({ success: true, id: result.rows[0].id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'O\'chirishda xatolik' });
    }
  });

  return router;
}

module.exports = makeCrudRouter;

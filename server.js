const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      booking_date DATE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/bookings', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM bookings ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/bookings', async (req, res) => {
  const { name, email, date } = req.body;

  try {
    const { rows } = await pool.query(
      'INSERT INTO bookings (name, email, booking_date) VALUES ($1, $2, $3) RETURNING *',
      [name, email, date]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

initDb()
  .then(() => {
    app.listen(port, () => console.log(`Server running on port ${port}`));
  })
  .catch((err) => {
    console.error('Failed to initialize database', err);
    process.exit(1);
  });
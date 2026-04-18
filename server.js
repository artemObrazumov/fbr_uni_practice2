const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT) || 5432,
  user: process.env.PGUSER || process.env.USER,
  password: process.env.PGPASSWORD || '',
  database: process.env.PGDATABASE || 'practice_users',
});

function rowToUser(row) {
  return {
    id: row.id,
    first_name: row.first_name,
    last_name: row.last_name,
    age: row.age,
    created_at: Number(row.created_at),
    updated_at: Number(row.updated_at),
  };
}

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      first_name VARCHAR(255) NOT NULL,
      last_name VARCHAR(255) NOT NULL,
      age INTEGER NOT NULL,
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL
    )
  `);
}

app.post('/api/users', async (req, res) => {
  const { first_name, last_name, age } = req.body;
  if (
    typeof first_name !== 'string' ||
    typeof last_name !== 'string' ||
    typeof age !== 'number' ||
    !Number.isInteger(age)
  ) {
    res.status(400).json({ error: 'invalid body' });
    return;
  }
  const now = Math.floor(Date.now() / 1000);
  try {
    const result = await pool.query(
      `INSERT INTO users (first_name, last_name, age, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, first_name, last_name, age, created_at, updated_at`,
      [first_name, last_name, age, now, now],
    );
    res.status(201).json(rowToUser(result.rows[0]));
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, first_name, last_name, age, created_at, updated_at FROM users ORDER BY id',
    );
    res.json(result.rows.map(rowToUser));
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

app.get('/api/users/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: 'invalid id' });
    return;
  }
  try {
    const result = await pool.query(
      'SELECT id, first_name, last_name, age, created_at, updated_at FROM users WHERE id = $1',
      [id],
    );
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'not found' });
      return;
    }
    res.json(rowToUser(result.rows[0]));
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

app.patch('/api/users/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: 'invalid id' });
    return;
  }
  const allowed = ['first_name', 'last_name', 'age'];
  const updates = [];
  const values = [];
  let i = 1;
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      const v = req.body[key];
      if (key === 'age') {
        if (typeof v !== 'number' || !Number.isInteger(v)) {
          res.status(400).json({ error: 'invalid age' });
          return;
        }
      } else if (typeof v !== 'string') {
        res.status(400).json({ error: 'invalid ' + key });
        return;
      }
      updates.push(key + ' = $' + i);
      values.push(v);
      i += 1;
    }
  }
  if (updates.length === 0) {
    res.status(400).json({ error: 'no fields' });
    return;
  }
  const now = Math.floor(Date.now() / 1000);
  updates.push('updated_at = $' + i);
  values.push(now);
  i += 1;
  values.push(id);
  const sql =
    'UPDATE users SET ' +
    updates.join(', ') +
    ' WHERE id = $' +
    i +
    ' RETURNING id, first_name, last_name, age, created_at, updated_at';
  try {
    const result = await pool.query(sql, values);
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'not found' });
      return;
    }
    res.json(rowToUser(result.rows[0]));
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: 'invalid id' });
    return;
  }
  try {
    const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'not found' });
      return;
    }
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

const port = Number(process.env.PORT) || 3000;

initDb()
  .then(() => {
    app.listen(port, () => {
      console.log('http://localhost:' + port);
    });
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

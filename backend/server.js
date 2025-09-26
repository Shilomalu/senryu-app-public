require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3001; // ポート番号

// DB接続設定
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// ミドルウェア
app.use(express.json()); // JSON形式のリクエストを扱えるようにする

// テスト用のAPIエンドポイント
app.get('/api/test', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT "Hello from DB!" AS message');
    res.json(rows[0]);
  } catch (err) {
    console.error('Database query error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
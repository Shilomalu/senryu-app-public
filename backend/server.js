// --- 1. ライブラリのインポート ---
require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { check575 } = require('./senryu-checker.js');

// --- 2. 基本設定 ---
const app = express();
app.use(cors());
app.use(express.json());
const JWT_SECRET = process.env.JWT_SECRET || 'your-very-secret-key'; // .envファイルで設定推奨

// --- 3. データベース接続 ---
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'senryu_sns_db',
});

// --- 4. 認証ミドルウェア ---
// 特定のAPI（投稿など）の前に、ログイン状態をチェックする関数
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401); // トークンがない

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403); // トークンが無効
        req.user = user;
        next(); // 次の処理へ
    });
};

// --- 5. APIエンドポイント ---

// ユーザー登録
app.post('/api/users/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)";
        const [result] = await pool.execute(sql, [username, email, hashedPassword]);
        res.status(201).json({ message: '登録成功', userId: result.insertId });
    } catch (error) {
        console.error("★★★ エラー発生！ ★★★:", error);
        res.status(500).json({ error: '登録エラー' });
    }
});

// ログイン
app.post('/api/users/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const sql = "SELECT * FROM users WHERE email = ?";
        const [users] = await pool.execute(sql, [email]);
        if (users.length === 0) return res.status(401).json({ error: '認証失敗' });
        
        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(401).json({ error: '認証失敗' });

        // ログイン成功、JWTトークンを生成
        const accessToken = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ message: 'ログイン成功', token: accessToken });
    } catch (error) {
        res.status(500).json({ error: 'ログインエラー' });
    }
});

// 川柳投稿 (要認証)
app.post('/api/posts', authenticateToken, async (req, res) => {
    try {
        const { content } = req.body;
        const userId = req.user.id; // ミドルウェアがセットしたユーザーIDを使用
        const is575 = await check575(content);
        if (!is575) {
            return res.status(400).json({ error: 'この句は5-7-5ではありません。' });
        }
        const sql = "INSERT INTO posts (user_id, content) VALUES (?, ?)";
        await pool.execute(sql, [userId, content]);
        res.status(201).json({ message: '投稿成功' });
    } catch (error) {
        res.status(500).json({ error: '投稿エラー' });
    }
});

// タイムライン取得
app.get('/api/posts/timeline', async (req, res) => {
    try {
        const sql = `
            SELECT posts.id, posts.content, posts.created_at, users.username AS authorName
            FROM posts JOIN users ON posts.user_id = users.id
            ORDER BY posts.created_at DESC LIMIT 50;
        `;
        const [posts] = await pool.execute(sql);
        res.json(posts);
    } catch (error) {
        res.status(500).json({ error: 'タイムライン取得エラー' });
    }
});

// --- 6. サーバー起動 ---
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`サーバーがポート${PORT}で起動しました。`));
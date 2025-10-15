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
        const { content1, content2, content3 } = req.body;
        const userId = req.user.id; // ミドルウェアがセットしたユーザーIDを使用
        if(!content1 || !content2 || !content3){
            return res.status(400).json({ error: 'すべての句を入力してください。'});
        }
        let num = 0;
        const can_kaminoku = await check575(content1,5);
        const can_nakanoku = await check575(content2,7);
        const can_shimonoku = await check575(content3,5);
        if(!can_kaminoku){
            num = num + 1;
        }
        if(!can_nakanoku){
            num = num + 2;
        }
        if(!can_shimonoku){
            num = num + 4;
        }
        if(num != 0){
            return res.status(400).json({ errorCode: num, message: '句の音の数が正しくありません。' });
        }
        const content = `${content1} ${content2} ${content3}`;
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
            SELECT 
                posts.id, 
                posts.content, 
                posts.created_at, 
                posts.user_id,         -- ▼▼▼ この行を追加 ▼▼▼
                users.username AS authorName
            FROM posts 
            JOIN users ON posts.user_id = users.id
            ORDER BY posts.created_at DESC 
            LIMIT 50;
        `;
        const [posts] = await pool.execute(sql);
        res.json(posts);
    } catch (error) {
        res.status(500).json({ error: 'タイムライン取得エラー' });
    }
});

app.delete('/api/posts/:id', authenticateToken, async (req, res) => {
    try {
        const postId = req.params.id;   // URLから削除したい投稿のIDを取得
        const userId = req.user.id;     // 認証トークンから、操作しているユーザーのIDを取得

        // データベースから、削除しようとしている投稿の投稿者IDを取得
        const [posts] = await pool.execute("SELECT user_id FROM posts WHERE id = ?", [postId]);

        if (posts.length === 0) {
            return res.status(404).json({ error: '投稿が見つかりません。' });
        }

        const postAuthorId = posts[0].user_id;

        // 投稿の作者IDと、操作しているユーザーのIDが一致するかをチェック
        if (postAuthorId !== userId) {
            // もし一致しなければ、権限がないのでエラーを返す
            return res.status(403).json({ error: 'この投稿を削除する権限がありません。' });
        }

        // IDが一致すれば、投稿を削除する
        await pool.execute("DELETE FROM posts WHERE id = ?", [postId]);

        res.status(200).json({ message: '投稿が削除されました。' });

    } catch (error) {
        console.error('削除APIエラー:', error);
        res.status(500).json({ error: 'サーバーエラーが発生しました。' });
    }
});

// --- 6. サーバー起動 ---
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`サーバーがポート${PORT}で起動しました。`));
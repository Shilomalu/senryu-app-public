// --- 1. ライブラリのインポート ---
require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { check575 } = require('./senryu-checker.js');

var { PythonShell } = require("python-shell");
var pyshell = new PythonShell("senryu-checker.py");


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


/*
const checkMoraCountWithPython = (text) => {
  return new Promise((resolve, reject) => {
    pyshell.send(text);
    pyshell.on("message", function (data) {
        console.log(data);
        resolve(data);
    });
  });
};

// 川柳投稿 (要認証)
app.post('/api/posts', authenticateToken, async (req, res) => {
    try {
        const { content1, content2, content3 } = req.body;
        const userId = req.user.id; // ミドルウェアがセットしたユーザーIDを使用
        let num = 0;
        const part1 = await checkMoraCountWithPython(content1);
        const part2 = await checkMoraCountWithPython(content2);
        const part3 = await checkMoraCountWithPython(content3);
        if(part1 !== 5) num = num + 1;
        if(part2 !== 7) num = num + 2;
        if(part3 !== 5) num = num + 4;
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
*/

// タイムライン取得
app.get('/api/posts/timeline', async (req, res) => {
    try {
        // ログインユーザーのIDを取得（オプショナル）
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        let userId = null;
        
        if (token) {
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                userId = decoded.id;
            } catch (err) {
                console.warn('Invalid token in timeline request:', err);
            }
        }

        const sql = `
            SELECT 
                posts.id, 
                posts.content, 
                posts.created_at, 
                posts.user_id,
                users.username AS authorName,
                CASE WHEN likes.user_id IS NOT NULL THEN 1 ELSE 0 END AS isLiked,
                CASE WHEN follows.follower_id IS NOT NULL THEN 1 ELSE 0 END AS isFollowing,
                (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id) AS likesCount,
                (SELECT COUNT(*) FROM replies WHERE replies.post_id = posts.id) AS repliesCount
            FROM posts 
            JOIN users ON posts.user_id = users.id
            LEFT JOIN likes ON likes.post_id = posts.id AND likes.user_id = ?
            LEFT JOIN follows ON follows.followed_id = posts.user_id AND follows.follower_id = ?
            ORDER BY posts.created_at DESC 
            LIMIT 50;
        `;
        
        const [posts] = await pool.execute(sql, [userId, userId]);
        res.json(posts);
    } catch (error) {
        console.error('タイムライン取得エラー:', error);
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

// 投稿詳細とそのリプライ取得
app.get('/api/posts/:id', async (req, res) => {
    try {
        const postId = req.params.id;
        const [posts] = await pool.execute(
            `SELECT posts.id, posts.content, posts.created_at, posts.user_id, users.username AS authorName FROM posts JOIN users ON posts.user_id = users.id WHERE posts.id = ?`,
            [postId]
        );
        if (posts.length === 0) return res.status(404).json({ error: '投稿が見つかりません。' });
        const post = posts[0];

        const [replies] = await pool.execute(
            `SELECT replies.id, replies.content, replies.created_at, replies.user_id, users.username AS authorName FROM replies JOIN users ON replies.user_id = users.id WHERE replies.post_id = ? ORDER BY replies.created_at DESC`,
            [postId]
        );

        res.json({ post, replies });
    } catch (err) {
        console.error('投稿詳細取得エラー:', err);
        res.status(500).json({ error: '投稿詳細の取得に失敗しました' });
    }
});

// リプライ投稿 (要認証)
app.post('/api/posts/:id/reply', authenticateToken, async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.id;
        const { content } = req.body; // ここでは content を1つの文字列で受け取る
        if (!content) return res.status(400).json({ error: 'リプライの内容が必要です' });

        await pool.execute('INSERT INTO replies (user_id, post_id, content) VALUES (?, ?, ?)', [userId, postId, content]);
        res.status(201).json({ message: 'リプライを投稿しました' });
    } catch (err) {
        console.error('リプライ投稿エラー:', err);
        res.status(500).json({ error: 'リプライの投稿に失敗しました' });
    }
});

// リプライ削除 (要認証)
app.delete('/api/replies/:id', authenticateToken, async (req, res) => {
    try {
        const replyId = req.params.id;
        const userId = req.user.id;

        const [rows] = await pool.execute('SELECT user_id FROM replies WHERE id = ?', [replyId]);
        if (rows.length === 0) return res.status(404).json({ error: 'リプライが見つかりません' });
        if (rows[0].user_id !== userId) return res.status(403).json({ error: '削除権限がありません' });

        await pool.execute('DELETE FROM replies WHERE id = ?', [replyId]);
        res.status(200).json({ message: 'リプライを削除しました' });
    } catch (err) {
        console.error('リプライ削除エラー:', err);
        res.status(500).json({ error: 'リプライの削除に失敗しました' });
    }
});

// --- 6. サーバー起動 ---
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`サーバーがポート${PORT}で起動しました。`));
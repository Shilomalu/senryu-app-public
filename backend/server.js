// --- 1. ライブラリのインポート ---
require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { check575 } = require('./senryu-checker.js');
const { HKtoZK, HGtoZK } = require('./helper_fun.js');

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
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

/*
const pool = mysql.createPool({
  host: 'localhost',
  user: 'Project_Team6_user',
  password: 'Project_Team6_pw',
  database: 'Project_Team6_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
*/

// --- 4. 認証ミドルウェア ---
// 特定のAPI（投稿など）の前に、ログイン状態をチェックする関数
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    console.log('Authorizationヘッダー:', authHeader);
    console.log('Token:', token);

    if (!token) return res.status(401).json({ error: 'Tokenがありません' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.log('JWT認証エラー:', err);
            return res.status(403).json({ error: 'Tokenが無効です' });
        }
        console.log('JWT認証成功:', user);
        req.user = user;
        next();
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


// 認証付きプロフィール更新API
app.put("/api/users/me", authenticateToken, async (req, res) => {
  const { username, profile_text } = req.body;
  const id = req.user.id; // JWT から自動取得

  try {
    let updates = [];
    let values = [];

    if (username !== undefined) {
      updates.push("username = ?");
      values.push(username);
    }
    if (profile_text !== undefined) {
      updates.push("profile_text = ?");
      values.push(profile_text);
    }

    if (updates.length === 0)
      return res.status(400).json({ message: "No data to update" });

    values.push(id); // WHERE id = ?
    const sql = `UPDATE users SET ${updates.join(", ")} WHERE id = ?`;
    const [result] = await pool.execute(sql, values);

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "User not found" });

    const [rows] = await pool.execute(
      "SELECT id, username, email, profile_text FROM users WHERE id = ?",
      [id]
    );
    res.json({ message: "Profile updated successfully", user: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// JWT 認証付きで自分のプロフィールを取得
app.get('/api/users/me', authenticateToken, async (req, res) => {
  const id = req.user.id;
  console.log('--- /api/users/me ---');
  console.log('req.user.id:', id);
  try {
    const [rows] = await pool.execute(
      "SELECT id, username, email, profile_text FROM users WHERE id = ?",
      [id]
    );
    console.log('DB結果:', rows);
    if (rows.length === 0) return res.status(404).json({ message: "User not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// 川柳投稿 (要認証)
app.post('/api/posts', authenticateToken, async (req, res) => {
    try {
        let { content1, content2, content3 } = req.body;
        const userId = req.user.id; // ミドルウェアがセットしたユーザーIDを使用
        if(!content1 || !content2 || !content3){
            return res.status(400).json({ error: 'すべての句を入力してください。'});
        }
        let num = 0;
        const { flag: can_kaminoku, symbolCount: symbolCount1, word_id: word_id1, words: word1 } = await check575(content1, 5);
        const { flag: can_nakanoku, symbolCount: symbolCount2, word_id: word_id2, words: word2 } = await check575(content2, 7);
        const { flag: can_shimonoku, symbolCount: symbolCount3, word_id: word_id3, words: word3 } = await check575(content3, 5);
        if (!can_kaminoku) num = num + 1;
        if (!can_nakanoku) num = num + 2;
        if (!can_shimonoku) num = num + 4;

        if (num != 0) {
            return res.status(400).json({ errorCode: num, message: '句の音の数が正しくありません。' });
        }
        const symbolCount = symbolCount1 + symbolCount2 + symbolCount3
        if (symbolCount > 4) {
            return res.status(400).json({ errorCode: -1, message: '記号などが多すぎます。' });
        }
        content1 = HKtoZK(content1); content2 = HKtoZK(content2); content3 = HKtoZK(content3);
        const content = `${content1} ${content2} ${content3}`;
        const sql = "INSERT INTO posts (user_id, content) VALUES (?, ?)";
        await pool.execute(sql, [userId, content]);
        res.status(201).json({ message: '投稿成功' });
    // --- 投稿をDBに保存して投稿IDを取得 ---
    const content = `${content1} ${content2} ${content3}`;
    const [postResult] = await pool.execute(
      "INSERT INTO posts (user_id, content) VALUES (?, ?)",
      [userId, content]
    );

    const sennryuu_id = postResult.insertId; // ← 実際に登録されたID！
    console.log("登録された川柳ID:", sennryuu_id);

    // --- dictionaryテーブルにword_idを登録 ---
    const word_id_array = [...(word_id1 || []), ...(word_id2 || []), ...(word_id3 || [])];
     const word_array = [...(word1 || []), ...(word2 || []), ...(word3 || [])];
    console.log("登録するword_id_array:", word_id_array);

    for (let i = 0; i < word_id_array.length; i++) {
      if (word_id_array[i] == null) continue; // nullスキップ
      await pool.execute(
        "INSERT INTO dictionary (word_id, word, sennryuu_id) VALUES (?, ?, ?)",
        [word_id_array[i], word_array[i], sennryuu_id]
      );
    }

    console.log("dictionary 登録完了");
    res.status(201).json({ message: '投稿成功', sennryuu_id });

  } catch (error) {
    console.error("投稿エラー詳細:", error);
    res.status(500).json({ error: '投稿エラー', detail: error.message });
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
        const { content1, content2, content3 } = req.body;
        const userId = req.user.id; // ミドルウェアがセットしたユーザーIDを使用
        const postId = req.params.id;
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

//ここから検索処理
const {checkPart}=require('./senryu-checker.js');

app.get('/api/search',async(req,res)=>{

    try{
        const keyword=req.query.q;
        
        if(!keyword){
            return res.status(400).json({error:'検索ワードを入力してね'});
        }

        //検索ワードを形態素解析して各単語のIDを取得
        const result=await checkPart(keyword);
        const word_id_array=result.word_id;//形態素解析で得た単語のIDを格納した配列

        if(word_id_array.length===0){
            return res.json([]);
        }

        //データベースからword_idと一致する行を取得
        const placeholders=word_id_array.map(()=>'?').join(',');
        const dictionary=`
            SELECT sennryuu_id, word_id
            FROM dictionary
            WHERE word_id IN (${placeholders})
            `;
        const [rows]=await pool.query(dictionary,word_id_array);

        if(rows.length===0){
            return res.json([]);
        }

        const sennryuu_count={};

        for(let i=0;i<rows.length;i++){
            const sennryuuID=rows[i].sennryuu_id;

            if(sennryuu_count[sennryuuID]===undefined){
                sennryuu_count[sennryuuID]=0;
            }

            sennryuu_count[sennryuuID]++;
        }

            //出現回数が高い順にソート
           const sennryuuIds = Object.keys(sennryuu_count);

        sennryuuIds.sort((a, b) => {
        if (sennryuu_count[a] > sennryuu_count[b]) return -1; // aの方がスコア高い → 先
        if (sennryuu_count[a] < sennryuu_count[b]) return 1;  // bの方がスコア高い → 後
        return 0; // 同点なら順番変えない
        });

        //postsから該当する川柳を取得
        const placeholders2=sennryuuIds.map(()=>'?').join(',');
        const sql_message= `
            SELECT posts.id, posts.content, users.username, posts.created_at
            FROM posts
            JOIN users ON posts.user_id = users.id
            WHERE posts.id IN (${placeholders2})
            `;
        
            const get_sennryuus=await pool.query(sql_message,sennryuuIds);
            const target_sennryuus=get_sennryuus[0];
            
            const target_sennryuus_sort=[];
            for(let i=0;i<sennryuuIds.length;i++){
               const id = Number(sennryuuIds[i]);
                const found =target_sennryuus.find(post => post.id === id);
                if (found) {
                    target_sennryuus_sort.push(found);
                }
            }

            res.json(target_sennryuus_sort);


        }
        catch(error){
            console.error('検索エラー：',error);
            res.status(500).json({error:'検索中にエラーが発生しました。'});

        }


    
});

// --- 「いとをかし」機能API ---
// --- 「いとをかし」機能API ---
app.get('/api/posts/:postId/likes', async (req, res) => {
  try {
    const { postId } = req.params;
    const [rows] = await pool.query(
      `SELECT users.id, users.username 
       FROM likes 
       JOIN users ON likes.user_id = users.id 
       WHERE likes.post_id = ?`,
      [postId]
    );
    res.json(rows);
  } catch (error) {
    console.error('いとをかし一覧取得エラー:', error);
    res.status(500).json({ error: 'いとをかし一覧取得に失敗しました' });
  }
});

// 特定ユーザーの「いとをかし」状態取得
app.get('/api/posts/:postId/likes/status', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    // 自分が「いとをかし」しているか？
    const [likedRows] = await pool.query(
      `SELECT * FROM likes WHERE post_id = ? AND user_id = ?`,
      [postId, userId]
    );

    // 全体の数
    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS count FROM likes WHERE post_id = ?`,
      [postId]
    );

    // 誰が「いとをかし」したか
    const [users] = await pool.query(
      `SELECT users.id, users.username 
       FROM likes 
       JOIN users ON likes.user_id = users.id 
       WHERE likes.post_id = ?`,
      [postId]
    );

    res.json({
      liked: likedRows.length > 0,
      count: countRows[0].count,
      users
    });
  } catch (error) {
    console.error('いとをかし状態取得エラー:', error);
    res.status(500).json({ error: 'いとをかし状態取得に失敗しました' });
  }
});

// 「いとをかし」追加
app.post('/api/posts/:postId/like', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    await pool.query(
      `INSERT IGNORE INTO likes (post_id, user_id) VALUES (?, ?)`,
      [postId, userId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('いとをかし追加エラー:', error);
    res.status(500).json({ error: 'いとをかし追加に失敗しました' });
  }
});

// 「いとをかし」解除
app.delete('/api/posts/:postId/like', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    await pool.query(
      `DELETE FROM likes WHERE post_id = ? AND user_id = ?`,
      [postId, userId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('いとをかし解除エラー:', error);
    res.status(500).json({ error: 'いとをかし解除に失敗しました' });
  }
});




// --- 6. サーバー起動 ---
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`サーバーがポート${PORT}で起動しました。`));
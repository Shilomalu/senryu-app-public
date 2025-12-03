// --- 1. ライブラリのインポート ---
require("dotenv").config();
const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { check575, checkPart } = require("./senryu-checker.js");
const { startScheduler } = require('./scheduler');
const { HKtoZK } = require("./helper_fun.js");
const { make_ruby } = require('./ruby.js');

// --- 2. 基本設定 ---

const app = express();
app.use(cors());
app.use(express.json());
const JWT_SECRET = process.env.JWT_SECRET || "your-very-secret-key"; // .envファイルで設定推奨


// --- 3. データベース接続 ---

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "senryu_sns_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
startScheduler(pool);


// --- 4. 認証ミドルウェア ---

// 特定のAPI（投稿など）の前に、ログイン状態をチェックする関数
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  console.log("Authorizationヘッダー:", authHeader);
  console.log("Token:", token);

  if (!token) return res.status(401).json({ error: "Tokenがありません" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log("JWT認証エラー:", err);
      return res.status(403).json({ error: "Tokenが無効です" });
    }
    console.log("JWT認証成功:", user);
    req.user = user;
    next();
  });
};


//機械学習による推論関係
const { execSync } = require("child_process");
const path = require("path");


function predict_genre_function(text){
const scriptPath = path.join(__dirname, "..", "ml", "genre_predict.py");

  //genre_predictは推論したジャンルIDを標準出力として返すから、それを文字列で受け取る
  const stringID=execSync( `python "${scriptPath}" ${JSON.stringify(text)}`,
    { encoding: "utf-8" } );

    const stringID_trim=stringID.trim();
    
    //文字列を整数に変換する
    const genreID=Number(stringID_trim);

    return genreID;
}

// --- 5. APIエンドポイント ---

app.post("/api/genre/predict",async(req,res)=>{
  try {
     const { content1, content2, content3 } = req.body;
    console.log(content1);

    // 3つとも必須
    if (!content1 || !content2 || !content3) {
      return res.status(400).json({ error: "3つすべての句を入力してください。" });
    }

    const target_senryu = `${content1} ${content2} ${content3}`;

    const genre_id = predict_genre_function(target_senryu);

    console.log("★予測ジャンルID:", genre_id);

    return res.json({ genre_id });
  } catch (e) {
    console.error("ジャンル自動推論APIエラー:", e);
    return res.status(500).json({ error: "ジャンルの自動推論に失敗しました。" });
  }
})

// ユーザー登録
app.post("/api/users/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql =
      "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)";
    const [result] = await pool.execute(sql, [username, email, hashedPassword]);
    res.status(201).json({ message: "登録成功", userId: result.insertId });
  } catch (error) {
    console.error("★★★ エラー発生！ ★★★:", error);
    res.status(500).json({ error: "登録エラー" });
  }
});

// ログイン
app.post("/api/users/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const sql = "SELECT * FROM users WHERE email = ?";
    const [users] = await pool.execute(sql, [email]);
    if (users.length === 0) return res.status(401).json({ error: "認証失敗" });

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ error: "認証失敗" });

    // ログイン成功、JWTトークンを生成
    const accessToken = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.json({ message: "ログイン成功", token: accessToken });
  } catch (error) {
    res.status(500).json({ error: "ログインエラー" });
  }
});

// JWT 認証付きで自分のプロフィールを取得
app.get("/api/users/me", authenticateToken, async (req, res) => {
  const id = req.user.id;
  console.log("--- /api/users/me ---");
  console.log("req.user.id:", id);
  try {
    const [rows] = await pool.execute(
      "SELECT id, username, email, profile_text, favorite_id, icon_index FROM users WHERE id = ?",
      [id]
    );
    console.log("DB結果:", rows);
    if (rows.length === 0)
      return res.status(404).json({ message: "User not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// 認証付きプロフィール更新API
app.put("/api/users/me", authenticateToken, async (req, res) => {
  const { username, profile_text, favorite_id } = req.body;
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

    if (favorite_id !== undefined) {
      updates.push("favorite_id = ?");
      values.push(favorite_id);
    }

    if (updates.length === 0)
      return res.status(400).json({ message: "No data to update" });

    values.push(id); // WHERE id = ?
    const sql = `UPDATE users SET ${updates.join(", ")} WHERE id = ?`;
    const [result] = await pool.execute(sql, values);

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "User not found" });

    const [rows] = await pool.execute(
      "SELECT id, username, email, profile_text, favorite_id FROM users WHERE id = ?",
      [id]
    );
    res.json({ message: "Profile updated successfully", user: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// アイコン変更
app.post('/api/users/me/icon', authenticateToken,  async (req, res) => {
  const userId = req.user.id;
  const { icon } = req.body;

  if (icon === undefined || icon === null) {
    return res.status(400).json({ error: "icon を指定してください" });
  }

  try {
    const sql = `
      UPDATE users
      SET icon_index = ?
      WHERE id = ?
    `;
    await pool.query(sql, [icon, userId]);

    res.json({ message: "アイコンを更新しました", icon });
  } catch (error) {
    console.error("Error updating icon:", error);
    res.status(500).json({ error: "アイコン更新中にエラーが発生しました" });
  }
});

/*
// お気に入りの一句を設定
app.put('/api/users/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { favorite_id } = req.body;

    // favorite_post_id を更新
    await pool.execute(
      "UPDATE users SET favorite_id = ? WHERE id = ?",
      [favorite_id, userId]
    );

    // 更新後のユーザー情報を返す
    const [rows] = await pool.execute(
      "SELECT id, username, email, profile_text, favorite_id FROM users WHERE id = ?",
      [userId]
    );

    res.json({ message: 'お気に入りの一句を更新しました', user: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'お気に入り設定に失敗しました' });
  }
});
*/

// 特定ユーザーの投稿一覧取得
app.get("/api/posts/user/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const [rows] = await pool.query(
      `SELECT 
         posts.id, 
         posts.content, 
         posts.user_id, 
         posts.genre_id,
         posts.ruby_content,
         users.username AS authorName,
         (SELECT COUNT(*) FROM replies WHERE replies.post_id = posts.id) AS repliesCount,
         (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id) AS likesCount
       FROM posts
       JOIN users ON posts.user_id = users.id
       WHERE posts.user_id = ?
       ORDER BY posts.created_at DESC`,
      [userId]
    );

    res.json(rows);
  } catch (err) {
    console.error("特定ユーザー投稿取得エラー:", err);
    res.status(500).json({ message: "投稿の取得に失敗しました" });
  }
});

// 川柳投稿 (ジャンル対応・要認証)
app.post("/api/posts", authenticateToken, async (req, res) => {
  try {
    let { content1, content2, content3, ruby_dataset, genre_id, weekly_theme_id } = req.body;
    const userId = req.user.id; // ミドルウェアがセットしたユーザーIDを使用

    const contents = [];
    for (const ruby_data of ruby_dataset) {
      contents.push(ruby_data.map(rd => rd.word).join(""));
    }

    if (!contents[0] || !contents[1] || !contents[2]) {
      return res.status(400).json({ error: "すべての句を入力してください。" });
    }

    if (!genre_id) {
      //ジャンルIDがNullだった場合は人工知能が頑張ってジャンルを推論する
      const target_senryu= `${content1} ${content2} ${content3}`;

      try{
        const predict_genre_id= predict_genre_function(target_senryu);
        genre_id=predict_genre_id
        console.log("予測したジャンル：",genre_id);
      }
      catch(e){
        console.error(e);
          console.error("ジャンルの自動推論に失敗しました",e);
          genre_id=8;
        
      }
    }

    // 使用不可の文字チェック
    const regex =
      /^[\u3040-\u309F\u30A0-\u30FF\uFF65-\uFF9F\u4E00-\u9FFF。｡、､「｢」｣・･！!？?]+$/;
    if (
      !regex.test(contents[0]) ||
      !regex.test(contents[1]) ||
      !regex.test(contents[2])
    ) {
      return res
        .status(400)
        .json({ error: "入力できない文字が含まれています。" });
    }

    // 半角→全角変換
    content1 = HKtoZK(content1);
    content2 = HKtoZK(content2);
    content3 = HKtoZK(content3);
    const content = `${content1} ${content2} ${content3}`;

    let num = 0;
    const {
      flag: can_kaminoku,
      symbolCount: symbolCount1,
    } = await check575(ruby_dataset[0], 5);
    const {
      flag: can_nakanoku,
      symbolCount: symbolCount2,
    } = await check575(ruby_dataset[1], 7);
    const {
      flag: can_shimonoku,
      symbolCount: symbolCount3,
    } = await check575(ruby_dataset[2], 5);
    if (!can_kaminoku) num += 1;
    if (!can_nakanoku) num += 2;
    if (!can_shimonoku) num += 4;

    if (num !== 0)
      return res
        .status(400)
        .json({ errorCode: num, message: "句の音の数が正しくありません。" });

    const symbolCount = symbolCount1 + symbolCount2 + symbolCount3;
    if (symbolCount > 4)
      return res.status(400).json({ error: "記号などが多すぎます。" });

    //ここでもし

    // --- 投稿をDBに保存して投稿IDを取得 ---
    const [postResult] = await pool.execute(
      "INSERT INTO posts (user_id, content, ruby_content, genre_id, weekly_theme_id) VALUES (?, ?, ?, ?, ?)",
      [userId, content, JSON.stringify(ruby_dataset), genre_id, weekly_theme_id || null]
    );

    const sennryuu_id = postResult.insertId;
    console.log("登録された川柳ID:", sennryuu_id);

    res.status(201).json({ message: "投稿成功", sennryuu_id });
  } catch (error) {
    console.error("投稿エラー詳細:", error);
    res.status(500).json({ error: "投稿エラー", detail: error.message });
  }
});

// ルビ関連
app.post("/api/ruby", async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "text が空です" });
  }

  try {
    const result = await make_ruby(text);
    res.json(result);
  } catch (err) {
    console.error("Ruby API error", err);
    res.status(500).json({ error: "ルビ解析に失敗しました" });
  }
});

// タイムライン取得
app.get("/api/posts/timeline", async (req, res) => {
  try {
    // ログインユーザーのIDを取得（オプショナル）
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    let userId = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.id;
      } catch (err) {
        console.warn("Invalid token in timeline request:", err);
      }
    }

    const sql = `
            SELECT 
                posts.id, 
                posts.content, 
                posts.created_at, 
                posts.user_id,
                posts.genre_id,
                posts.ruby_content,
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
    console.error("タイムライン取得エラー:", error);
    res.status(500).json({ error: "タイムライン取得エラー" });
  }
});

// --- ここから追加：お題・ランキング機能API ---

// 1. 現在開催中のお題を取得
app.get('/api/themes/current', async (req, res) => {
  try {
    const sql = `
      SELECT 
        w.id AS weekly_theme_id,
        t.theme_name,
        w.start_date,
        w.end_date
      FROM weekly_themes w
      JOIN topic_master t ON w.topic_id = t.id
      WHERE CURDATE() BETWEEN w.start_date AND w.end_date
      LIMIT 1;
    `;
    const [rows] = await pool.query(sql);
    if (rows.length === 0) return res.json(null);
    res.json(rows[0]);
  } catch (err) {
    console.error('お題取得エラー:', err);
    res.status(500).json({ error: 'お題情報の取得に失敗しました' });
  }
});

app.get('/api/themes/current/posts', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let currentUserId = 0; // 未ログインまたはトークンなし

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        currentUserId = decoded.id;
      } catch (e) {
        console.warn('Token verify failed:', e.message);
      }
    }

    // 1. まず、今開催中のお題IDを取得
    const themeSql = `
      SELECT id FROM weekly_themes 
      WHERE CURDATE() BETWEEN start_date AND end_date 
      LIMIT 1
    `;
    const [themes] = await pool.query(themeSql);

    if (themes.length === 0) {
      return res.json([]); // お題開催期間外なら空で返す
    }

    const currentThemeId = themes[0].id;

    // 2. そのお題IDがついている投稿を取得
    const postsSql = `
      SELECT 
        posts.id, 
        posts.content, 
        posts.ruby_content,
        posts.created_at, 
        posts.user_id,
        posts.genre_id,
        users.username AS authorName,
        (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id) AS likesCount,
        (SELECT COUNT(*) FROM replies WHERE replies.post_id = posts.id) AS repliesCount,
        CASE WHEN l.user_id IS NOT NULL THEN 1 ELSE 0 END AS isLiked
      FROM posts 
      JOIN users ON posts.user_id = users.id
      -- ログインユーザーのいいね情報を結合 (req.userがあれば)
      LEFT JOIN likes l ON l.post_id = posts.id AND l.user_id = ?
      WHERE posts.weekly_theme_id = ?
      ORDER BY posts.created_at DESC -- 新しい順
      LIMIT 50;
    `;

    // ※認証トークンがない場合も考慮して、user_idは null の可能性あり
    // 簡易的に user_id = 0 (ゲスト) として処理するか、
    // 必要なら authenticateToken ミドルウェアを通すか調整します。
    // 今回はゲストでも見れるように、user_id は null許容で書きます。
    
    // トークン解析は省略し、一旦全員「いいね無し」として返す簡易版にします
    // もし「いいね済み」を反映させたい場合は、TimelineViewからトークンを送る必要があります
    
    const [rows] = await pool.query(postsSql, [currentUserId, currentThemeId]);
    res.json(rows);

  } catch (err) {
    console.error('今週のお題投稿取得エラー:', err);
    res.status(500).json({ error: '投稿の取得に失敗しました' });
  }
});

// 2. 最新のランキング（先週の結果）を取得
app.get('/api/themes/ranking/latest', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let currentUserId = 0;
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        currentUserId = decoded.id;
      } catch (e) {}
    }
    const latestSql = `SELECT weekly_theme_id FROM ranking_results ORDER BY id DESC LIMIT 1`;
    const [latestRows] = await pool.query(latestSql);

    if (latestRows.length === 0) return res.json([]);

    const targetThemeId = latestRows[0].weekly_theme_id;

    const rankingSql = `
      SELECT 
        r.rank,
        r.fixed_likes_count AS likesCount,
        p.id,
        p.content,
        p.ruby_content,
        p.user_id,
        p.genre_id,
        u.username AS authorName,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = ?) AS isLiked
      FROM ranking_results r
      JOIN posts p ON r.post_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE r.weekly_theme_id = ?
      ORDER BY r.rank ASC
    `;
    const [rankingPosts] = await pool.query(rankingSql, [currentUserId, targetThemeId]);
    res.json(rankingPosts);
  } catch (err) {
    console.error('ランキング取得エラー:', err);
    res.status(500).json({ error: 'ランキングの取得に失敗しました' });
  }
});

// 3. ランキング集計・確定API (バッチ処理用)
app.post('/api/batch/calculate-ranking', async (req, res) => {
  try {
    // 集計対象（今日が終わったばかりの回、かつ未集計のもの）を探す
    // ※デモ動作確認のため「終了日が今日以前」の条件にしています
    const findTargetSql = `
      SELECT id FROM weekly_themes 
      WHERE end_date < CURDATE() 
      AND id NOT IN (SELECT weekly_theme_id FROM ranking_results)
      ORDER BY end_date DESC LIMIT 1
    `;
    const [targetRows] = await pool.query(findTargetSql);

    if (targetRows.length === 0) {
      return res.json({ message: '集計対象が見つかりませんでした（集計済みか、期間終了したお題がありません）' });
    }

    const targetThemeId = targetRows[0].id;

    // トップ10を保存
    const insertSql = `
      INSERT INTO ranking_results (weekly_theme_id, post_id, rank, fixed_likes_count)
      SELECT ?, p.id, ROW_NUMBER() OVER (ORDER BY p.likes_num DESC), p.likes_num
      FROM posts p
      WHERE p.weekly_theme_id = ?
      ORDER BY p.likes_num DESC
      LIMIT 10;
    `;
    await pool.query(insertSql, [targetThemeId, targetThemeId]);

    res.json({ message: `ID:${targetThemeId} のランキングを確定しました！` });
  } catch (err) {
    console.error('集計エラー:', err);
    res.status(500).json({ error: '集計処理に失敗しました' });
  }
});

app.get("/api/posts/likes", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await pool.query(
      `
      SELECT 
        posts.id,
        posts.content,
        posts.created_at,
        posts.user_id,
        posts.genre_id,
        posts.ruby_content,
        users.username AS authorName,
        1 AS isLiked,  -- いいね済み確定
        (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id) AS likesCount,
        (SELECT COUNT(*) FROM replies WHERE replies.post_id = posts.id) AS repliesCount
      FROM posts
      JOIN users ON posts.user_id = users.id
      JOIN likes ON likes.post_id = posts.id
      WHERE likes.user_id = ?
      ORDER BY posts.created_at DESC
      LIMIT 50;
    `,
      [userId]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "いいね投稿の取得に失敗しました" });
  }
});

// --- フォローしているユーザーの投稿だけを取得するタイムライン ---
app.get('/api/posts/timeline/following', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const sql = `
      SELECT
            p.*,
            u.username AS authorName,
            (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS likesCount,
            (SELECT EXISTS (
                SELECT 1
                FROM likes
                WHERE post_id = p.id AND user_id = ?
            )) AS isLiked
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.user_id IN (
            SELECT followed_id
            FROM follows
            WHERE follower_id = ?
        )
        ORDER BY p.created_at DESC
        LIMIT 50
    `;

    const [posts] = await pool.query(sql, [userId, userId]);
    res.json(posts);
  } catch (error) {
    console.error('フォロー中タイムライン取得エラー:', error);
    res.status(500).json({ error: 'フォロー中タイムライン取得に失敗しました。' });
  }
});
app.delete("/api/posts/:id", authenticateToken, async (req, res) => {
  try {
    const postId = req.params.id; // URLから削除したい投稿のIDを取得
    const userId = req.user.id; // 認証トークンから、操作しているユーザーのIDを取得

    // データベースから、削除しようとしている投稿の投稿者IDを取得
    const [posts] = await pool.execute(
      "SELECT user_id FROM posts WHERE id = ?",
      [postId]
    );

    if (posts.length === 0) {
      return res.status(404).json({ error: "投稿が見つかりません。" });
    }

    const postAuthorId = posts[0].user_id;

    // 投稿の作者IDと、操作しているユーザーのIDが一致するかをチェック
    if (postAuthorId !== userId) {
      // もし一致しなければ、権限がないのでエラーを返す
      return res
        .status(403)
        .json({ error: "この投稿を削除する権限がありません。" });
    }

    // IDが一致すれば、投稿を削除する
    await pool.execute("DELETE FROM posts WHERE id = ?", [postId]);

    res.status(200).json({ message: "投稿が削除されました。" });
  } catch (error) {
    console.error("削除APIエラー:", error);
    res.status(500).json({ error: "サーバーエラーが発生しました。" });
  }
});

// 投稿詳細とそのリプライ取得
app.get("/api/posts/:id", async (req, res) => {
  try {
    const postId = req.params.id;
    const [posts] = await pool.execute(
      `SELECT posts.id, posts.content, posts.created_at, posts.user_id, users.username AS authorName FROM posts JOIN users ON posts.user_id = users.id WHERE posts.id = ?`,
      [postId]
    );
    if (posts.length === 0)
      return res.status(404).json({ error: "投稿が見つかりません。" });
    const post = posts[0];

    const [replies] = await pool.execute(
      `SELECT replies.id, replies.content, replies.created_at, replies.user_id, users.username AS authorName FROM replies JOIN users ON replies.user_id = users.id WHERE replies.post_id = ? ORDER BY replies.created_at DESC`,
      [postId]
    );

    res.json({ post, replies });
  } catch (err) {
    console.error("投稿詳細取得エラー:", err);
    res.status(500).json({ error: "投稿詳細の取得に失敗しました" });
  }
});

// リプライ投稿 (要認証)
app.post("/api/posts/:id/reply", authenticateToken, async (req, res) => {
  try {
    let { content1, content2, content3 } = req.body;
    const userId = req.user.id; // ミドルウェアがセットしたユーザーIDを使用
    const postId = req.params.id;
    if (!content1 || !content2 || !content3) {
      return res.status(400).json({ error: "すべての句を入力してください。" });
    }

    // 使用不可の文字があればエラーを出す
    const regex =
      /^[\u3040-\u309F\u30A0-\u30FF\uFF65-\uFF9F\u4E00-\u9FFF。｡、､「｢」｣・･！!？?]+$/;
    if (
      !regex.test(content1) ||
      !regex.test(content2) ||
      !regex.test(content3)
    ) {
      return res
        .status(400)
        .json({ error: "入力できない文字が含まれています。" });
    }

    const ruby1 = await make_ruby(content1);
    const ruby2 = await make_ruby(content2);
    const ruby3 = await make_ruby(content3);

    let num = 0;

    const { flag: can_kaminoku, symbolCount: symbolCount1 } = await check575(ruby1.ruby_data, 5);
    const { flag: can_nakanoku, symbolCount: symbolCount2 } = await check575(ruby2.ruby_data, 7);
    const { flag: can_shimonoku, symbolCount: symbolCount3 } = await check575(ruby3.ruby_data, 5);

    if (!can_kaminoku) num += 1;
    if (!can_nakanoku) num += 2;
    if (!can_shimonoku) num += 4;

    if (num !== 0)
      return res
        .status(400)
        .json({ errorCode: num, message: "句の音の数が正しくありません。" });

    const symbolCount = symbolCount1 + symbolCount2 + symbolCount3;
    if (symbolCount > 4)
      return res
        .status(400)
        .json({ errorCode: -1, message: "記号などが多すぎます。" });

    content1 = HKtoZK(content1);
    content2 = HKtoZK(content2);
    content3 = HKtoZK(content3);
    const content = `${content1} ${content2} ${content3}`;

    if (!content)
      return res.status(400).json({ error: "リプライの内容が必要です" });

    await pool.execute(
      "INSERT INTO replies (user_id, post_id, content) VALUES (?, ?, ?)",
      [userId, postId, content]
    );
    res.status(201).json({ message: "リプライを投稿しました" });
  } catch (err) {
    console.error("リプライ投稿エラー:", err);
    res.status(500).json({ error: "リプライの投稿に失敗しました" });
  }
});

// リプライ削除 (要認証)
app.delete("/api/replies/:id", authenticateToken, async (req, res) => {
  try {
    const replyId = req.params.id;
    const userId = req.user.id;

    const [rows] = await pool.execute(
      "SELECT user_id FROM replies WHERE id = ?",
      [replyId]
    );
    if (rows.length === 0)
      return res.status(404).json({ error: "リプライが見つかりません" });
    if (rows[0].user_id !== userId)
      return res.status(403).json({ error: "削除権限がありません" });

    await pool.execute("DELETE FROM replies WHERE id = ?", [replyId]);
    res.status(200).json({ message: "リプライを削除しました" });
  } catch (err) {
    console.error("リプライ削除エラー:", err);
    res.status(500).json({ error: "リプライの削除に失敗しました" });
  }
});

// --- 他のユーザーのプロフィール取得 ---
app.get("/api/users/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    // DBからユーザー情報を取得
    const [rows] = await pool.execute(
      "SELECT id, username, email, profile_text FROM users WHERE id = ?",
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "ユーザーが見つかりません" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("プロフィール取得エラー:", error);
    res.status(500).json({ error: "プロフィール取得に失敗しました" });
  }
});

// 特定ユーザーの投稿一覧取得
app.get("/api/posts/user/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    // 特定のユーザーIDに一致する投稿を、新しい順に取得
    const sql = `
      SELECT 
        posts.id, 
        posts.content, 
        posts.created_at, 
        posts.user_id,
        posts.genre_id,
        posts.ruby_content,
        users.username AS authorName
      FROM posts 
      JOIN users ON posts.user_id = users.id
      WHERE posts.user_id = ?
      ORDER BY posts.created_at DESC 
      LIMIT 50;
    `;

    // db.all ではなく、pool.execute を使う
    const [posts] = await pool.execute(sql, [userId]);

    res.json(posts); // 投稿の配列を返す
  } catch (error) {
    console.error("特定ユーザーの投稿取得エラー:", error);
    res.status(500).json({ error: "投稿の取得に失敗しました" });
  }
});

//ここから検索処理
app.get("/api/search", async (req, res) => {
  try {
    const keyword = req.query.input_words;
    const genre = req.query.genre;
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    let currentUserId = null;
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        currentUserId = decoded.id;
      } catch (err) {
        console.warn("Search: Invalid token", err);
      }
    }

    //単語もジャンルも入力されていなかったらエラー
    if (!keyword && !genre) {
      return res.status(400).json({ error: "検索ワードを入力してください" });
    }

    //入力された単語を空白で区切って配列に入れる
    let keyword_split = [];
    if (typeof keyword === "string" && keyword.trim() != "") {
      keyword_split = keyword.trim().split(/[\s　]+/);
    }

    let genreId = null;
    if (genre !== undefined && genre !== null) {
      genreId = Number(genre);
    }

    let ids_AND = [];
    let ids_OR = [];
    let ids_Genre = [];

    //AND検索
    if (keyword_split.length > 0) {
      let conditions_AND = "";
      const params_AND = [];

      for (let i = 0; i < keyword_split.length; i++) {
        const word = String(keyword_split[i]).trim();
        if (word === "") continue;

        if (conditions_AND !== "") {
          conditions_AND += " AND ";
        }
        conditions_AND += "content LIKE CONCAT('%', ?, '%')";
        params_AND.push(word);
      }

      if (conditions_AND !== "" && params_AND.length > 0) {
        const sqlAND = `SELECT id FROM posts WHERE ${conditions_AND}`;
        const [rowsAND] = await pool.execute(sqlAND, params_AND);
        ids_AND = rowsAND.map((r) => r.id);
      }
    }
    //OR検索
    if (keyword_split.length > 0) {
      let conditionsOR = "";
      const paramsOR = [];

      for (let i = 0; i < keyword_split.length; i++) {
        const word = String(keyword_split[i]).trim();
        if (word === "") continue;

        if (conditionsOR !== "") {
          conditionsOR += " OR ";
        }
        conditionsOR += "content LIKE CONCAT('%', ?, '%')";
        paramsOR.push(word);
      }

      if (conditionsOR !== "" && paramsOR.length > 0) {
        const sqlOR = `SELECT id FROM posts WHERE ${conditionsOR}`;
        const [rowsOR] = await pool.execute(sqlOR, paramsOR);
        ids_OR = rowsOR.map((r) => r.id);
      }
    }

    //ジャンル検索
    if (genreId !== null) {
      const aql_genre = "select id from posts where genre_id=?";
      const [rowsGenre] = await pool.execute(aql_genre, [genreId]);
      ids_Genre = rowsGenre.map((r) => r.id);
    }

    const orderedIds = Array.from(
      new Set([...ids_AND, ...ids_OR, ...ids_Genre])
    );

    const ids = orderedIds;

    if (ids.length === 0) {
      return res.json([]);
    }

    let placeholders = "";
    for (let i = 0; i < ids.length; i++) {
      if (i > 0) placeholders += ",";
      placeholders += "?";
    }

    const sqlPosts = `SELECT 
         p.id, 
         p.user_id, 
         p.content, 
         p.ruby_content, 
         p.genre_id, 
         p.created_at, 
         u.username,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS likesCount,
        (SELECT COUNT(*) FROM replies WHERE post_id = p.id) AS repliesCount,
        CASE WHEN l.user_id IS NOT NULL THEN 1 ELSE 0 END AS isLiked,
        CASE WHEN f.follower_id IS NOT NULL THEN 1 ELSE 0 END AS isFollowing
         FROM posts p
         LEFT JOIN users u ON u.id = p.user_id
        LEFT JOIN likes l ON l.post_id = p.id AND l.user_id = ?
        LEFT JOIN follows f ON f.followed_id = p.user_id AND f.follower_id = ?
        WHERE p.id IN (${placeholders})
        -- ✅ 並び順を orderedIds の通りに固定
        ORDER BY FIELD(p.id, ${placeholders})`;

    const params = [currentUserId, currentUserId, ...ids, ...ids];

    const [rowsFull] = await pool.execute(sqlPosts, params);

    // rowsFull は [{id, user_id, content, created_at, username}, ...]
    // フロントの <PostCard :post="{...}"> にそのまま渡せる形
    return res.json(rowsFull);
  } catch (error) {
    console.error("検索エラー：", error);
    return res.status(500).json({ error: "検索中にエラーが発生しました!!" });
  }
});

// --- 「いとをかし」機能API ---
app.get("/api/posts/:postId/likes", async (req, res) => {
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
    console.error("いとをかし一覧取得エラー:", error);
    res.status(500).json({ error: "いとをかし一覧取得に失敗しました" });
  }
});

// 特定ユーザーの「いとをかし」状態取得
app.get(
  "/api/posts/:postId/likes/status",
  authenticateToken,
  async (req, res) => {
    try {
      const { postId } = req.params;
      const userId = req.user.id;

      // 自分が「いとをかし」しているか？
      const [likedRows] = await pool.query(
        `SELECT * FROM likes WHERE post_id = ? AND user_id = ?`,
        [postId, userId]
      );

      // 全体の「いとをかし」数
      const [countRows] = await pool.query(
        `SELECT COUNT(*) AS count FROM likes WHERE post_id = ?`,
        [postId]
      );

      // 誰が「いとをかし」したか一覧
      const [users] = await pool.query(
        `SELECT users.id, users.username 
       FROM likes 
       JOIN users ON likes.user_id = users.id 
       WHERE likes.post_id = ?`,
        [postId]
      );

      res.json({
        isLiked: likedRows.length > 0, // 自分が押しているかどうか
        likeCount: countRows[0].count, // 総数
        likedUsers: users, // 押したユーザー一覧
      });
    } catch (error) {
      console.error("いとをかし状態取得エラー:", error);
      res.status(500).json({ error: "いとをかし状態の取得に失敗しました" });
    }
  }
);

// 「いとをかし」追加
app.post("/api/posts/:postId/like", authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    await pool.query(
      `INSERT IGNORE INTO likes (post_id, user_id) VALUES (?, ?)`,
      [postId, userId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error("いとをかし追加エラー:", error);
    res.status(500).json({ error: "いとをかし追加に失敗しました" });
  }
});

// 「いとをかし」解除
app.delete("/api/posts/:postId/like", authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    await pool.query(`DELETE FROM likes WHERE post_id = ? AND user_id = ?`, [
      postId,
      userId,
    ]);

    res.json({ success: true });
  } catch (error) {
    console.error('いとをかし解除エラー:', error);
    res.status(500).json({ error: 'いとをかし解除に失敗しました' });
  }
});

// --- フォロー機能API ---

// 特定ユーザーのフォロー状態、フォロワー数、フォロワー一覧を取得 
app.get('/api/users/:id/followers/status', async (req, res) => {
  try {
    const targetUserId = req.params.id; // フォローされているユーザー
    const currentUserId = req.query.userId; // ログインユーザー（フォローしているかチェックする側）

    // フォロー状態のチェック
    const [statusRows] = await pool.query(
      `SELECT * FROM follows WHERE follower_id = ? AND followed_id = ?`,
      [currentUserId, targetUserId]
    );
    const isFollowing = statusRows.length > 0;

    // フォロワー数の取得
    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS count FROM follows WHERE followed_id = ?`,
      [targetUserId]
    );
    const count = countRows[0].count;

    // フォロワー一覧の取得
    const [followerUsers] = await pool.query(
      `SELECT users.id, users.username 
       FROM follows 
       JOIN users ON follows.follower_id = users.id 
       WHERE follows.followed_id = ?
       ORDER BY follows.created_at DESC`,
      [targetUserId]
    );

    res.json({
      following: isFollowing,
      count: count,
      users: followerUsers
    });
  } catch (error) {
    console.error('フォロー状態取得エラー:', error);
    res.status(500).json({ error: 'フォロー状態の取得に失敗しました' });
  }
});

// フォロワー一覧取得API
app.get('/api/users/:id/followers', async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const [users] = await pool.query(
      `SELECT users.id, users.username 
       FROM follows 
       JOIN users ON follows.follower_id = users.id 
       WHERE follows.followed_id = ?
       ORDER BY follows.created_at DESC`,
      [targetUserId]
    );

    res.json(users);
  } catch (error) {
    console.error('フォロワー一覧取得エラー:', error);
    res.status(500).json({ error: 'フォロワー一覧の取得に失敗しました' });
  }
});

// フォローする
app.post('/api/users/:id/follow', authenticateToken, async (req, res) => {
  try {
    const followedId = req.params.id; // フォローされる側
    const followerId = req.user.id;   // フォローする側（ログイン中のユーザー）

    if (Number(followedId) === Number(followerId)) {
      return res.status(400).json({ message: '自分自身はフォローできません。' });
    }

    // すでにフォローしているかチェック
    const [rows] = await pool.query(
      `SELECT * FROM follows WHERE follower_id = ? AND followed_id = ?`,
      [followerId, followedId]
    );
    if (rows.length > 0) {
      return res.status(400).json({ message: 'すでにフォローしています。' });
    }

    // 新規フォロー登録
    await pool.query(
      `INSERT INTO follows (follower_id, followed_id) VALUES (?, ?)`,
      [followerId, followedId]
    );

    res.status(200).json({ message: 'フォローしました。' });
  } catch (error) {
    console.error('フォローAPIエラー:', error);
    res.status(500).json({ error: 'フォローに失敗しました。' });
  }
});

// フォロー解除
app.delete('/api/users/:id/follow', authenticateToken, async (req, res) => {
  try {
    const followedId = req.params.id; // フォローを解除される側
    const followerId = req.user.id;   // フォロー解除を実行する側

    const [result] = await pool.query(
      `DELETE FROM follows WHERE follower_id = ? AND followed_id = ?`,
      [followerId, followedId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'フォロー関係が見つかりません。' });
    }

    res.status(200).json({ message: 'フォロー解除しました。' });
  } catch (error) {
    console.error('フォロー解除APIエラー:', error);
    res.status(500).json({ error: 'フォロー解除に失敗しました。' });
  }
});

//ダイレクトふみを送信できるフォロー中取得
// --- フォローしているユーザーの投稿だけを取得するタイムライン ---
app.post('/api/users/following', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const sql = `
      SELECT 
          u.id,
          u.username,
          latest.id AS dm_id,
          latest.sender_id,
          latest.receiver_id,
          latest.content,
          latest.created_at AS latest_dm,
          latest.reply_77,
          latest.is_read
      FROM users u
      JOIN follows f ON u.id = f.followed_id

      LEFT JOIN (
          SELECT 
              d1.*
          FROM directmessages d1
          JOIN (
              SELECT 
                  LEAST(sender_id, receiver_id) AS a,
                  GREATEST(sender_id, receiver_id) AS b,
                  MAX(created_at) AS max_created
              FROM directmessages
              GROUP BY a, b
          ) latest2
          ON (
              LEAST(d1.sender_id, d1.receiver_id) = latest2.a AND
              GREATEST(d1.sender_id, d1.receiver_id) = latest2.b AND
              d1.created_at = latest2.max_created
          )
      ) latest
      ON (
          (latest.sender_id = u.id AND latest.receiver_id = ?) OR
          (latest.receiver_id = u.id AND latest.sender_id = ?)
      )

      WHERE f.follower_id = ?
      ORDER BY latest_dm IS NULL ASC, latest_dm DESC;
    `;

    const [partners] = await pool.query(sql, [userId, userId, userId]);
    res.status(212).json(partners);
  } catch (error) {
    console.error('フォロー中ふみ取得エラー:', error);
    res.status(500).json({ error: 'フォロー中ふみ取得に失敗しました。' });
  }
});

// 未フォローで受け取ったふみを取得（LINEの「友達かも」風）
app.post('/api/users/notfollow', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const sql = `
      SELECT 
          u.id,
          u.username,
          latest.id AS dm_id,
          latest.sender_id,
          latest.receiver_id,
          latest.content,
          latest.created_at AS latest_dm,
          latest.reply_77,
          latest.is_read
      FROM users u

      -- 自分はフォローしていない相手
      LEFT JOIN follows f 
          ON u.id = f.followed_id AND f.follower_id = ?

      -- 最新DMサブクエリ
      LEFT JOIN (
          SELECT 
              d1.*
          FROM directmessages d1
          JOIN (
              SELECT 
                  LEAST(sender_id, receiver_id) AS a,
                  GREATEST(sender_id, receiver_id) AS b,
                  MAX(created_at) AS max_created
              FROM directmessages
              GROUP BY a, b
          ) latest2
          ON (
              LEAST(d1.sender_id, d1.receiver_id) = latest2.a AND
              GREATEST(d1.sender_id, d1.receiver_id) = latest2.b AND
              d1.created_at = latest2.max_created
          )
      ) latest
      ON (
        (latest.sender_id = u.id AND latest.receiver_id = ?)
          OR
        (latest.receiver_id = u.id AND latest.sender_id = ?)
      )

      -- フォロー中ではない AND 自分宛にDMがある
      WHERE f.followed_id IS NULL 
        AND latest.id IS NOT NULL

      ORDER BY latest_dm DESC;
    `;

    const [partners] = await pool.query(sql, [userId, userId, userId]);
    res.status(214).json(partners);
  } catch (error) {
    console.error('非フォローふみ取得エラー:', error);
    res.status(500).json({ error: '非フォローふみ取得に失敗しました。' });
  }
});

// ダイレクトふみ取得
app.post('/api/users/:id/dfumi/messages', authenticateToken, async (req, res) => {
    try {
        const partnerId = req.params.id; // 相手側
        const userId = req.user.id;   // 自分側（ログイン中のユーザー

        const sql = `
          SELECT
            dm.id,
            (dm.sender_id = ?) AS senderFlag,
            dm.content,
            dm.created_at,
            dm.reply_77,
            dm.is_read     
          FROM directmessages dm       
          WHERE 
            (dm.sender_id = ? AND dm.receiver_id = ?)
            OR (dm.sender_id = ? AND dm.receiver_id = ?)
          ORDER BY dm.created_at ASC
        `;
        
        const [messages] = await pool.execute(sql, [userId, userId, partnerId, partnerId, userId]);
        res.status(210).json(messages);
    } catch (error) {
        console.error('ダイレクトふみ取得エラー:', error);
        res.status(500).json({ error: 'ダイレクトふみ取得エラー' });
    }
});

// ダイレクトふみ送信 (要認証)
app.post('/api/users/:id/dfumi/sending', authenticateToken, async (req, res) => {
  try {
    let { content1, content2, content3, reply77Flag } = req.body;
    console.log(req.body);
    const userId = req.user.id; // ミドルウェアがセットしたユーザーIDを使用
    const partnerId = req.params.id;

    if (!reply77Flag) { // 七七を送る → content1, content2 が必要
      if (!content1 || !content2) {
        return res.status(400).json({ error: 'すべての句を入力してください。' });
      }
    } else { // 五七五を送る → content1, content2, content3 が必要
      if (!content1 || !content2 || !content3) {
        return res.status(400).json({ error: 'すべての句を入力してください。' });
      }
    }

    // 使用不可の文字があればエラーを出す
    const regex = /^[\u3040-\u309F\u30A0-\u30FF\uFF65-\uFF9F\u4E00-\u9FFF。｡、､「｢」｣・･！!？?]+$/;
    if (!regex.test(content1) || !regex.test(content2) || (reply77Flag && !regex.test(content3))) {
      return res.status(400).json({ error: '入力できない文字が含まれています。' });
    }

    const ruby_dataset = [
      [{ word: content1, ruby: null }],
      [{ word: content2, ruby: null }],
      [{ word: content3, ruby: null }]
    ];

    let num = 0;
    const { flag: can_kaminoku, symbolCount: symbolCount1, word_id: word_id1, words: word1 } = (reply77Flag) ? await check575(ruby_dataset[0], 5) : await check575(ruby_dataset[0], 7);
    const { flag: can_nakanoku, symbolCount: symbolCount2, word_id: word_id2, words: word2 } = await check575(ruby_dataset[1], 7);
    const { flag: can_shimonoku, symbolCount: symbolCount3, word_id: word_id3, words: word3 } = (reply77Flag) ? await check575(ruby_dataset[2], 5) : { flag: true, symbolCount: 0, word_id: null, words: null };

    if (!can_kaminoku) num += 1;
    if (!can_nakanoku) num += 2;
    if (!can_shimonoku) num += 4;

    if (num !== 0) return res.status(400).json({ errorCode: num, message: '句の音の数が正しくありません。'+symbolCount1+ symbolCount2 + symbolCount3 });

    const symbolCount = symbolCount1 + symbolCount2 + symbolCount3
    if (symbolCount > 4) return res.status(400).json({ error: '記号などが多すぎます。' });

    // --- 投稿をDBに保存して投稿IDを取得 ---
    content1 = HKtoZK(content1); content2 = HKtoZK(content2); content3 = HKtoZK(content3);
    const content = `${content1} ${content2} ${content3}`;
    console.log(content);
    const [dmResult] = await pool.execute(
      "INSERT INTO directmessages (sender_id, receiver_id, content, reply_77) VALUES (?, ?, ?, ?)",
      [userId, partnerId, content, reply77Flag]
    );

    res.status(201).json({ message: 'ふみを送信しました' });

  } catch (error) {
      console.error("投稿エラー詳細:", error);
      res.status(500).json({ error: '投稿エラー', detail: error.message });
  }
});

app.post('/api/users/:id/dfumi/isread', authenticateToken, async (req, res) => {
    try {
        const partnerId = req.params.id; // 相手側
        const userId = req.user.id;   // 自分側（ログイン中のユーザー

        const sql = `
          UPDATE
            directmessages
          SET
            is_read = true
          WHERE
            sender_id = ? AND receiver_id = ?;
        `;

        await pool.execute(sql, [partnerId, userId]);
        res.status(216).json({message: "既読情報更新"});
    } catch (error) {
        console.error('既読情報取得エラー:', error);
        res.status(500).json({ error: '既読情報取得エラー' });
    }
});

// --- 6. サーバー起動 ---

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`サーバーがポート${PORT}で起動しました。`));

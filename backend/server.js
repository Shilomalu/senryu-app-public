// --- 1. ライブラリのインポート ---
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { createClient } = require("@supabase/supabase-js"); // Supabase接続用

// ★AIモデルは Vercel で動くように JS移植版 を使用します
const { predictGenreJS } = require('./predict_genre');

const { check575, checkPart } = require("./senryu-checker.js");
const { make_ruby } = require('./ruby.js');

// Vercelでは常駐プロセスが動かないため、schedulerは読み込みますが、
// 実際の処理はAPIアクセス時に「ついでに」行う形(Lazy実行)に切り替えます。
// scheduler.js も Supabase 対応版に書き換えておいてください。
const { ensureSchedule } = require('./scheduler'); 
const { HKtoZK } = require('./helper_fun.js');

// --- 2. 基本設定 ---
const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "your-very-secret-key"; 

// --- 3. データベース接続 (Supabase) ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("【エラー】: .envファイルに SUPABASE_URL と SUPABASE_KEY を設定してください！");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// startScheduler(pool); の代わりに、サーバー起動時に一度チェックを行う
// (Vercelでは起動時処理はリクエスト毎になる可能性がありますが、安全のため残します)
ensureSchedule().catch(err => console.error("Scheduler init error:", err));


// --- ヘルパー関数: SupabaseのレスポンスをMySQLの出力形式(フラット)に合わせる ---
// フロントエンドは `authorName` や `likesCount` が直接入っていることを期待しているため
function formatPost(post, currentUserId = null) {
    if (!post) return null;
    const formatted = {
        id: post.id,
        content: post.content,
        ruby_content: post.ruby_content,
        created_at: post.created_at,
        user_id: post.user_id,
        genre_id: post.genre_id,
        // usersテーブルとの結合結果をフラットにする
        authorName: post.users ? post.users.username : "不明",
        // 配列の長さをカウントとして返す
        likesCount: post.likes ? post.likes.length : 0, 
        repliesCount: post.replies ? post.replies.length : 0,
        isLiked: 0,
        isFollowing: 0
    };

    // ログインユーザーのいいね状態
    if (currentUserId && post.likes && Array.isArray(post.likes)) {
        if (post.likes.some(l => l.user_id === currentUserId)) {
            formatted.isLiked = 1;
        }
    }
    return formatted;
}


// --- 4. 認証ミドルウェア ---

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


// 機械学習による推論関係
// Vercel対応のため、Python(execSync)ではなくJS版モデルを使用します
function predict_genre_function(text){
    try {
        const genreId = predictGenreJS(text);
        console.log(`AI判定: "${text}" -> GenreID: ${genreId}`);
        return genreId;
    } catch (e) {
        console.error("AI判定エラー:", e);
        return 8; // エラー時はその他
    }
}


// --- 5. APIエンドポイント ---

app.post("/api/genre/predict", async(req,res)=>{
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
    
    // Supabase Insert
    const { data, error } = await supabase
        .from('users')
        .insert([{ username, email, password_hash: hashedPassword }])
        .select(); // IDを取得するためにselectが必要

    if (error) throw error;
    res.status(201).json({ message: "登録成功", userId: data[0].id });
  } catch (error) {
    console.error("★★★ エラー発生！ ★★★:", error);
    res.status(500).json({ error: "登録エラー" });
  }
});

// ログイン
app.post("/api/users/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email);

    if (error || !users || users.length === 0) return res.status(401).json({ error: "認証失敗" });

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
    const { data, error } = await supabase
        .from('users')
        .select('id, username, email, profile_text, favorite_id, icon_index')
        .eq('id', id)
        .single();

    console.log("DB結果:", data);
    if (error || !data)
      return res.status(404).json({ message: "User not found" });
    res.json(data);
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
    const updates = {};
    if (username !== undefined) updates.username = username;
    if (profile_text !== undefined) updates.profile_text = profile_text;
    if (favorite_id !== undefined) updates.favorite_id = favorite_id;

    if (Object.keys(updates).length === 0)
      return res.status(400).json({ message: "No data to update" });

    const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select('id, username, email, profile_text, favorite_id');

    if (error || !data || data.length === 0)
      return res.status(404).json({ message: "User not found" });

    res.json({ message: "Profile updated successfully", user: data[0] });
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
    const { error } = await supabase
        .from('users')
        .update({ icon_index: icon })
        .eq('id', userId);
    
    if (error) throw error;
    res.json({ message: "アイコンを更新しました", icon });
  } catch (error) {
    console.error("Error updating icon:", error);
    res.status(500).json({ error: "アイコン更新中にエラーが発生しました" });
  }
});

// 特定ユーザーの投稿一覧取得
app.get("/api/posts/user/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    let currentUserId = null;
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        currentUserId = decoded.id;
      } catch (err) {
        console.warn("Invalid token:", err);
      }
    }
    const { data, error } = await supabase
        .from('posts')
        .select(`
            *,
            users (username),
            likes (user_id),
            replies (id)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data.map(p => formatPost(p, currentUserId)));
  } catch (err) {
    console.error("特定ユーザー投稿取得エラー:", err);
    res.status(500).json({ message: "投稿の取得に失敗しました" });
  }
});

// 川柳投稿 (ジャンル対応・要認証)
app.post("/api/posts", authenticateToken, async (req, res) => {
  try {
    let { content1, content2, content3, ruby_dataset, genre_id, weekly_theme_id } = req.body;
    const userId = req.user.id; 

    const contents = [];
    for (const ruby_data of ruby_dataset) {
      contents.push(ruby_data.map(rd => rd.word).join(""));
    }

    if (!contents[0] || !contents[1] || !contents[2]) {
      return res.status(400).json({ error: "すべての句を入力してください。" });
    }

    if (!genre_id) {
      const target_senryu = `${content1} ${content2} ${content3}`;
      try {
        const predict_genre_id = predict_genre_function(target_senryu);
        genre_id = predict_genre_id
        console.log("予測したジャンル：", genre_id);
      } catch(e) {
        console.error("ジャンルの自動推論に失敗しました", e);
        genre_id = 8;
      }
    }

    const content = `${content1} ${content2} ${content3}`;

    // ★機能維持: 575チェックロジックを完全に再現
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

    // --- 投稿をDBに保存して投稿IDを取得 (Supabase) ---
    const { data, error } = await supabase
        .from('posts')
        .insert([{ 
            user_id: userId, 
            content: content, 
            ruby_content: ruby_dataset, 
            genre_id: genre_id, 
            weekly_theme_id: weekly_theme_id || null 
        }])
        .select();

    if (error) throw error;
    const sennryuu_id = data[0].id;
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

    // Supabaseで一括取得
    const { data, error } = await supabase
        .from('posts')
        .select(`
            *,
            users (username),
            likes (user_id),
            replies (id),
            follows:users!posts_user_id_fkey (id) 
        `) // followsの判定は少し複雑ですが、簡易的にlikesと同様のロジックでJS側で判定するか、
           // formatPostで「自分がフォローしているか」を判定するには別クエリが必要かもしれません。
           // ここでは元のSQLに合わせて「ユーザーごとのフォロー情報」を取得するのは難しいため、
           // 「自分が相手をフォローしているか」は formatPost ではなく、別途フォローリストを取得して突合するのがSupabase流です。
           // ただし、「機能を変えない」ため、ここでは最低限 formatPost で処理できる範囲を返します。
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) throw error;

    // フォロー情報の補完（自分がフォローしているユーザーIDリストを取得）
    let followedIds = [];
    if (userId) {
        const { data: follows } = await supabase
            .from('follows')
            .select('followed_id')
            .eq('follower_id', userId);
        if (follows) followedIds = follows.map(f => f.followed_id);
    }

    const formattedPosts = data.map(post => {
        const fmt = formatPost(post, userId);
        if (userId && followedIds.includes(post.user_id)) {
            fmt.isFollowing = 1;
        }
        return fmt;
    });

    res.json(formattedPosts);
  } catch (error) {
    console.error("タイムライン取得エラー:", error);
    res.status(500).json({ error: "タイムライン取得エラー" });
  }
});

// --- ここから追加：お題・ランキング機能API ---

// 1. 現在開催中のお題を取得
app.get('/api/themes/current', async (req, res) => {
  try {
    // ★スケジュール自動補充チェック (Lazy実行)
    ensureSchedule().catch(err => console.error(err));

    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
        .from('weekly_themes')
        .select(`
            id, start_date, end_date,
            topic_master (theme_name)
        `)
        .lte('start_date', today)
        .gte('end_date', today)
        .limit(1);

    if (error) throw error;
    if (!data || data.length === 0) return res.json(null);

    const theme = data[0];
    res.json({
        weekly_theme_id: theme.id,
        theme_name: theme.topic_master.theme_name,
        start_date: theme.start_date,
        end_date: theme.end_date
    });
  } catch (err) {
    console.error('お題取得エラー:', err);
    res.status(500).json({ error: 'お題情報の取得に失敗しました' });
  }
});

app.get('/api/themes/current/posts', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let currentUserId = 0;

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        currentUserId = decoded.id;
      } catch (e) {
        console.warn('Token verify failed:', e.message);
      }
    }

    const today = new Date().toISOString().split('T')[0];
    const { data: themes } = await supabase
        .from('weekly_themes').select('id').lte('start_date', today).gte('end_date', today).limit(1);

    if (!themes || themes.length === 0) return res.json([]);
    const currentThemeId = themes[0].id;

    const { data, error } = await supabase
        .from('posts')
        .select(`*, users(username), likes(user_id), replies(id)`)
        .eq('weekly_theme_id', currentThemeId)
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) throw error;
    res.json(data.map(p => formatPost(p, currentUserId)));

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

    const { data: latestRows } = await supabase
        .from('ranking_results')
        .select('weekly_theme_id')
        .order('id', { ascending: false })
        .limit(1);

    if (!latestRows || latestRows.length === 0) return res.json([]);
    const targetThemeId = latestRows[0].weekly_theme_id;

    const { data, error } = await supabase
        .from('ranking_results')
        .select(`
            rank, fixed_likes_count,
            posts (
                id, content, ruby_content, user_id, genre_id, created_at,
                users (username),
                replies (id),
                likes (user_id)
            )
        `)
        .eq('weekly_theme_id', targetThemeId)
        .order('rank', { ascending: true });

    if (error) throw error;

    const rankingPosts = data.map(r => {
        if (!r.posts) return null;

        return {
            rank: r.rank,
            id: r.posts.id,
            content: r.posts.content,
            ruby_content: r.posts.ruby_content,
            user_id: r.posts.user_id,
            genre_id: r.posts.genre_id,
            created_at: r.posts.created_at,
            authorName: r.posts.users ? r.posts.users.username : "不明",
            likesCount: realTimeLikesCount,
            likedUserIds: r.posts.likes ? r.posts.likes.map(l => l.user_id) : [],
            isLiked: r.posts.likes && r.posts.likes.some(l => l.user_id === currentUserId) ? 1 : 0,
            repliesCount: r.posts.replies ? r.posts.replies.length : 0
        };
    }).filter(p => p !== null);
    
    res.json(rankingPosts);
  } catch (err) {
    console.error('ランキング取得エラー:', err);
    res.status(500).json({ error: 'ランキングの取得に失敗しました' });
  }
});

// 3. ランキング集計・確定API (Supabase版)
// ★重要: Vercel Cron用に 'post' ではなく 'get' にします
app.get('/api/batch/calculate-ranking', async (req, res) => {
  
  // セキュリティチェック (Vercel Cronからのアクセスか確認)
  const authHeader = req.headers['authorization'];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    
    // 集計済みのIDを取得
    const { data: existings } = await supabase.from('ranking_results').select('weekly_theme_id');
    const existingIds = existings.map(e => e.weekly_theme_id);

    // 集計対象のお題を検索
    let query = supabase
        .from('weekly_themes')
        .select('id')
        .lt('end_date', today) // 終了日が今日より前
        .order('end_date', { ascending: false })
        .limit(1);
    
    // ★修正: 配列をそのまま渡すのが正しい書き方です
    if (existingIds.length > 0) {
        query = query.not('id', 'in', existingIds);
    }

    const { data: targetRows } = await query;

    if (!targetRows || targetRows.length === 0) {
      return res.json({ message: '集計対象が見つかりませんでした（すべて集計済みか、終了したお題がありません）' });
    }

    const targetThemeId = targetRows[0].id;

    // 該当テーマの投稿をいいね順に取得 (TOP10)
    const { data: posts } = await supabase
        .from('posts')
        .select('id, likes_num') 
        .eq('weekly_theme_id', targetThemeId)
        .order('likes_num', { ascending: false })
        .limit(10);

    // 保存処理
    if (posts && posts.length > 0) {
        const results = posts.map((p, index) => ({
            weekly_theme_id: targetThemeId,
            post_id: p.id,
            rank: index + 1,
            fixed_likes_count: p.likes_num || 0
        }));
        
        const { error } = await supabase.from('ranking_results').insert(results);
        if (error) throw error;
    }

    res.json({ message: `お題ID:${targetThemeId} のランキングを確定しました！` });

  } catch (err) {
    console.error('集計エラー:', err);
    res.status(500).json({ error: '集計処理に失敗しました' });
  }
});

app.get("/api/posts/likes", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    // user_id で likes テーブルを検索し、post情報をjoin
    const { data, error } = await supabase
        .from('likes')
        .select(`
            posts (
                *,
                users (username),
                likes (user_id),
                replies (id)
            )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false }) // likesの作成日順
        .limit(50);

    if (error) throw error;
    
    // 構造が { posts: {...} } となっているのでフラットにする
    const rows = data.map(row => {
        const p = formatPost(row.posts, userId);
        p.isLiked = 1; // ここにあるということはいいねしている
        return p;
    });

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
    // フォローIDリスト取得
    const { data: follows } = await supabase.from('follows').select('followed_id').eq('follower_id', userId);
    const followedIds = follows.map(f => f.followed_id);

    if (followedIds.length === 0) return res.json([]);

    const { data, error } = await supabase
        .from('posts')
        .select(`*, users(username), likes(user_id), replies(id)`)
        .in('user_id', followedIds)
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) throw error;
    res.json(data.map(p => {
        const fmt = formatPost(p, userId);
        fmt.isFollowing = 1; // フォロー中TLなので
        return fmt;
    }));
  } catch (error) {
    console.error('フォロー中タイムライン取得エラー:', error);
    res.status(500).json({ error: 'フォロー中タイムライン取得に失敗しました。' });
  }
});

app.delete("/api/posts/:id", authenticateToken, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    // 削除権限チェック
    const { data: post } = await supabase.from('posts').select('user_id').eq('id', postId).single();
    if (!post) return res.status(404).json({ error: "投稿が見つかりません。" });
    
    if (post.user_id !== userId) {
      return res.status(403).json({ error: "この投稿を削除する権限がありません。" });
    }

    await supabase.from('posts').delete().eq('id', postId);

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
    
    const { data: post, error: postError } = await supabase
        .from('posts')
        .select('*, users(username)')
        .eq('id', postId)
        .single();

    if (postError || !post) return res.status(404).json({ error: "投稿が見つかりません。" });

    const { data: replies } = await supabase
        .from('replies')
        .select('*, users(username)')
        .eq('post_id', postId)
        .order('created_at', { ascending: false });

    // 整形
    const formattedPost = { ...post, authorName: post.users.username };
    const formattedReplies = replies.map(r => ({
        id: r.id, content: r.content, created_at: r.created_at, user_id: r.user_id,
        authorName: r.users.username
    }));

    res.json({ post: formattedPost, replies: formattedReplies });
  } catch (err) {
    console.error("投稿詳細取得エラー:", err);
    res.status(500).json({ error: "投稿詳細の取得に失敗しました" });
  }
});

// リプライ投稿 (要認証)
app.post("/api/posts/:id/reply", authenticateToken, async (req, res) => {
  try {
    let { content1, content2, content3 } = req.body;
    const userId = req.user.id;
    const postId = req.params.id;
    if (!content1 || !content2 || !content3) {
      return res.status(400).json({ error: "すべての句を入力してください。" });
    }

    const regex = /^[\u3040-\u309F\u30A0-\u30FF\uFF65-\uFF9F\u4E00-\u9FFF。｡、､「｢」｣・･！!？?]+$/;
    if (!regex.test(content1) || !regex.test(content2) || !regex.test(content3)) {
      return res.status(400).json({ error: "入力できない文字が含まれています。" });
    }

    const ruby1 = await make_ruby(content1);
    const ruby2 = await make_ruby(content2);
    const ruby3 = await make_ruby(content3);

    // ★機能維持: 575チェックロジック再現
    let num = 0;
    const { flag: can_kaminoku, symbolCount: symbolCount1 } = await check575(ruby1.ruby_data, 5);
    const { flag: can_nakanoku, symbolCount: symbolCount2 } = await check575(ruby2.ruby_data, 7);
    const { flag: can_shimonoku, symbolCount: symbolCount3 } = await check575(ruby3.ruby_data, 5);

    if (!can_kaminoku) num += 1;
    if (!can_nakanoku) num += 2;
    if (!can_shimonoku) num += 4;

    if (num !== 0)
      return res.status(400).json({ errorCode: num, message: "句の音の数が正しくありません。" });

    const symbolCount = symbolCount1 + symbolCount2 + symbolCount3;
    if (symbolCount > 4)
      return res.status(400).json({ errorCode: -1, message: "記号などが多すぎます。" });

    content1 = HKtoZK(content1);
    content2 = HKtoZK(content2);
    content3 = HKtoZK(content3);
    const content = `${content1} ${content2} ${content3}`;

    if (!content) return res.status(400).json({ error: "リプライの内容が必要です" });

    const { error } = await supabase
        .from('replies')
        .insert([{ user_id: userId, post_id: postId, content }]);
    
    if (error) throw error;
    const { data: postData } = await supabase.from('posts').select('user_id').eq('id', postId).single();
    
    if (postData) {
      const postOwnerId = postData.user_id;
      // 自分の投稿へのリプライでなければ通知
      if (postOwnerId !== userId) {
        // 2. 送信者の名前を取得
        const { data: senderData } = await supabase.from('users').select('username').eq('id', userId).single();
        const senderName = senderData ? senderData.username : `ユーザー${userId}`;

        // 3. 通知を追加
        await supabase.from('notifications').insert([{
          user_id: postOwnerId, // 通知を受け取る人
          type: 'reply',
          from_user_id: userId, // 送った人
          message: `${senderName}さんがあなたの投稿に返句しました`
        }]);
      }
    }
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

    const { data: reply } = await supabase.from('replies').select('user_id').eq('id', replyId).single();

    if (!reply) return res.status(404).json({ error: "リプライが見つかりません" });
    if (reply.user_id !== userId) return res.status(403).json({ error: "削除権限がありません" });

    await supabase.from('replies').delete().eq('id', replyId);
    res.status(200).json({ message: "リプライを削除しました" });
  } catch (err) {
    console.error("リプライ削除エラー:", err);
    res.status(500).json({ error: "リプライの削除に失敗しました" });
  }
});

// --- 他のユーザーのプロフィール取得 ---
app.get("/api/users/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
        .from('users')
        .select('id, username, email, profile_text')
        .eq('id', req.params.id)
        .single();

    if (error || !data) return res.status(404).json({ error: "ユーザーが見つかりません" });
    res.json(data);
  } catch (error) {
    console.error("プロフィール取得エラー:", error);
    res.status(500).json({ error: "プロフィール取得に失敗しました" });
  }
});

// 特定ユーザーの投稿一覧取得
// (重複していますが元のコードにあるため残します。中身は上の /api/posts/user/:userId と同じ)
app.get("/api/posts/user/:id", async (req, res) => {
    // 上記エンドポイントで実装済みなので、そちらにリダイレクトまたは同じロジック
    // ここではロジック再掲します
    try {
        const userId = req.params.id;
        const { data, error } = await supabase
            .from('posts')
            .select(`*, users (username), likes (user_id), replies (id)`)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50);
        if (error) throw error;
        res.json(data.map(p => formatPost(p)));
    } catch (error) {
        res.status(500).json({ error: "投稿の取得に失敗しました" });
    }
});


// ここから検索処理 (ロジックを再現)
app.get("/api/search", async (req, res) => {
  try {
    const keyword = req.query.input_words;
    const genre = req.query.genre;
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    let currentUserId = null;
    if (token) { try { currentUserId = jwt.verify(token, JWT_SECRET).id; } catch (err) {} }

    if (!keyword && !genre) {
      return res.status(400).json({ error: "検索ワードを入力してください" });
    }

    let keyword_split = [];
    if (typeof keyword === "string" && keyword.trim() != "") {
      keyword_split = keyword.trim().split(/[\s　]+/);
    }
    const genreId = (genre !== undefined && genre !== null) ? Number(genre) : null;

    // SupabaseでIDを取得していく (元のロジックを模倣)
    let ids_AND = [];
    let ids_OR = [];
    let ids_Genre = [];

    // 1. AND検索 (キーワードすべてを含む)
    if (keyword_split.length > 0) {
        // Supabaseでは .ilike('content', '%A%').ilike('content', '%B%') でANDになる
        let query = supabase.from('posts').select('id');
        keyword_split.forEach(w => { if(w) query = query.ilike('content', `%${w}%`); });
        const { data } = await query;
        if (data) ids_AND = data.map(r => r.id);
    }

    // 2. OR検索 (キーワードのどれかを含む)
    if (keyword_split.length > 0) {
        // .or('content.ilike.%A%,content.ilike.%B%')
        const conditions = keyword_split.filter(w=>w).map(w => `content.ilike.%${w}%`).join(',');
        if (conditions) {
            const { data } = await supabase.from('posts').select('id').or(conditions);
            if (data) ids_OR = data.map(r => r.id);
        }
    }

    // 3. ジャンル検索
    if (genreId !== null) {
        const { data } = await supabase.from('posts').select('id').eq('genre_id', genreId);
        if (data) ids_Genre = data.map(r => r.id);
    }

    // IDのマージ (AND -> OR -> Genre の順で優先度付きリストにする元のロジック)
    const orderedIds = Array.from(new Set([...ids_AND, ...ids_OR, ...ids_Genre]));

    if (orderedIds.length === 0) return res.json([]);

    // IDリストから詳細取得
    // SupabaseにはMySQLの ORDER BY FIELD がないので、取得後にJSで並び替える
    const { data: posts, error } = await supabase
        .from('posts')
        .select(`*, users(username), likes(user_id), replies(id)`)
        .in('id', orderedIds);

    if (error) throw error;

    // JSで並び替え
    const postsMap = new Map(posts.map(p => [p.id, p]));
    const sortedPosts = orderedIds
        .map(id => postsMap.get(id))
        .filter(p => p !== undefined); // 万が一消えていた場合

    return res.json(sortedPosts.map(p => formatPost(p, currentUserId)));

  } catch (error) {
    console.error("検索エラー：", error);
    return res.status(500).json({ error: "検索中にエラーが発生しました!!" });
  }
});


// --- 「いとをかし」機能API ---
app.get("/api/posts/:postId/likes", async (req, res) => {
  try {
    const { postId } = req.params;
    const { data, error } = await supabase
        .from('likes')
        .select('users (id, username)')
        .eq('post_id', postId);

    if(error) throw error;
    // 整形: usersオブジェクトをフラットに
    res.json(data.map(l => ({ id: l.users.id, username: l.users.username })));
  } catch (error) {
    console.error("いとをかし一覧取得エラー:", error);
    res.status(500).json({ error: "いとをかし一覧取得に失敗しました" });
  }
});

app.get("/api/posts/:postId/likes/status", authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    // 自分が押しているか
    const { data: myLike } = await supabase.from('likes').select('id').match({ post_id: postId, user_id: userId });
    
    // 総数
    const { count } = await supabase.from('likes').select('id', { count: 'exact', head: true }).eq('post_id', postId);
    
    // ユーザー一覧
    const { data: usersData } = await supabase.from('likes').select('users (id, username)').eq('post_id', postId);
    const users = usersData ? usersData.map(u => u.users) : [];

    res.json({
      isLiked: myLike && myLike.length > 0,
      likeCount: count || 0,
      likedUsers: users,
    });
  } catch (error) {
    console.error("いとをかし状態取得エラー:", error);
    res.status(500).json({ error: "いとをかし状態の取得に失敗しました" });
  }
});

app.post("/api/posts/:postId/like", authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;
    const { error } = await supabase.from('likes').insert([{ post_id: postId, user_id: userId }]);
    // 既にいいね済み(unique violation)の場合はエラー無視して成功とする
    if(error && error.code !== '23505') throw error;
    const { data: postRows } = await supabase.from('posts').select('user_id').eq('id', postId).single();
    
    if (postRows) {
      const postOwnerId = postRows.user_id;
      // 自分の投稿には通知しない
      if (postOwnerId !== userId) {
        // いいねしたユーザー名を取得
        const { data: userRows } = await supabase.from('users').select('username').eq('id', userId).single();
        const username = userRows ? userRows.username : `ユーザー${userId}`;

        // 通知送信 (重複通知を防ぐために insert エラーは無視するか、ロジックで制御してもよいですが、ここではシンプルにinsert)
        await supabase.from('notifications').insert([{
           user_id: postOwnerId,
           type: 'like',
           from_user_id: userId,
           message: `${username}さんがあなたの投稿にいとをかし🌸しました`
        }]);
      }
    }
    res.json({ success: true });
  } catch (error) {
    console.error("いとをかし追加エラー:", error);
    res.status(500).json({ error: "いとをかし追加に失敗しました" });
  }
});

app.delete("/api/posts/:postId/like", authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;
    await supabase.from('likes').delete().match({ post_id: postId, user_id: userId });
    res.json({ success: true });
  } catch (error) {
    console.error('いとをかし解除エラー:', error);
    res.status(500).json({ error: 'いとをかし解除に失敗しました' });
  }
});


// --- フォロー機能API ---

app.get('/api/users/:id/followers/status', async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.query.userId;

    // フォロー状態
    const { data: isFollowing } = await supabase.from('follows')
        .select('*').match({ follower_id: currentUserId, followed_id: targetUserId });

    // フォロワー数
    const { count } = await supabase.from('follows')
        .select('*', { count: 'exact', head: true }).eq('followed_id', targetUserId);

    // フォロワー一覧
    const { data: followers } = await supabase.from('follows')
        .select('users (id, username)').eq('followed_id', targetUserId).order('created_at', { ascending: false });

    res.json({
      following: isFollowing && isFollowing.length > 0,
      count: count || 0,
      users: followers ? followers.map(f => f.users) : []
    });
  } catch (error) {
    console.error('フォロー状態取得エラー:', error);
    res.status(500).json({ error: 'フォロー状態の取得に失敗しました' });
  }
});

app.get('/api/users/:id/followers', async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const { data } = await supabase.from('follows')
        .select('users (id, username)').eq('followed_id', targetUserId).order('created_at', { ascending: false });
    res.json(data ? data.map(f => f.users) : []);
  } catch (error) {
    res.status(500).json({ error: 'フォロワー一覧の取得に失敗しました' });
  }
});

app.post('/api/users/:id/follow', authenticateToken, async (req, res) => {
  try {
    const followedId = req.params.id;
    const followerId = req.user.id;
    if (Number(followedId) === Number(followerId)) return res.status(400).json({ message: '自分自身はフォローできません。' });

    const { error } = await supabase.from('follows').insert([{ follower_id: followerId, followed_id: followedId }]);
    if (error && error.code === '23505') return res.status(400).json({ message: 'すでにフォローしています。' });
    const { data: followerUser } = await supabase.from('users').select('username').eq('id', followerId).single();
    const username = followerUser ? followerUser.username : `ユーザー${followerId}`;

    // 通知追加
    await supabase.from('notifications').insert([{
      user_id: followedId, // フォローされた人
      type: 'follow',
      from_user_id: followerId, // フォローした人
      message: `${username}さんがあなたをフォローしました`
    }]);

    res.status(200).json({ message: 'フォローしました。' });
  } catch (error) {
    res.status(500).json({ error: 'フォローに失敗しました。' });
  }
});

app.delete('/api/users/:id/follow', authenticateToken, async (req, res) => {
  try {
    const followedId = req.params.id;
    const followerId = req.user.id;
    const { error } = await supabase.from('follows').delete().match({ follower_id: followerId, followed_id: followedId });
    if(error) throw error;
    res.status(200).json({ message: 'フォロー解除しました。' });
  } catch (error) {
    res.status(500).json({ error: 'フォロー解除に失敗しました。' });
  }
});


// ダイレクトふみを送信できるフォロー中取得
app.post('/api/users/following', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // フォロー中ユーザー取得
    const { data: follows } = await supabase
        .from('follows')
        .select('users:followed_id (id, username)') // usersをjoin
        .eq('follower_id', userId);

    if(!follows) return res.status(212).json([]);

    // 各ユーザーとの最新DMを取得して結合するロジック
    // Supabaseだと複雑なJoin+Groupが難しいので、ユーザーリストを取った後に最新DMを取得する方式にします
    const partners = await Promise.all(follows.map(async (f) => {
        const u = f.users;
        // 最新DM
        const { data: msgs } = await supabase
            .from('directmessages')
            .select('*')
            .or(`and(sender_id.eq.${userId},receiver_id.eq.${u.id}),and(sender_id.eq.${u.id},receiver_id.eq.${userId})`)
            .order('created_at', { ascending: false })
            .limit(1);
        
        const latest = (msgs && msgs.length > 0) ? msgs[0] : null;

        return {
            id: u.id,
            username: u.username,
            dm_id: latest ? latest.id : null,
            sender_id: latest ? latest.sender_id : null,
            receiver_id: latest ? latest.receiver_id : null,
            content: latest ? latest.content : null,
            latest_dm: latest ? latest.created_at : null,
            reply_77: latest ? latest.reply_77 : null,
            is_read: latest ? latest.is_read : null
        };
    }));

    // ソート: 最新DMがある順 -> 日付順
    partners.sort((a, b) => {
        if (!a.latest_dm && !b.latest_dm) return 0;
        if (!a.latest_dm) return 1;
        if (!b.latest_dm) return -1;
        return new Date(b.latest_dm) - new Date(a.latest_dm);
    });

    res.status(212).json(partners);
  } catch (error) {
    console.error('フォロー中ふみ取得エラー:', error);
    res.status(500).json({ error: 'フォロー中ふみ取得に失敗しました。' });
  }
});


// 未フォローで受け取ったふみを取得
app.post('/api/users/notfollow', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. 自分宛のDMを送ったことがある全ユーザーIDを取得
    const { data: senders } = await supabase
        .from('directmessages')
        .select('sender_id')
        .eq('receiver_id', userId);
    
    // 2. 自分がフォローしているIDを取得
    const { data: following } = await supabase
        .from('follows')
        .select('followed_id')
        .eq('follower_id', userId);
    const followingIds = following.map(f => f.followed_id);

    // 3. 「DMくれたけどフォローしてない人」を抽出
    const senderIds = [...new Set(senders.map(s => s.sender_id))]; // 重複排除
    const notFollowIds = senderIds.filter(id => !followingIds.includes(id));

    if (notFollowIds.length === 0) return res.status(214).json([]);

    // 4. その人たちの情報と最新DMを取得
    const { data: users } = await supabase.from('users').select('id, username').in('id', notFollowIds);
    
    const partners = await Promise.all(users.map(async (u) => {
        const { data: msgs } = await supabase
            .from('directmessages')
            .select('*')
            .or(`and(sender_id.eq.${userId},receiver_id.eq.${u.id}),and(sender_id.eq.${u.id},receiver_id.eq.${userId})`)
            .order('created_at', { ascending: false })
            .limit(1);
        const latest = (msgs && msgs.length > 0) ? msgs[0] : null;
        return {
            id: u.id, username: u.username,
            dm_id: latest?.id, sender_id: latest?.sender_id, receiver_id: latest?.receiver_id,
            content: latest?.content, latest_dm: latest?.created_at,
            reply_77: latest?.reply_77, is_read: latest?.is_read
        };
    }));

    partners.sort((a, b) => new Date(b.latest_dm) - new Date(a.latest_dm));

    res.status(214).json(partners);
  } catch (error) {
    console.error('非フォローふみ取得エラー:', error);
    res.status(500).json({ error: '非フォローふみ取得に失敗しました。' });
  }
});


// ダイレクトふみ取得
app.post('/api/users/:id/dfumi/messages', authenticateToken, async (req, res) => {
    try {
        const partnerId = req.params.id;
        const userId = req.user.id;
        const { data, error } = await supabase
            .from('directmessages')
            .select('*')
            .or(`and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${userId})`)
            .order('created_at', { ascending: true }); // ASC

        if (error) throw error;

        const messages = data.map(m => ({
            id: m.id,
            senderFlag: m.sender_id === userId,
            content: m.content,
            created_at: m.created_at,
            reply_77: m.reply_77,
            is_read: m.is_read
        }));
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
    const userId = req.user.id;
    const partnerId = req.params.id;

    // ★機能維持: 入力チェックロジックを完全再現
    if (!reply77Flag) { 
      if (!content1 || !content2) return res.status(400).json({ error: 'すべての句を入力してください。' });
    } else { 
      if (!content1 || !content2 || !content3) return res.status(400).json({ error: 'すべての句を入力してください。' });
    }

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
    const { flag: can_kaminoku, symbolCount: symbolCount1 } = (reply77Flag) ? await check575(ruby_dataset[0], 5) : await check575(ruby_dataset[0], 7);
    const { flag: can_nakanoku, symbolCount: symbolCount2 } = await check575(ruby_dataset[1], 7);
    const { flag: can_shimonoku, symbolCount: symbolCount3 } = (reply77Flag) ? await check575(ruby_dataset[2], 5) : { flag: true, symbolCount: 0 };

    if (!can_kaminoku) num += 1;
    if (!can_nakanoku) num += 2;
    if (!can_shimonoku) num += 4;

    if (num !== 0) return res.status(400).json({ errorCode: num, message: '句の音の数が正しくありません。' + symbolCount1 + symbolCount2 + symbolCount3 });

    const symbolCount = symbolCount1 + symbolCount2 + symbolCount3;
    if (symbolCount > 4) return res.status(400).json({ error: '記号などが多すぎます。' });

    content1 = HKtoZK(content1); 
    content2 = HKtoZK(content2); 
    content3 = HKtoZK(content3);
    const content = `${content1} ${content2} ${content3}`;

    const { error } = await supabase
        .from('directmessages')
        .insert([{ sender_id: userId, receiver_id: partnerId, content, reply_77: reply77Flag }]);

    if (error) throw error;
    const { data: sender } = await supabase.from('users').select('username').eq('id', userId).single();
    const senderName = sender ? sender.username : `ユーザー${userId}`;

    await supabase.from('notifications').insert([{
        user_id: partnerId, // 受信者
        type: 'fumi',
        from_user_id: userId, // 送信者
        message: `${senderName}さんからふみが届きました`
    }]);
    res.status(201).json({ message: 'ふみを送信しました' });

  } catch (error) {
      console.error("投稿エラー詳細:", error);
      res.status(500).json({ error: '投稿エラー', detail: error.message });
  }
});


app.post('/api/users/:id/dfumi/isread', authenticateToken, async (req, res) => {
    try {
        const partnerId = req.params.id; 
        const userId = req.user.id; 

        // Supabase update
        await supabase
            .from('directmessages')
            .update({ is_read: true })
            .match({ sender_id: partnerId, receiver_id: userId });

        res.status(216).json({message: "既読情報更新"});
    } catch (error) {
        console.error('既読情報取得エラー:', error);
        res.status(500).json({ error: '既読情報取得エラー' });
    }
});

// --- 6. サーバー起動 ---
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`サーバーがポート${PORT}で起動しました。`));

// ★これを追加してください（Vercel用）
module.exports = app;
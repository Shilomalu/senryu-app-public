require("dotenv").config();
const mysql = require("mysql2/promise");

// ==========================================
// ★設定エリア：ここを変えるだけでスケジュールが変わります
// ==========================================

// 1. 基準日（ここからスタート）
// 例: "2024-12-01" にすると、そこから1週間ごとにスケジュールが作られます
const BASE_DATE = "2024-12-01"; 

// 2. 何週間分のスケジュールを作るか (例: 150週 = 約3年分)
const WEEKS_TO_GENERATE = 150;

// ==========================================

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "Project_Team6_user",
  password: process.env.DB_PASSWORD || "Project_Team6_pw",
  database: process.env.DB_NAME || "Project_Team6_db",
};

// 配列をシャッフルする関数 (フィッシャー–イェーツ法)
const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

// 日付を計算する関数 (YYYY-MM-DD形式)
const addDays = (dateStr, days) => {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

const main = async () => {
  let connection;
  try {
    console.log("📅 スケジュール生成を開始します...");
    connection = await mysql.createConnection(dbConfig);

    // 1. お題マスタから全IDを取得
    const [topics] = await connection.execute("SELECT id, theme_name FROM topic_master");
    if (topics.length === 0) {
      throw new Error("topic_master にデータがありません。先に初期データを投入してください。");
    }
    console.log(`✅ お題マスタ取得: ${topics.length}件`);

    // 2. IDのリストを作成してシャッフル（ランダム化）
    let topicIds = topics.map(t => t.id);
    topicIds = shuffleArray(topicIds);
    console.log("🔀 お題の順番をシャッフルしました");

    // 3. 既存のスケジュールをリセットする（重複を防ぐため）
    // ※ 外部キー制約があるため、一時的にチェックを無効化して削除
    await connection.query("SET FOREIGN_KEY_CHECKS = 0");
    await connection.query("TRUNCATE TABLE weekly_themes"); 
    await connection.query("SET FOREIGN_KEY_CHECKS = 1");
    console.log("🗑️  古いスケジュールを削除しました");

    // 4. 未来のスケジュールを生成して保存
    const values = [];
    
    for (let i = 0; i < WEEKS_TO_GENERATE; i++) {
      // お題IDを決める（お題の数より週が多くなったら、またシャッフルしたリストの先頭に戻る）
      const topicIndex = i % topicIds.length;
      
      // もし一周したら、再度シャッフルしてランダム性を高める（オプション）
      if (i > 0 && topicIndex === 0) {
        topicIds = shuffleArray(topicIds);
      }

      const selectedTopicId = topicIds[topicIndex];

      // 開始日と終了日を計算
      const startDate = addDays(BASE_DATE, i * 7);      // 基準日 + (週数 × 7日)
      const endDate = addDays(startDate, 6);            // 開始日 + 6日後

      // VALUESに追加
      values.push([selectedTopicId, startDate, endDate]);
    }

    // まとめてINSERT（高速化）
    const sql = "INSERT INTO weekly_themes (topic_id, start_date, end_date) VALUES ?";
    await connection.query(sql, [values]);

    console.log(`✨ 成功！ ${BASE_DATE} から ${WEEKS_TO_GENERATE}週間分のスケジュールを作成しました。`);
    
  } catch (err) {
    console.error("❌ エラーが発生しました:", err);
  } finally {
    if (connection) await connection.end();
  }
};

main();
const cron = require('node-cron');

// 日付計算用のヘルパー関数
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// YYYY-MM-DD形式の文字列に変換
const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

// 配列シャッフル関数
const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

// ★メイン処理: スケジュールを確認して、足りなければ補充する
const ensureSchedule = async (pool) => {
  console.log('⏰ スケジュール自動チェックを開始します...');

  try {
    // 1. 現在登録されている「一番未来の終了日」を取得
    const [rows] = await pool.query("SELECT MAX(end_date) as last_date FROM weekly_themes");
    let lastDateStr = rows[0].last_date;
    let nextStartDate;

    if (lastDateStr) {
      // データがある場合: 最後の日の「翌日」からスタート
      const lastDate = new Date(lastDateStr);
      nextStartDate = addDays(lastDate, 1);
    } else {
      // データが空っぽの場合: 「今日」からスタート
      nextStartDate = new Date();
    }

    // 2. 未来のストックが十分か確認 (例: 30日先まで埋まっているか？)
    const limitDate = addDays(new Date(), 30); // 30日後の日付
    
    // 次に作るべき開始日が、30日後よりも未来なら、まだ作らなくていい
    if (nextStartDate > limitDate) {
      console.log('✅ スケジュールは十分に残っています。補充は不要です。');
      return;
    }

    console.log('⚠️ スケジュールが少なくなっています。補充を開始します...');

    // 3. お題ネタを取得してシャッフル
    const [topics] = await pool.query("SELECT id FROM topic_master");
    if (topics.length === 0) {
      console.error('❌ お題マスタが空です！補充できません。');
      return;
    }
    let topicIds = shuffleArray(topics.map(t => t.id));

    // 4. 10週間分くらい追加で作成する
    const WEEKS_TO_ADD = 10;
    const newSchedules = [];

    let currentStart = nextStartDate;

    for (let i = 0; i < WEEKS_TO_ADD; i++) {
      // お題を選ぶ (順番に使う)
      const topicId = topicIds[i % topicIds.length];
      
      const startStr = formatDate(currentStart);
      const endStr = formatDate(addDays(currentStart, 6)); // 6日後まで (合計7日間)

      newSchedules.push([topicId, startStr, endStr]);

      // 次の開始日は、今の終了日の翌日
      currentStart = addDays(currentStart, 7);
    }

    // 5. DBに保存 (INSERT)
    await pool.query(
      "INSERT INTO weekly_themes (topic_id, start_date, end_date) VALUES ?",
      [newSchedules]
    );

    console.log(`✨ 新たに ${WEEKS_TO_ADD}週間分のスケジュールを補充しました！`);

  } catch (err) {
    console.error('❌ スケジュール自動生成エラー:', err);
  }
};

// サーバー起動時に呼び出される設定関数
const startScheduler = (pool) => {
  // 1. サーバー起動時にまず1回チェックする
  ensureSchedule(pool);

  // 2. 毎日 夜中の0時に定期チェックする
  cron.schedule('0 0 * * *', () => {
    ensureSchedule(pool);
  });
};

module.exports = { startScheduler };
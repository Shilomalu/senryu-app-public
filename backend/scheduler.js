// scheduler.js
// Supabase接続用にクライアントを作成する必要があるため、envから読み込む
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

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
// ※ pool引数は不要になりました
const ensureSchedule = async () => {
  console.log('⏰ スケジュール自動チェック中...');

  try {
    // 1. 現在登録されている「一番未来の終了日」を取得 (Supabase版)
    const { data: lastData, error: lastError } = await supabase
        .from('weekly_themes')
        .select('end_date')
        .order('end_date', { ascending: false })
        .limit(1);

    if (lastError) throw lastError;

    let nextStartDate;

    if (lastData && lastData.length > 0) {
      // データがある場合: 最後の日の「翌日」からスタート
      const lastDate = new Date(lastData[0].end_date);
      nextStartDate = addDays(lastDate, 1);
    } else {
      // データが空っぽの場合: 「今日」からスタート
      nextStartDate = new Date();
    }

    // 2. 未来のストックが十分か確認 (30日先まであるか)
    const limitDate = addDays(new Date(), 30);
    
    if (nextStartDate > limitDate) {
      // console.log('✅ スケジュールは十分です');
      return; 
    }

    console.log('⚠️ スケジュール不足を検知。補充を開始します...');

    // 3. お題ネタを取得してシャッフル
    const { data: topics, error: topicError } = await supabase
        .from('topic_master')
        .select('id');
    
    if (topicError || !topics || topics.length === 0) {
      console.error('❌ お題マスタが空です！');
      return;
    }

    let topicIds = shuffleArray(topics.map(t => t.id));

    // 4. 10週間分くらい追加で作成する
    const WEEKS_TO_ADD = 10;
    const newSchedules = [];

    let currentStart = nextStartDate;

    for (let i = 0; i < WEEKS_TO_ADD; i++) {
      const topicId = topicIds[i % topicIds.length];
      
      const startStr = formatDate(currentStart);
      const endStr = formatDate(addDays(currentStart, 6)); // 7日間

      // Supabaseのinsertはオブジェクトの配列を受け取る
      newSchedules.push({
          topic_id: topicId, 
          start_date: startStr, 
          end_date: endStr
      });

      currentStart = addDays(currentStart, 7);
    }

    // 5. DBに保存
    const { error: insertError } = await supabase
        .from('weekly_themes')
        .insert(newSchedules);

    if (insertError) throw insertError;

    console.log(`✨ ${WEEKS_TO_ADD}週間分のスケジュールを補充しました！`);

  } catch (err) {
    console.error('❌ スケジュール生成エラー:', err);
  }
};

module.exports = { ensureSchedule };
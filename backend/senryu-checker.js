const kuromoji = require('kuromoji');

const builder = kuromoji.builder({ dicPath: 'node_modules/kuromoji/dict' });

// カタカナをひらがなに変換するヘルパー関数
const cleanReading = (reading) => {
  if (!reading) return '';
  return reading.replace(/[\u30a1-\u30f6]/g, (match) => {
    return String.fromCharCode(match.charCodeAt(0) - 0x60);
  });
};

const countMora = (text) => {
  let count = 0;
  const smallVowels = ['ゃ', 'ゅ', 'ょ', 'ぁ', 'ぃ', 'ぅ', 'ぇ', 'ぉ'];
  for (let i = 0; i < text.length; i++) {
    if (smallVowels.includes(text[i])) {
      continue;
    }
    count++;
  }
  return count;
};

// メインの5-7-5チェック関数
const check575 = (text) => {
  console.log('\n--- 5-7-5 Checker Start ---');
  console.log(`[1] 入力テキスト: "${text}"`);

  return new Promise((resolve, reject) => {
    builder.build((err, tokenizer) => {
      if (err) {
        console.error('[ERROR] 辞書のビルドに失敗:', err);
        return reject(err);
      }
      console.log('[2] 辞書の読み込み成功');

      const tokens = tokenizer.tokenize(text);
      console.log('[3] 形態素解析の結果 (単語リスト):', tokens.map(t => t.surface_form));

      const reading = tokens.map(t => t.reading).join('');
      console.log(`[4] 連結された読み (カタカナ): "${reading}"`);
      
      const hiragana = cleanReading(reading);
      console.log(`[5] 整形された読み (ひらがな): "${hiragana}"`);

      const moraCount = countMora(hiragana);
      console.log(`[6] 計算された音拍（モーラ）数: ${moraCount}`);

      const isCorrect = moraCount === 17;
      console.log(`[7] 判定結果 (音拍数が17か？): ${isCorrect}`);
      console.log('--- 5-7-5 Checker End ---\n');

      resolve(isCorrect);
    });
  });
};

module.exports = { check575 };
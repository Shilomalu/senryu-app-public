const kuromoji = require('kuromoji');

// 判定器を構築（辞書を読み込む非同期処理）
const builder = kuromoji.builder({ dicPath: 'node_modules/kuromoji/dict' });

// ひらがな以外を削除し、長音「ー」を母音に変換するヘルパー関数
const cleanReading = (reading) => {
  const hiragana = reading.replace(/[^ぁ-んー]/g, ''); // ひらがなと長音以外を削除
  // 例: 「チョー」→「ちょう」のように、カタカナの長音を母音に変換する処理（簡易版）
  // 実際はより複雑なルールが必要ですが、まずは基本形
  return hiragana;
};

// 音拍（モーラ）を数える関数
const countMora = (text) => {
  let count = 0;
  const smallVowels = ['ゃ', 'ゅ', 'ょ', 'ぁ', 'ぃ', 'ぅ', 'ぇ', 'ぉ'];
  for (let i = 0; i < text.length; i++) {
    // 小さい「ゃ」「ゅ」「ょ」などは前の文字とセットで1音なので、単独では数えない
    if (smallVowels.includes(text[i])) {
      continue;
    }
    count++;
  }
  return count;
};

// メインの5-7-5チェック関数
const check575 = (text) => {
  return new Promise((resolve, reject) => {
    builder.build((err, tokenizer) => {
      if (err) {
        return reject(err);
      }

      // 1. 形態素解析を実行
      const tokens = tokenizer.tokenize(text);

      // 2. 全ての単語の「読み」を連結
      const reading = tokens.map(t => t.reading).join('');
      
      // 3. 「読み」をひらがなに変換
      const hiragana = cleanReading(reading);

      // 4. 音拍を数える
      const moraCount = countMora(hiragana);
      
      console.log(`テキスト: ${text}, 読み: ${hiragana}, 音拍数: ${moraCount}`);

      // 5. 判定 (5+7+5 = 19音)
      // ここではまず合計の音拍数が17になるかで判定（字余り・足らずを許容しない場合）
      if (moraCount === 17) {
        // さらに厳密には、各句の切れ目で5, 7, 5になっているかを判定するロジックが必要
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
};

// 他のファイルから使えるように関数をエクスポート
module.exports = { check575 };
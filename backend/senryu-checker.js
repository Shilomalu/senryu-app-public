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

const checkPart = (text) => {
  return new Promise((resolve, reject) => {
    builder.build((err, tokenizer) => {
      if (err) return reject(err);
      
      const tokens = tokenizer.tokenize(text);
      const reading = tokens.map(t => t.reading || '').join('');
      const hiragana = cleanReading(reading);
      
      resolve(countMora(hiragana));
    });
  });
};

// メインの5-7-5チェック関数
const check575 = async (content,num) => {
  console.log('\n--- 5-7-5 Checker Start ---');
  /*console.log(`[1] 入力テキスト`);
  console.log(`上の句"${content1}"`);
  console.log(`中の句"${content2}"`);
  console.log(`下の句"${content3}"`);

  try{
    const [part1, part2, part3] = await Promise.all([
      checkPart(content1),
      checkPart(content2),
      checkPart(content3),
    ]);
    return part1 === 5 && part2 === 7 && part3 === 5;
  }catch (error){
    console.error('5-7-5判定中にエラーが発生しました', error);
    return false;
  }
    */
  try{
    const moraCount = await checkPart(content);
    return moraCount === num;
  }catch(error){
    console.error('エラー発生！');
    return false;
  }
};

module.exports = { check575 };
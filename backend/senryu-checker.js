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
      const word_id=tokens.map(t=>t.word_id);
      const words=tokens.map((t)=>t.surface_form)
      const moraCount=countMora(hiragana);
      resolve({ moraCount,word_id,words });
    });
  });
};

// メインの5-7-5チェック関数
const check575 = async (content,num) => {
  console.log('\n--- 5-7-5 Checker Start ---');
  try{
    const {moraCount,word_id,words} = await checkPart(content);
    console.log(moraCount);
    const flag = moraCount === num
    console.log(word_id);
    return {flag,word_id,words}
    
  }catch(error){
    console.error('エラー発生！');
    return false;
  }
};

module.exports = { check575,checkPart };
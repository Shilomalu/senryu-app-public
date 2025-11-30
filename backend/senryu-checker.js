const kuromoji = require('kuromoji');

const builder = kuromoji.builder({ dicPath: 'node_modules/kuromoji/dict' });

const { HKtoZK, HGtoZK } = require('./helper_fun.js');

const countMora = (text) => {
  let count = 0;
  const smallVowels = ['ャ', 'ュ', 'ョ', 'ァ', 'ィ', 'ゥ', 'ェ', 'ォ'];
  for (let i = 0; i < text.length; i++) {
    if (!smallVowels.includes(text[i])) count++;
  }
  return count;
};

const countSymbol = (text) => {
  let count = 0;
  const symbolmap = ['。', '、', '「', '」', '・', '！', '？'];
  for (let i = 0; i < text.length; ++i) {
    if (symbolmap.includes(text[i])) count++;
  }
  return count;
}

const checkPart = (text) => {
  return new Promise((resolve, reject) => {
    builder.build((err, tokenizer) => {
      if (err) return reject(err);
      
      const tokens = tokenizer.tokenize(text);

      let zk = '';
      let word_id = [];
      let words = [];
      for (let i = 0; i < tokens.length; ++i) {
        if (tokens[i].word_type == 'KNOWN') {
          zk += HGtoZK(tokens[i].reading);
          words.push(tokens[i].surface_form);
        } else {
          zk += HGtoZK(tokens[i].surface_form);
        }
      }

      console.log(zk);
      
      let moraCount = countMora(zk);
      let symbolCount = countSymbol(text);
      moraCount -= symbolCount;

      resolve({ moraCount, symbolCount, words });
    });
  });
};

// メインの5-7-5チェック関数
const check575 = async (content, num) => {
  console.log('\n--- 5-7-5 Checker Start ---');
  try{
    const { moraCount, symbolCount, words} = await checkPart(content);
    const flag = (moraCount >= num-1 && moraCount <= num+1);
    return { flag, symbolCount, words };
    
  }catch(error){
    console.error('エラー発生！');
    return false;
  }
};

module.exports = { check575, checkPart };
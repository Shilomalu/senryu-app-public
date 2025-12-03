const { ZKtoHG } = require('./helper_fun.js');

const countMora = (text) => {
  let count = 0;
  const smallVowels = ['ゃ', 'ゅ', 'ょ', 'ぁ', 'ぃ', 'ぅ', 'ぇ', 'ぉ'];
  for (const t of text) {
    if (!smallVowels.includes(t)) count++;
  }
  return count;
};

const countSymbol = (text) => {
  let count = 0;
  const symbolmap = ['。', '、', '「', '」', '・', '！', '？'];
  for (const t of text) {
    if (symbolmap.includes(t)) count++;
  }
  return count;
}

const checkPart = (data) => {
  return new Promise((resolve, reject) => {
    let hg = '';
    for (const datum of data) {
      if (datum.ruby != null) {
        hg += datum.ruby;
      } else {
        hg += ZKtoHG(datum.word);
      }
    }

    console.log(hg);
      
    let moraCount = countMora(hg);
    let symbolCount = countSymbol(hg);
    moraCount -= symbolCount;

    resolve({ moraCount, symbolCount });
  });
};

// メインの5-7-5チェック関数
const check575 = async (ruby_data, num) => {
  console.log('\n--- 5-7-5 Checker Start ---');
  try{
    const { moraCount, symbolCount } = await checkPart(ruby_data);
    const flag = (moraCount >= num-1 && moraCount <= num+1);
    return { flag, symbolCount };
    
  }catch(error){
    console.error('エラー発生！');
    return false;
  }
};

module.exports = { check575, checkPart };
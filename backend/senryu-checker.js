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

const checkPart = (data) => {
  return new Promise((resolve, reject) => {
    let zk = '';
    for (let i = 0; i < data.length; ++i) {
      if (data[i].ruby != null) {
        zk += data[i].ruby;
      } else {
        zk += HGtoZK(data[i].word);
      }
    }

    console.log(zk);
      
    let moraCount = countMora(zk);
    let symbolCount = countSymbol(zk);
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
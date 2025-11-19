const kuromoji = require('kuromoji');
const builder = kuromoji.builder({ dicPath: 'node_modules/kuromoji/dict' });
const { HKtoZK } = require('./helper_fun.js');

const make_ruby = (text) => {
  return new Promise((resolve, reject) => {
    builder.build((err, tokenizer) => {
      if (err) return reject(err);

      const adjust_text = HKtoZK(text);
      const tokens = tokenizer.tokenize(adjust_text);

      words_ruby = []
      for (let i = 0; i < tokens.length; ++i) {
        if ((/^[\u4E00-\u9FFF]+$/).test(tokens[i]) && tokens[i].word_type == 'KNOWN') {
          words_ruby.push([tokens[i].basic_form, tokens[i].reading]);
        } else {
          words_ruby.push([tokens[i].basic_form, ""])
        }
      }

      resolve({ words_ruby });
    });
  });
};

module.exports = { make_ruby };
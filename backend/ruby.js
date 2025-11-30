const kuromoji = require('kuromoji');
const builder = kuromoji.builder({ dicPath: 'node_modules/kuromoji/dict' });

const make_ruby = (text) => {
  return new Promise((resolve, reject) => {
    builder.build((err, tokenizer) => {
      if (err) return reject(err);

      const tokens = tokenizer.tokenize(text);

      words_ruby = []
      for (let i = 0; i < tokens.length; ++i) {
        if ((/[\u4E00-\u9FFF]/).test(tokens[i].surface_form)) {
          if (tokens[i].word_type == 'KNOWN') {
            words_ruby.push({ word: tokens[i].surface_form, ruby: tokens[i].reading });
          } else {
            words_ruby.push({ word: tokens[i].surface_form, ruby: "○○" });
          }
        } else {
          words_ruby.push({ word: tokens[i].surface_form, ruby: "" });
        }
      }
    resolve({ text: text, ruby_data: words_ruby });
    });
  });
};

module.exports = { make_ruby };
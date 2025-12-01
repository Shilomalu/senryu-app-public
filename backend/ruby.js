const kuromoji = require('kuromoji');
const builder = kuromoji.builder({ dicPath: 'node_modules/kuromoji/dict' });
const { HGtoZK } = require("./helper_fun.js");

const make_ruby = (text) => {
  return new Promise((resolve, reject) => {
    builder.build((err, tokenizer) => {
      if (err) return reject(err);

      const tokens = tokenizer.tokenize(text);

      words_ruby = []
      for (let token of tokens) {
        const surface_form = token.surface_form;
        const reading = token.reading;
        const word_type = token.word_type;

        if ((/[\u4E00-\u9FFF]/).test(surface_form)) {
          if (word_type == 'KNOWN') {
            // words_ruby.push({ word: surface_form, ruby: reading });
            let kanji = "";
            let not_kanji = "";
            let read_l = 0; let read_r = 0;

            for (const s of surface_form) {
              if ((/[\u4E00-\u9FFF]/).test(s)) {
                if (kanji == "" && not_kanji != "") {
                  words_ruby.push({ word: not_kanji, ruby: null });
                  not_kanji = "";
                }
                kanji += s;
              } else {
                if (not_kanji == "" && kanji != "") {
                  read_r = read_l;
                  while (reading[read_r] != HGtoZK(s) && read_r < reading.length) ++read_r;
                  words_ruby.push({ word: kanji, ruby: reading.slice(read_l, read_r) });
                  read_l = read_r;
                  kanji = "";
                }
                not_kanji += s;
                ++read_l;
              }
            }
            if (kanji != "") {
              words_ruby.push({ word: kanji, ruby: reading.slice(read_l) });
            } else {
              words_ruby.push({ word: not_kanji, ruby: null });
            }

          } else {
            words_ruby.push({ word: surface_form, ruby: "○○" });
          }
        } else {
          words_ruby.push({ word: surface_form, ruby: null });
        }
      }
    resolve({ text: text, ruby_data: words_ruby });
    });
  });
};

module.exports = { make_ruby };
const kuromoji = require('kuromoji');
const path = require('path'); // ★追加: パス操作用
const { ZKtoHG } = require("./helper_fun.js");

// ★修正: Vercelでも辞書を見つけられるように「絶対パス」を作る
const dicPath = path.join(process.cwd(), 'node_modules', 'kuromoji', 'dict');
const builder = kuromoji.builder({ dicPath: dicPath });

const make_ruby = (text) => {
  return new Promise((resolve, reject) => {
    builder.build((err, tokenizer) => {
      if (err) return reject(err);

      const tokens = tokenizer.tokenize(text);

      words_ruby = []
      for (const token of tokens) {
        const surface_form = token.surface_form;
        const reading = token.reading;
        const word_type = token.word_type;

        if ((/[\u4E00-\u9FFF々]/).test(surface_form)) {
          if (word_type === 'KNOWN') {
            HG_reading = ZKtoHG(reading);
            let kanji = ""; let not_kanji = "";
            let read_l = 0; let read_r = 0;

            for (const sf of surface_form) {
              if ((/[\u4E00-\u9FFF々]/).test(sf)) {
                if (kanji == "" && not_kanji != "") {
                  words_ruby.push({ word: not_kanji, ruby: null });
                  not_kanji = "";
                }
                kanji += sf;
              } else {
                if (not_kanji == "" && kanji != "") {
                  read_r = read_l;
                  while (HG_reading[read_r] != sf && read_r < HG_reading.length) ++read_r;
                  words_ruby.push({ word: kanji, ruby: HG_reading.slice(read_l, read_r) });
                  read_l = read_r;
                  kanji = "";
                }
                not_kanji += sf;
                ++read_l;
              }
            }
            if (kanji != "") {
              words_ruby.push({ word: kanji, ruby: HG_reading.slice(read_l) });
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
      console.log(words_ruby);
    resolve({ text: text, ruby_data: words_ruby });
    });
  });
};

module.exports = { make_ruby };
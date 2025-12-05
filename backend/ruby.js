const kuromoji = require('kuromoji');
const path = require('path');
const fs = require('fs');
const { ZKtoHG } = require("./helper_fun.js");

// ★ Vercelでもローカルでも確実に辞書を見つける魔法のロジック
const getDictPath = () => {
    const candidates = [
        path.join(process.cwd(), 'dict'),            // Vercel本番 (server.jsと同じ階層)
        path.join(process.cwd(), 'backend', 'dict'), // ローカル開発
        path.join(__dirname, 'dict')                 // バックアップ
    ];
    
    for (const p of candidates) {
        if (fs.existsSync(p)) {
            console.log("Ruby用辞書発見:", p);
            return p;
        }
    }
    console.error("【Ruby用辞書エラー】辞書が見つかりません:", candidates);
    return path.join(process.cwd(), 'dict');
};

// 修正: getDictPath() を使ってビルダーを作る
const builder = kuromoji.builder({ dicPath: getDictPath() });

const make_ruby = (text) => {
  return new Promise((resolve, reject) => {
    builder.build((err, tokenizer) => {
      if (err) return reject(err);

      const tokens = tokenizer.tokenize(text);
      let words_ruby = []; // varやconst指定が抜けていたのでletを追加

      for (const token of tokens) {
        const surface_form = token.surface_form;
        const reading = token.reading;
        const word_type = token.word_type;

        if ((/[\u4E00-\u9FFF々]/).test(surface_form)) {
          if (word_type === 'KNOWN') {
            const HG_reading = ZKtoHG(reading);
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
      // console.log(words_ruby);
      resolve({ text: text, ruby_data: words_ruby });
    });
  });
};

module.exports = { make_ruby };
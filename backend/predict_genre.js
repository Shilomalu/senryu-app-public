const fs = require('fs');
const path = require('path');
const kuromoji = require('kuromoji');

// JSONデータの読み込み
const modelDataPath = path.join(__dirname, 'model_data.json');
let modelData = null;

try {
    const raw = fs.readFileSync(modelDataPath, 'utf-8');
    modelData = JSON.parse(raw);
    console.log("AIモデルデータを読み込みました。");
} catch (e) {
    console.error("モデルデータの読み込みに失敗しました。jsonを作成しましたか？", e);
}

// 形態素解析器の準備 (非同期)
let tokenizer = null;
kuromoji.builder({ dicPath: "node_modules/kuromoji/dict" }).build((err, _tokenizer) => {
    if (err) {
        console.error("辞書読み込みエラー:", err);
    } else {
        tokenizer = _tokenizer;
        console.log("Tokenizer準備完了");
    }
});

/**
 * テキストからジャンルIDを予測する関数
 */
function predictGenreJS(text) {
    // 1. 準備ができていない、またはテキストが無い場合はデフォルト(その他:8)を返す
    if (!modelData || !tokenizer || !text) {
        return 8; 
    }

    // 2. 形態素解析 (PythonのJanomeと同じ品詞を抽出)
    const tokens = tokenizer.tokenize(text);
    const validTokens = [];
    
    tokens.forEach(token => {
        // 品詞チェック (名詞, 動詞, 形容詞, 副詞)
        const pos = token.pos; // kuromojiでは pos
        if (["名詞", "動詞", "形容詞", "副詞"].includes(pos)) {
            // 基本形を使用 (kuromojiでは basic_form)
            const word = token.basic_form === "*" ? token.surface_form : token.basic_form;
            validTokens.push(word);
        }
    });

    // 3. スコア計算 (LinearSVCの決定関数: X @ weights.T + bias)
    // 行列計算ライブラリを使わず、必要な部分だけ計算して高速化します
    
    const { vocabulary, weights, bias, label_list } = modelData;
    const numClasses = label_list.length;
    
    // 各クラスごとのスコア初期値 (= bias)
    let scores = [...bias]; 

    // 単語ごとに重みを加算
    validTokens.forEach(word => {
        if (vocabulary.hasOwnProperty(word)) {
            const wordIndex = vocabulary[word];
            // その単語インデックスに対応する、各クラスの重みを足す
            for (let i = 0; i < numClasses; i++) {
                scores[i] += weights[i][wordIndex];
            }
        }
    });

    // 4. 最大スコアのインデックスを探す (argmax)
    let maxScore = -Infinity;
    let maxIndex = 0;
    
    for (let i = 0; i < numClasses; i++) {
        if (scores[i] > maxScore) {
            maxScore = scores[i];
            maxIndex = i;
        }
    }

    // 5. 対応するジャンルIDを返す
    return label_list[maxIndex];
}

module.exports = { predictGenreJS };
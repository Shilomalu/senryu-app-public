const fs = require('fs');
const path = require('path');
const kuromoji = require('kuromoji');


// 1. モデルデータを見つける魔法のロジック
const getModelPath = () => {
    const candidates = [
        path.join(process.cwd(), 'model_data.json'),             // Vercel本番
        path.join(process.cwd(), 'backend', 'model_data.json'),  // ローカル開発
        path.join(__dirname, 'model_data.json')                  // バックアップ
    ];
    for (const p of candidates) {
        if (fs.existsSync(p)) return p;
    }
    console.error("【AIモデルエラー】jsonが見つかりません:", candidates);
    return candidates[0];
};

// 2. 辞書を見つける魔法のロジック
const getDictPath = () => {
    const candidates = [
        path.join(process.cwd(), 'dict'),            
        path.join(process.cwd(), 'backend', 'dict'), 
        path.join(__dirname, 'dict')                 
    ];
    for (const p of candidates) {
        if (fs.existsSync(p)) {
            console.log("AI用辞書発見:", p);
            return p;
        }
    }
    console.error("【AI辞書エラー】辞書が見つかりません:", candidates);
    return path.join(process.cwd(), 'dict');
};


// JSONデータの読み込み (魔法のロジックを使用)
let modelData = null;
try {
    const p = getModelPath();
    const raw = fs.readFileSync(p, 'utf-8');
    modelData = JSON.parse(raw);
    console.log("AIモデルデータを読み込みました。Path:", p);
} catch (e) {
    console.error("モデルデータの読み込みに失敗しました。", e);
}


// 形態素解析器の準備 (魔法のロジックを使用)
let tokenizer = null;

// ★修正点：ここで getDictPath() を使う必要があります！
// 元のコードでは "node_modules/..." を指定していたためVercelで失敗していました
kuromoji.builder({ dicPath: getDictPath() }).build((err, _tokenizer) => {
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
    if (!modelData || !tokenizer || !text) {
        // まだ準備できていない場合は「その他」を返す
        return 8; 
    }

    const tokens = tokenizer.tokenize(text);
    const validTokens = [];
    
    tokens.forEach(token => {
        const pos = token.pos;
        if (["名詞", "動詞", "形容詞", "副詞"].includes(pos)) {
            const word = token.basic_form === "*" ? token.surface_form : token.basic_form;
            validTokens.push(word);
        }
    });

    const { vocabulary, weights, bias, label_list } = modelData;
    const numClasses = label_list.length;
    
    let scores = [...bias]; 

    validTokens.forEach(word => {
        if (vocabulary.hasOwnProperty(word)) {
            const wordIndex = vocabulary[word];
            for (let i = 0; i < numClasses; i++) {
                scores[i] += weights[i][wordIndex];
            }
        }
    });

    let maxScore = -Infinity;
    let maxIndex = 0;
    
    for (let i = 0; i < numClasses; i++) {
        if (scores[i] > maxScore) {
            maxScore = scores[i];
            maxIndex = i;
        }
    }

    return label_list[maxIndex];
}

module.exports = { predictGenreJS };
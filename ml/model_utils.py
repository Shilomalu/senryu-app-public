# ml/model_utils.py

import joblib
from janome.tokenizer import Tokenizer
import numpy as np

# ------------------------------
# モデル読み込み
# ------------------------------
model_data = joblib.load("models/senryu_genre_model.joblib")

vectorizer = model_data["vectorizer"]
weights = model_data["weights"]      # shape: (n_classes, vocab)
bias = model_data["bias"]            # shape: (n_classes,)
label_list = model_data["label_list"]

# ------------------------------
# tokenizer
# ------------------------------
tokenizer = Tokenizer()

def tokenize(text):
    tokens = []
    for token in tokenizer.tokenize(text):
        pos = token.part_of_speech.split(",")[0]
        if pos in ["名詞", "動詞", "形容詞", "副詞"]:
            tokens.append(token.base_form)
    return " ".join(tokens)

# ------------------------------
# ジャンル予測（確認用 print付き）
# ------------------------------
def predict_genre(senryu_text: str) -> int:
    parsed = tokenize(senryu_text)
    vec = vectorizer.transform([parsed])
    print("🔹 TF-IDF ベクトル化成功:", vec.shape)

    scores = vec @ weights.T + bias
    print("🔹 スコア計算成功:", scores.shape)

    # numpy 変換は不要
    scores = scores[0]
    print("🔹 スコア配列:", scores)

    best_index = np.argmax(scores)
    predicted_genre = label_list[best_index]
    print(f"🔹 入力: 『{senryu_text}』 → 推定ジャンルID: {predicted_genre}")

    return int(predicted_genre)

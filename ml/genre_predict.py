import sys
import os
import joblib
from janome.tokenizer import Tokenizer

# ===== 1. モデルの読み込み =====
BASE_DIR = os.path.dirname(__file__)
MODEL_PATH = os.path.join(BASE_DIR, "models", "senryu_genre_model.joblib")

data = joblib.load(MODEL_PATH)
vectorizer = data["vectorizer"]
weights = data["weights"]
bias = data["bias"]
label_list = data["label_list"]

tokenizer = Tokenizer()

def tokenize(text: str) -> str:
    tokens = []
    for token in tokenizer.tokenize(text):
        pos = token.part_of_speech.split(",")[0]
        if pos in ["名詞", "動詞", "形容詞", "副詞"]:
            tokens.append(token.base_form)
    return " ".join(tokens)

def predict_genre(text: str) -> int:
    parsed = tokenize(text)
    X = vectorizer.transform([parsed])  # 1件だけなので [parsed]
    # LinearSVC と同じ決定関数を自前で計算（weights, bias を使う）
    scores = (X @ weights.T) + bias   # shape: (1, num_classes)
    # 一番スコアが高いクラスを取る
    import numpy as np
    idx = int(np.argmax(scores, axis=1)[0])
    genre_id = int(label_list[idx])
    return genre_id

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("8")  # デフォルト「その他」にしておくなど
        sys.exit(0)

    # Node から渡されたテキスト
    text = sys.argv[1]

    genre_id = predict_genre(text)

    # ★ここがNode側に返す値。余計な文字出さない！
    print(genre_id)

# 機械学習モデルのファイル

import os
import pandas as pd
from janome.tokenizer import Tokenizer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC
import joblib

# ------------------------------
# 1. 形態素解析（Janome）
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
# 2. データ読み込み（相対パス）
# ------------------------------
# train_model.py から見た CSV の相対パス
csv_path = os.path.join(os.path.dirname(__file__), "senryu_labeled.csv")

# ファイル存在確認
if not os.path.exists(csv_path):
    raise FileNotFoundError(f"CSVファイルが見つかりません: {csv_path}")

# UTF-8 BOM対応で読み込み
df = pd.read_csv(csv_path, encoding="utf-8-sig")

# 必須列の確認
assert "content" in df.columns, "content列がありません"
assert "genre_id" in df.columns, "genre_id列がありません"

df["parsed"] = df["content"].apply(tokenize)
X_text = df["parsed"]
y = df["genre_id"]

# ------------------------------
# 3. TF-IDF 設定（短文向け最適化）
# ------------------------------
vectorizer = TfidfVectorizer(
    min_df=1,
    max_df=0.9,
    ngram_range=(1, 2),
    sublinear_tf=True
)

X_tfidf = vectorizer.fit_transform(X_text)

# ------------------------------
# 4. モデル学習（LinearSVC）
# ------------------------------
model = LinearSVC()
model.fit(X_tfidf, y)

# 重みとバイアス
weights = model.coef_
bias = model.intercept_

# ------------------------------
# 5. モデル保存
# ------------------------------
model_dir = os.path.join(os.path.dirname(__file__), "models")
os.makedirs(model_dir, exist_ok=True)

save_data = {
    "vectorizer": vectorizer,
    "weights": weights,
    "bias": bias,
    "label_list": model.classes_,
}

joblib.dump(save_data, os.path.join(model_dir, "senryu_genre_model.joblib"))

print("モデル学習完了！ → models/senryu_genre_model.joblib に保存しました")

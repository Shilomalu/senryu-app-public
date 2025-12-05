import os
import joblib
import json
import numpy as np

# ===== 1. モデルの読み込み =====
BASE_DIR = os.path.dirname(__file__)
# パスは環境に合わせて調整してください
MODEL_PATH = os.path.join(BASE_DIR, "models", "senryu_genre_model.joblib")

try:
    data = joblib.load(MODEL_PATH)
    print("モデル読み込み成功")
except Exception as e:
    print(f"エラー: {e}")
    exit()

vectorizer = data["vectorizer"]
weights = data["weights"]
bias = data["bias"]
label_list = data["label_list"]

# ===== 2. データの整形 =====
# JavaScriptで使いやすい形に変換します

# 単語辞書 (単語: インデックス)
vocabulary = vectorizer.vocabulary_

# numpy配列などはJSONにできないのでリストに変換
weights_list = weights.tolist() if hasattr(weights, "tolist") else weights
bias_list = bias.tolist() if hasattr(bias, "tolist") else bias
label_list_conv = label_list.tolist() if hasattr(label_list, "tolist") else label_list

output_data = {
    "vocabulary": vocabulary,
    "weights": weights_list,
    "bias": bias_list,
    "label_list": label_list_conv
}

# ===== 3. JSONとして保存 =====
OUTPUT_PATH = "model_data.json"
with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
    json.dump(output_data, f, ensure_ascii=False, separators=(',', ':'))

print(f"変換完了！ {OUTPUT_PATH} が作成されました。")
print("このファイルを backend フォルダに置いてください。")
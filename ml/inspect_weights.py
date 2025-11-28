# inspect_weights.py

import joblib
import os
import numpy as np

# モデルパス
model_path = os.path.join(os.path.dirname(__file__), "models", "senryu_genre_model.joblib")

# モデル読み込み
model_data = joblib.load(model_path)
vectorizer = model_data["vectorizer"]
weights = model_data["weights"]       # shape = (n_classes, n_features)
bias = model_data["bias"]
label_list = model_data["label_list"]

print("🔹 モデル重み・バイアスの確認")
print("weights shape:", weights.shape)
print("bias shape:", bias.shape)
print("ジャンル一覧:", label_list)
print()

# 語彙リスト（単語 → 列番号）
vocab_items = sorted(vectorizer.vocabulary_.items(), key=lambda x: x[1])

# 各ジャンルの先頭10語の重みとバイアスを表示
for i, label in enumerate(label_list):
    print(f"ジャンル {label} のバイアス: {bias[i]:.4f}")
    print(f"ジャンル {label} の先頭10語の重み:")
    for word, idx in vocab_items[:10]:
        print(f"  {word}: {weights[i, idx]:.4f}")
    print()

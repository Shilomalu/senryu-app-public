# 投稿される川柳に対して返すIDを確認するファイル
from model_utils import predict_genre

# 任意の川柳をテスト
sample_texts = [
    "柿食えば　鐘がなるなり　法隆寺"
]

for text in sample_texts:
    genre_id = predict_genre(text)
    print(f"『{text}』 → ジャンルID: {genre_id}")

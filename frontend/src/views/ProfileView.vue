<style scoped>
/* コンテナ全体のスタイル */
.profile-container {
  max-width: 600px;
  margin: 2rem auto;
  padding: 2rem;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  background-color: #fff;
  text-align: center;
}

/* プロフィール情報のセクション */
.profile-info {
  text-align: left;
  margin-top: 2rem;
}

.profile-info ul {
  list-style: none;
  padding: 0;
}

.profile-info li {
  margin-bottom: 1.2rem; /* 少し間隔を広げる */
  font-size: 1.1rem;
  color: #555; /* 通常テキストの色 */
}

/* ラベル部分（ユーザー名：など） */
.profile-info li strong {
  color: #333; /* ラベルの色を少し濃く */
  display: inline-block;
  min-width: 150px; /* ラベルの幅を揃える（お好みで調整） */
}

/* 投稿リストの箇条書き */
.profile-info ul ul {
  margin-top: 0.5rem;
  padding-left: 20px; /* インデント */
}
.profile-info ul ul li {
  margin-bottom: 0.5rem;
  font-size: 1rem; /* 投稿リストの文字サイズ */
  color: #444; /* 投稿内容の文字色 */
}

/* ヘッダー部分（タイトルとボタン） */
.profile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #eee; /* タイトルの下に線 */
  padding-bottom: 1rem;
}

.profile-header h1 {
  font-weight: bold;
  font-size: 1.8rem;
  color: #2c3e50; /* 見出しの色（Vueのデフォルトに近い色） */
  margin: 0; /* 不要なマージンを削除 */
}

/* ヘッダー内のボタングループ */
.profile-header .button-group {
  display: flex;
  gap: 10px;
}

/* 汎用ボタンスタイル */
.button-group button {
  padding: 8px 18px;
  border: none;
  border-radius: 6px;
  color: #fff; /* ボタンの文字色を白に */
  font-size: 0.9rem; /* ボタンの文字サイズ */
  cursor: pointer;
  transition: background-color 0.2s ease;
}

/* 編集ボタン */
.edit-btn {
  background-color: #007bff; /* 青色 */
}
.edit-btn:hover {
  background-color: #0056b3;
}

/* ログアウトボタン */
.logout-btn {
  background-color: #dc3545; /* 赤色 */
}
.logout-btn:hover {
  background-color: #a71d2a;
}

/* --- ログインを促す画面用のスタイル --- */
.auth-prompt {
  max-width: 500px;
  margin: 4rem auto;
  padding: 2.5rem; /* 少し余白を増やす */
  text-align: center;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #f9f9f9; /* 背景色を少しつける */
}

.auth-prompt h2 {
  margin-bottom: 1.5rem; /* 間隔調整 */
  color: #333; /* 見出しの色 */
}

.auth-prompt p {
  margin-bottom: 2.5rem; /* 間隔調整 */
  color: #555; /* 説明文の色 */
  line-height: 1.7; /* 行間調整 */
}

/* 認証画面へのボタングループ */
.auth-prompt .button-group {
  display: flex;
  justify-content: center;
  gap: 1.5rem; /* ボタン間のスペース */
}

/* 認証画面へのボタン */
.auth-prompt .button {
  display: inline-block;
  padding: 12px 24px;
  background-color: #007bff;
  color: white; /* 文字色 */
  text-decoration: none;
  border-radius: 5px;
  font-weight: bold;
  transition: background-color 0.2s ease;
}
.auth-prompt .button:hover {
  background-color: #0056b3;
}
</style>
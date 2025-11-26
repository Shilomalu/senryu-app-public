<script setup>
import { ref, onMounted } from 'vue'; // ref と onMounted をインポート
import { RouterView, RouterLink } from 'vue-router';
import { jwtDecode } from 'jwt-decode'; // jwt-decode をインポート

// アプリケーションがマウント（準備完了）された時に実行する処理
onMounted(() => {
  const token = localStorage.getItem('token'); // ブラウザからトークンを取得

  // もしトークンが存在すれば、有効かどうかをチェック
  if (token) {
    try {
      // トークンをデコードして中身（特に有効期限）を確認
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000; // 現在時刻 (秒単位)

      // 有効期限 (exp) が切れていたら
      if (decoded.exp < currentTime) {
        console.log('トークンの有効期限切れ。削除します。');
        localStorage.removeItem('token'); // トークンを削除
      }
      // 有効期限内なら何もしない (ログイン状態を維持)

    } catch (error) {
      // トークンが不正な形式の場合 (デコードに失敗した場合)
      console.error('無効なトークン形式。削除します。', error);
      localStorage.removeItem('token'); // トークンを削除
    }
  }
  // トークンが存在しなければ、元々ログアウト状態なので何もしない
});
</script>

<template>
  <main class="content">
    <RouterView />
  </main>

  <footer class="tab-bar">
    <RouterLink to="/" class="tab-link">
      <span>ホーム</span>
    </RouterLink>
    <RouterLink to="/search" class="tab-link">
      <span>検索</span>
    </RouterLink>
    <RouterLink to="/post" class="tab-link">
      <span>投稿</span>
    </RouterLink>
    <RouterLink to="/profile" class="tab-link">
      <span>プロフィール</span>
    </RouterLink>
    <RouterLink to="/dfumi" class="tab-link">
      <span>ダイレクトふみ</span>
    </RouterLink>
  </footer>
</template>

<style scoped>
/* スタイル部分は変更ありません */
.content {
  padding-bottom: 80px;
}
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  /* 高さを揃える */
  height: 60px;
  background-color: #ffffff;
  border-top: 1px solid #e0e0e0;
  box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.05);
  align-items: stretch; /* ← 追加: タブの高さをバーに合わせる */
}

.tab-link {
  flex: 1; /* 均等幅にする */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #888;
  text-decoration: none;
  font-size: 12px;
  height: 100%; /* バーの高さに合わせる */
  box-sizing: border-box; /* パディング込みで高さを固定 */
}

.router-link-active {
  color: #007bff;
  border-bottom: 5px solid #007bff; /* 下線だけ */
  border-radius: 0;                /* 丸角は不要 */
  background-color: hwb(210 75% 0%);  /* 背景は透過 */
  font-size: 1.1rem;
}

</style>
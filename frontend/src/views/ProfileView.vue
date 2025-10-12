<script setup>
import { ref, onMounted } from 'vue';
import { RouterLink } from 'vue-router';

// ログイン状態を管理するためのリアクティブな変数
const isLoggedIn = ref(false);

// このページが読み込まれた時に、ログイン状態をチェックする
onMounted(() => {
  // ブラウザのlocalStorageにトークンが存在するかどうかで判断
  const token = localStorage.getItem('token');
  if (token) {
    isLoggedIn.value = true;
  } else {
    isLoggedIn.value = false;
  }
});

// ログアウト処理
const logout = () => {
  // ブラウザからトークンを削除
  localStorage.removeItem('token');
  // ログイン状態をfalseに更新（画面が自動で切り替わります）
  isLoggedIn.value = false;
};
</script>

<template>
  <div>
    <div v-if="isLoggedIn" class="profile-container">
      <h1>マイプロフィール</h1>
      
      <div class="profile-info">
        <h3>表示される情報</h3>
        <ul>
          <li><strong>ユーザー名:</strong> (ここにあなたのユーザー名が表示されます)</li>
          <li><strong>メールアドレス:</strong> (ここにあなたのメールアドレスが表示されます)</li>
          <li><strong>自己紹介:</strong> (ここにあなたの自己紹介文が表示されます)</li>
          <li><strong>投稿した川柳一覧:</strong> (ここにあなたが投稿した川柳のリストが表示されます)</li>
        </ul>
      </div>

      <button @click="logout" class="logout-button">ログアウト</button>
    </div>

    <div v-else class="auth-prompt">
      <h2>ログインが必要です</h2>
      <p>プロフィールを閲覧・編集するには、ログインまたは新規登録をしてください。</p>
      <div class="button-group">
        <RouterLink to="/login" class="button">ログイン画面へ</RouterLink>
        <RouterLink to="/register" class="button">新規登録画面へ</RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* プロフィール表示用のスタイル */
.profile-container {
  max-width: 600px;
  margin: 2rem auto;
  padding: 2rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  text-align: center;
}

.profile-info {
  text-align: left;
  margin-top: 2rem;
}

.profile-info ul {
  list-style: none;
  padding: 0;
}

.profile-info li {
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.logout-button {
  margin-top: 2rem;
  padding: 10px 25px;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
}

/* ログインを促す画面用のスタイル */
.auth-prompt {
  max-width: 500px;
  margin: 4rem auto;
  padding: 2rem;
  text-align: center;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.auth-prompt h2 {
  margin-bottom: 1rem;
}

.auth-prompt p {
  margin-bottom: 2rem;
  color: #555;
}

.button-group {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.button {
  display: inline-block;
  padding: 12px 24px;
  background-color: #007bff;
  color: white;
  text-decoration: none;
  border-radius: 5px;
  font-weight: bold;
}
</style>
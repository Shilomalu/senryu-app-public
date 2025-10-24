<<<<<<< HEAD
<style scoped>
/* コンテナ全体のスタイル */
=======
<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import axios from 'axios';

const router = useRouter();

// ログイン状態
const isLoggedIn = ref(false);

// ユーザー情報
const username = ref('');
const email = ref('');
const profile_text = ref('');
const posts = ref([]);

// JWTトークン
const token = localStorage.getItem('token');

// ログイン状態チェックとプロフィール取得
const loadProfile = async () => {
  if (!token) {
    isLoggedIn.value = false;
    return;
  }
  isLoggedIn.value = true;
  try {
    // プロフィール取得
    const res = await axios.get('/api/users/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    username.value = res.data.username;
    email.value = res.data.email;
    profile_text.value = res.data.profile_text;

    // 自分の投稿取得（タイムラインからフィルター）
    const timelineRes = await axios.get('/api/posts/timeline');
    posts.value = timelineRes.data.filter(p => p.user_id === res.data.id);
  } catch (err) {
    console.error(err);
    alert('プロフィールの取得に失敗しました');
    isLoggedIn.value = false;
  }
};

onMounted(() => {
  loadProfile();
});

// ログアウト
const logout = () => {
  localStorage.removeItem('token');
  isLoggedIn.value = false;
  router.push('/');
};

// プロフィール編集
const goEdit = () => {
  router.push('/profile/edit');
};
</script>

<template>
  <div>
    <div v-if="isLoggedIn" class="profile-container">
      <div class="profile-header">
        <h1>マイプロフィール</h1>
        <div class="button-group">
          <button @click="goEdit" class="edit-btn">編集</button>
          <button @click="logout" class="logout-btn">ログアウト</button>
        </div>
      </div>
      
      <div class="profile-info">
        <ul>
          <li><strong>ユーザー名：</strong> {{ username }}</li>
          <li><strong>メールアドレス：</strong> {{ email }}</li>
          <li><strong>自己紹介：</strong> {{ profile_text }}</li>
          <li>
            <strong>投稿した川柳一覧：</strong>
            <ul>
              <li v-for="post in posts" :key="post.user_id">{{ post.content }}</li>
            </ul>
          </li>
        </ul>
      </div>
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
>>>>>>> 3e6d52df1d87e991443f7ced5db83ade6a260525
.profile-container {
  max-width: 600px;
  margin: 2rem auto;
  padding: 2rem;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  background-color: #fff;
  text-align: center;
  color: #000;
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

<<<<<<< HEAD
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
=======
.button-container {
  display: flex;
  justify-content: flex-end; /* 右寄せ */
  gap: 10px; /* ボタン間のスペース */
  margin-top: 2rem;
}

>>>>>>> 3e6d52df1d87e991443f7ced5db83ade6a260525
.profile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
<<<<<<< HEAD
  border-bottom: 1px solid #eee; /* タイトルの下に線 */
  padding-bottom: 1rem;
=======
>>>>>>> 3e6d52df1d87e991443f7ced5db83ade6a260525
}

.profile-header h1 {
  font-weight: bold;
  font-size: 1.8rem;
<<<<<<< HEAD
  color: #2c3e50; /* 見出しの色（Vueのデフォルトに近い色） */
  margin: 0; /* 不要なマージンを削除 */
}

/* ヘッダー内のボタングループ */
.profile-header .button-group {
=======
  margin-left: 10px;
  margin-right: 20px;
}

.button-group {
>>>>>>> 3e6d52df1d87e991443f7ced5db83ade6a260525
  display: flex;
  gap: 10px;
}

<<<<<<< HEAD
/* 汎用ボタンスタイル */
=======
>>>>>>> 3e6d52df1d87e991443f7ced5db83ade6a260525
.button-group button {
  padding: 8px 18px;
  border: none;
  border-radius: 6px;
<<<<<<< HEAD
  color: #fff; /* ボタンの文字色を白に */
  font-size: 0.9rem; /* ボタンの文字サイズ */
  cursor: pointer;
  transition: background-color 0.2s ease;
=======
  color: #fff;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.edit-btn {
  background-color: #007bff;
}

.edit-btn:hover {
  background-color: #0056b3;
}

.logout-btn {
  background-color: #dc3545;
}

.logout-btn:hover {
  background-color: #a71d2a;
>>>>>>> 3e6d52df1d87e991443f7ced5db83ade6a260525
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
<<<<<<< HEAD
  background-color: #f9f9f9; /* 背景色を少しつける */
=======
  color: #000;
>>>>>>> 3e6d52df1d87e991443f7ced5db83ade6a260525
}

.auth-prompt h2 {
  margin-bottom: 1.5rem; /* 間隔調整 */
  color: #333; /* 見出しの色 */
}

.auth-prompt p {
<<<<<<< HEAD
  margin-bottom: 2.5rem; /* 間隔調整 */
  color: #555; /* 説明文の色 */
  line-height: 1.7; /* 行間調整 */
=======
  margin-bottom: 2rem;
  color: #000;
>>>>>>> 3e6d52df1d87e991443f7ced5db83ade6a260525
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
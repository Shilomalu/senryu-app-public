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

.button-container {
  display: flex;
  justify-content: flex-end; /* 右寄せ */
  gap: 10px; /* ボタン間のスペース */
  margin-top: 2rem;
}

.profile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.profile-header h1 {
  font-weight: bold;
  font-size: 1.8rem;
  margin-left: 10px;
  margin-right: 20px;
}

.button-group {
  display: flex;
  gap: 10px;
}

.button-group button {
  padding: 8px 18px;
  border: none;
  border-radius: 6px;
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
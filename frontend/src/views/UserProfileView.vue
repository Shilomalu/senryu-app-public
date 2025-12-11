<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';

const route = useRoute();
const userId = route.params.id; // URLの :id から取得

const isLoading = ref(true);
const userExists = ref(true);
const username = ref('');
const email = ref('');
const profile_text = ref('');
const posts = ref([]);

// ログインユーザーのトークン（閲覧はログイン不要でも可）
const token = localStorage.getItem('token');

// 他ユーザーのプロフィールと投稿取得
const loadUserProfile = async () => {
  try {
    // プロフィール情報の取得
    const userRes = await axios.get(`/api/users/${userId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });

    const userData = userRes.data;
    username.value = userData.username;
    email.value = userData.email;
    profile_text.value = userData.profile_text;

    // 投稿データの取得
    const postRes = await axios.get(`/api/posts/user/${userId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });

    posts.value = postRes.data;
  } catch (err) {
    console.error('ユーザーデータ取得エラー:', err);
    userExists.value = false;
  } finally {
    isLoading.value = false;
  }
};



onMounted(() => {
  loadUserProfile();
});
</script>

<template>
  <div class="form-container">
    <div v-if="isLoading" class="loading">読み込み中...</div>

    <div v-else-if="!userExists" class="not-found">
      <h2>ユーザーが見つかりません</h2>
      <p>指定されたユーザーは存在しないか、削除されています。</p>
    </div>

    <div v-else class="profile-container">
      <h1>{{ username }} さんの句歴</h1>

      <div class="profile-info">
        <ul>
          <li><strong>俳号：</strong> {{ username }}</li>
          <li><strong>添え書き：</strong> {{ profile_text }}</li>
        </ul>
      </div>

      <div class="post-list">
        <h2>投稿一覧</h2>
        <ul v-if="posts.length > 0">
          <li v-for="post in posts" :key="post.id">{{ post.content }}</li>
        </ul>
        <p v-else>投稿がまだありません。</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.form-container {
  max-width: 600px;
  text-align: left;
}

.loading, .not-found {
  text-align: center;
  color: #333;
  margin-top: 4rem;
}

.profile-container h1 {
  text-align: center;
  margin-bottom: 1.5rem;
  font-size: 1.6rem;
}

.profile-info ul {
  list-style: none;
  padding: 0;
}

.profile-info li {
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.post-list {
  margin-top: 2rem;
}

.post-list ul {
  list-style: none;
  padding: 0;
}

.post-list li {
  border-bottom: 1px solid #ddd;
  padding: 0.5rem 0;
}
</style>
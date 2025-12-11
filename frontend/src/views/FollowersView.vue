<template>
  <div class="form-container">
    <h1 class="page-title">
      {{ username }}の文友 
      <span v-if="!loading" class="follower-count">({{ followers.length }}人)</span>
    </h1>
    
    <div v-if="loading" class="loading-message">読み込み中...</div>
    <div v-else-if="!followers.length" class="empty-message">文友はいません。</div>
    
    <ul v-else class="follower-list">
  <li v-for="user in followers" :key="user.id" class="follower-item">
    <RouterLink 
      :to="user.id === currentUserId ? '/profile' : `/users/${user.id}`"
    >
      {{ user.username }}
    </RouterLink>
  </li>
</ul>

    <RouterLink to="/" class="back-link">句会に戻る</RouterLink>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import { jwtDecode } from 'jwt-decode';

const route = useRoute();
const followers = ref([]);
const username = ref('ユーザー'); // プロフィール名
const loading = ref(true);
const token = localStorage.getItem('token');
const currentUserId = ref(token ? jwtDecode(token).id : null);

const fetchFollowers = async (userId) => {
  if (!userId) return;
  loading.value = true;
  followers.value = [];

  try {
    // 1. ユーザー名を取得（ユーザー情報を取得するAPIがある前提）
    const userRes = await fetch(`/api/users/${userId}`);
    const userData = await userRes.json();
    username.value = userData.username || `ユーザー${userId}`;
    
    // 2. フォロワー一覧を取得
    const followersRes = await fetch(`/api/users/${userId}/followers`);
    const followersData = await followersRes.json();
    
    if (!followersRes.ok) throw new Error('フォロワー一覧取得エラー');
    
    followers.value = followersData;
  } catch (err) {
    console.error('フォロワー一覧の読み込み失敗:', err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchFollowers(route.params.id);
});

// URLのIDが変わった場合にも再読み込み
watch(() => route.params.id, (newId) => {
  fetchFollowers(newId);
});
</script>

<style scoped>
.form-container {
  padding: 20px;
  max-width: 600px;
}
.page-title {
  border-bottom: 2px solid #ccc;
  padding-bottom: 10px;
  margin-bottom: 20px;
}
.follower-count {
  font-size: 0.8em;
  color: #666;
  font-weight: normal;
  margin-left: 5px;
}
.follower-list {
  list-style: none;
  padding: 0;
}
.follower-item {
  padding: 10px 0;
  border-bottom: 1px dashed #eee;
}

.empty-message, .loading-message {
  text-align: center;
  color: #888;
}
.back-link {
  display: block;
  margin-top: 30px;
  text-align: center;
  color: #555;
}
</style>
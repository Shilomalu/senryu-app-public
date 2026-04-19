<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import PostCard from '@/components/PostCard.vue';
import icon0 from '@/assets/icons/kajinsample0.jpeg';
import icon1 from '@/assets/icons/kajinsample1.jpeg';
import icon2 from '@/assets/icons/kajinsample2.jpeg';
import icon3 from '@/assets/icons/kajinsample3.jpeg';
import icon4 from '@/assets/icons/kajinsample4.jpeg';
import icon5 from '@/assets/icons/kajinsample5.jpeg';
import icon6 from '@/assets/icons/kajinsample6.jpeg';
import icon7 from '@/assets/icons/kajinsample7.jpeg';
import icon8 from '@/assets/icons/kajinsample8.jpeg';
import icon9 from '@/assets/icons/kajinsample9.jpeg';
import icon10 from '@/assets/icons/kajinsample10.jpeg';
import icon11 from '@/assets/icons/kajinsample11.jpeg';

const route = useRoute();
const userId = route.params.id; // URLの :id から取得

const isLoading = ref(true);
const userExists = ref(true);
const username = ref('');
const profile_text = ref('');
const iconIndex = ref(0);
const posts = ref([]);
const currentUser = ref(null);

const icons = [
  { id: 0, src: icon0 },
  { id: 1, src: icon1 },
  { id: 2, src: icon2 },
  { id: 3, src: icon3 },
  { id: 4, src: icon4 },
  { id: 5, src: icon5 },
  { id: 6, src: icon6 },
  { id: 7, src: icon7 },
  { id: 8, src: icon8 },
  { id: 9, src: icon9 },
  { id: 10, src: icon10 },
  { id: 11, src: icon11 }
];

const token = localStorage.getItem('token');
if (token) {
  try {
    currentUser.value = jwtDecode(token);
  } catch (err) {
    console.warn('Invalid token for current user:', err);
    currentUser.value = null;
  }
}

const loadUserProfile = async () => {
  try {
    const userRes = await axios.get(`/api/users/${userId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });

    const userData = userRes.data;
    username.value = userData.username;
    profile_text.value = userData.profile_text;
    iconIndex.value = userData.icon_index ?? 0;

    const postRes = await axios.get(`/api/posts/user/${userId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });

    posts.value = postRes.data.map(post => ({
      ...post,
      likesCount: Number(post.likesCount ?? post.likeCount ?? 0),
      isLiked: Boolean(post.isLiked || post.is_liked)
    }));
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
      <div class="profile-header">
        <div class="profile-summary">
          <img :src="icons[iconIndex]?.src || icons[0].src" class="profile-icon-large" />
          <div class="profile-text-block">
            <h1>{{ username }} さんの句歴</h1>
            <p class="profile-description">{{ profile_text || 'まだ添え書きが設定されていません。' }}</p>
          </div>
        </div>
      </div>

      <section class="user-posts">
        <h2>投稿一覧</h2>
        <div v-if="posts.length" class="posts-grid">
          <div v-for="post in posts" :key="post.id" class="post-card-item">
            <PostCard :post="post" :currentUser="currentUser" />
          </div>
        </div>
        <div v-else class="no-posts">
          投稿がまだありません。
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.form-container {
  max-width: 960px;
  margin: 0 auto;
  padding: 1rem;
}

.loading, .not-found {
  text-align: center;
  color: #333;
  margin-top: 4rem;
}

.profile-header {
  margin-bottom: 1.5rem;
}

.profile-summary {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.profile-icon-large {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #ccc;
}

.profile-text-block {
  flex: 1;
  min-width: 220px;
}

.profile-text-block h1 {
  margin: 0 0 0.5rem;
  font-size: 1.8rem;
}

.profile-description {
  margin: 0;
  color: #555;
  line-height: 1.6;
}

.user-posts {
  margin-top: 2rem;
}

.user-posts h2 {
  font-size: 1.3rem;
  margin-bottom: 1rem;
}

.posts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1rem;
}

.post-card-item {
  display: flex;
}

.no-posts {
  color: #666;
  padding: 1rem;
  background: #fafafa;
  border: 1px dashed #ccc;
  border-radius: 10px;
}
</style>
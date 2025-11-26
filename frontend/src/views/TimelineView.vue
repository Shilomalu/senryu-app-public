<template>
  <div class="page-container">
    <!-- 固定ヘッダー -->
    <div class="fixed-header">
      <h1 class="page-title">🎍川柳SNS🎍</h1>
      <div class="tabs">
        <button
          :class="['tab-btn', { active: filter === 'all', jump: jumping === 'all' }]"
          @click="() => handleTabClick('all')"
        >一覧</button>
        <button
          :class="['tab-btn', { active: filter === 'likes', jump: jumping === 'likes' }]"
          @click="() => handleTabClick('likes')"
        >いとをかし</button>
        <button
          :class="['tab-btn', { active: filter === 'following', jump: jumping === 'following' }]"
          @click="() => handleTabClick('following')"
        >フォロー中</button>
      </div>
    </div>

    <!-- タイムライン -->
    <div class="timeline-content">
      <transition name="switch" mode="out-in">
        <transition-group
          v-if="timeline.length"
          :key="filter"
          name="fade-slide"
          tag="ul"
          class="timeline"
        >
          <li v-for="post in timeline" :key="post.id">
            <PostCard :post="post" :currentUser="currentUser" @delete="handleDelete" />
          </li>
        </transition-group>

        <p v-else class="empty-message" :key="filter + '-empty'">
          {{ emptyMessage }}
        </p>
      </transition>

      <!-- もっと見る or これ以上投稿はありません -->
      <div class="load-more-container" v-if="timeline.length">
        <button 
          v-if="hasMore" 
          class="load-more-btn" 
          @click="loadMore" 
          :disabled="loadingMore"
        >
          {{ loadingMore ? '読み込み中...' : 'もっと見る' }}
        </button>

        <p v-else class="no-more-message">これ以上投稿はありません</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { jwtDecode } from 'jwt-decode';
import PostCard from '../components/PostCard.vue';

const timeline = ref([]);
const filter = ref('all');
const message = ref('');
const token = ref(localStorage.getItem('token'));
const currentUser = ref(token.value ? jwtDecode(token.value) : null);

const PAGE_SIZE = 10;
const hasMore = ref(true);
const loadingMore = ref(false);

// タブのジャンプアニメ用
const jumping = ref('');

/**
 * タブクリック時
 */
const handleTabClick = (tabName) => {
  jumping.value = tabName; // アニメ用クラスを付与
  changeFilter(tabName);

  // アニメ終了後にクラスを外す（0.5秒）
  setTimeout(() => jumping.value = '', 1000);
};

/**
 * フィルター変更
 */
const changeFilter = (mode) => {
  filter.value = mode;
  timeline.value = [];
  hasMore.value = true;
  fetchTimeline();
};

/**
 * 投稿取得
 */
const fetchTimeline = async () => {
  try {
    let endpoint = '/api/posts/timeline';
    if (filter.value === 'likes') endpoint = '/api/posts/likes';
    else if (filter.value === 'following') endpoint = '/api/posts/timeline/following';

    const res = await fetch(`${endpoint}?offset=${timeline.value.length}&limit=${PAGE_SIZE}`, {
      headers: { Authorization: `Bearer ${token.value}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'タイムラインの読み込みに失敗しました。');

    const newPosts = data
      .map(post => ({
        ...post,
        likesCount: Number(post.likesCount ?? post.likeCount ?? 0),
        isLiked: Boolean(post.isLiked || post.is_liked || post.isLiked === 1),
        likedUserIds: post.likes ? post.likes.map(like => like.user_id) : (post.likedUserIds || []),
      }))
      .filter(post => !timeline.value.some(p => p.id === post.id));

    timeline.value.push(...newPosts);

    if (!newPosts.length || newPosts.length < PAGE_SIZE) hasMore.value = false;

  } catch (err) {
    console.error(err);
    message.value = err.message || 'データ取得中にエラーが発生しました';
  }
};

/**
 * もっと見る
 */
const loadMore = async () => {
  if (!hasMore.value || loadingMore.value) return;
  loadingMore.value = true;
  await fetchTimeline();
  loadingMore.value = false;
};

/**
 * 投稿削除
 */
const handleDelete = async (postId) => {
  if (!confirm('本当にこの投稿を削除しますか？')) return;
  try {
    const res = await fetch(`/api/posts/${postId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token.value}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    timeline.value = timeline.value.filter(post => post.id !== postId);
    message.value = data.message;
  } catch (err) {
    message.value = err.message;
  }
};

const emptyMessage = computed(() => {
  if (filter.value === 'all') return '投稿はありません';
  if (filter.value === 'likes') return 'いとをかしの投稿はありません';
  if (filter.value === 'following') return 'フォローしたアカウントの投稿はありません';
  return '';
});

onMounted(fetchTimeline);
</script>

<style scoped>
.page-title {
  font-family: "Yu Mincho", "serif"; /* 和風フォント */
  font-size: 2em;
  font-weight: bold;
}

.page-container {
  width: 100%;
  margin: 0;
  padding: 0;
}

.fixed-header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background-color: #fff;
  z-index: 1000;
  border-bottom: 2px solid #ccc;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}

.page-title {
  text-align: center;
  margin: 10px 0 5px;
  font-size: 1.8em;
  color: #333;
}

.tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border-bottom: 2px solid #ccc;
}

.tab-btn {
  background: #f8f8f8;
  border: 2px solid transparent; /* 枠線のスペースを確保 */
  border-radius: 8px;           /* 丸角にする場合 */
  font-weight: 500;
  font-size: 0.85rem;
  font-family: 'Roboto', sans-serif;
  color: #555;
  cursor: pointer;
  padding: 12px 0;
  transition: all 0.3s ease;
  border-bottom: 3px solid transparent;
  display: inline-block; /* transform効かせる */
}

.tab-btn.active {
  background: #fff;
  border: 2px solid #007bff;  /* 枠線も同色で囲む */
  color: #007bff;
  border-bottom: 3px solid #007bff;
  font-weight: 700;
  font-size: 1.2rem;
  letter-spacing: 0.02em;
  transform: scale(1.0);
}

.tab-btn:not(.active):hover {
  background: #eee;
  font-size: 1.2rem;
  transform: scale(1.0);
}

/* ぴょんバウンドアニメ */
@keyframes bounce {
  0%   { transform: translateY(0); }
  30%  { transform: translateY(-1000px); }
  60%  { transform: translateY(0); }
  70%  { transform: translateY(-15px); }
  80%  { transform: translateY(0); }
  90%  { transform: translateY(-5px); }
  100% { transform: translateY(0); }
}

.tab-btn.jump {
  font-size: 1.1rem;
  animation: bounce 1.0s ease 4;
}

.timeline-content {
  padding-top: 120px;
  width: 100%;
  padding-bottom: 80px;
  box-sizing: border-box;
  overflow-y: auto;
  max-height: 100vh;
}

.timeline {
  display: grid;
  gap: 1.5rem;
  justify-content: center;
}

@media (max-width: 999px) {
  .timeline {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 1000px) {
  .timeline {
    grid-template-columns: repeat(2, 500px);
  }
}

.timeline li {
  list-style: none;
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
  transition: transform 0.2s;
}
.timeline li:hover {
  transform: scale(1.02);
}

.empty-message {
  text-align: center;
  margin-top: 2rem;
  color: #888;
}

.load-more-container {
  display: flex;
  justify-content: center;
  margin: 1rem 0;
  flex-direction: column;
  align-items: center;
}

.load-more-btn {
  background: #007bff;
  color: #fff;
  border: none;
  padding: 0.6rem 1.2rem;
  font-size: 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.load-more-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.load-more-btn:hover:not(:disabled) {
  background: #0056b3;
}

.no-more-message {
  text-align: center;
  color: #888;
  margin-top: 0.5rem;
  font-size: 0.95rem;
}
</style>

<style>
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(80px) scale(0.95);
}
.fade-slide-enter-active {
  transition: all 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(100px) scale(0.9);
}
.fade-slide-leave-active {
  transition: all 0.4s ease-in;
  position: relative;
}
.fade-slide-move {
  transition: transform 0.4s ease;
}
.switch-enter-from,
.switch-leave-to {
  opacity: 0;
}
.switch-enter-active,
.switch-leave-active {
  transition: opacity 0.25s ease;
}
</style>

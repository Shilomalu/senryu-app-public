<template>
  <div class="page-container">
    <!-- 固定ヘッダー -->
    <div class="fixed-header">
      <h1 class="page-title">🎍川柳SNS🎍</h1>
      <div class="tabs">
        <button
          :class="{ active: filter === 'all' }"
          @click="changeFilter('all')"
        >一覧</button>
        <button
          :class="{ active: filter === 'likes' }"
          @click="changeFilter('likes')"
        >いいね</button>
        <button
          :class="{ active: filter === 'following' }"
          @click="changeFilter('following')"
        >フォロー中</button>
      </div>
    </div>

    <!-- タイムライン -->
    <div class="timeline-content">
      <ul v-if="timeline.length" class="timeline">
        <li v-for="post in timeline" :key="post.id">
          <PostCard :post="post" :currentUser="currentUser" @delete="handleDelete" />
        </li>
      </ul>
      <p v-else class="empty-message">{{ emptyMessage }}</p>
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

/**
 * フィルター（一覧／いいね／フォロー中）の変更時に呼ばれる
 */
const changeFilter = (mode) => {
  filter.value = mode;
  fetchTimeline();
};

/**
 * 投稿データを取得（filter.value に応じてAPI変更）
 */
const fetchTimeline = async () => {
  try {
    let endpoint = '/api/posts/timeline';
    if (filter.value === 'likes') endpoint = '/api/posts/likes';
    else if (filter.value === 'following') endpoint = '/api/posts/following';

    const res = await fetch(endpoint, {
      headers: { 'Authorization': `Bearer ${token.value}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'タイムラインの読み込みに失敗しました。');

    // ここで likesCount を確実に数値にする
    timeline.value = data.map(post => ({
      ...post,
      likesCount: Number(post.likesCount ?? post.likeCount ?? 0), // いずれのフィールド名でも対応
      isLiked: Boolean(post.isLiked || post.is_liked || post.isLiked === 1),
      // 既存の likedUserIds 処理が必要なら残す
      likedUserIds: post.likes ? post.likes.map(like => like.user_id) : (post.likedUserIds || []),
    }));

  } catch (err) {
    console.error(err);
    message.value = err.message || 'データの取得中にエラーが発生しました。';
    timeline.value = [];
  }
};


/**
 * 投稿削除処理
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

/**
 * タブごとのメッセージ
 */
const emptyMessage = computed(() => {
  if (filter.value === 'all') return '投稿はありません';
  if (filter.value === 'likes') return 'いいねした投稿はありません';
  if (filter.value === 'following') return 'フォローしたアカウントの投稿はありません';
  return '';
});

onMounted(fetchTimeline);
</script>

<style scoped>
.page-container {
  width: 100%;
  margin: 0;
  padding: 0;
}

/* 固定ヘッダー */
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
  border-top: 2px solid #ccc;
  border-bottom: 2px solid #ccc;
}

.tabs button {
  background: none;
  border: none;
  font-weight: bold;
  font-size: 1rem;
  color: #555;
  cursor: pointer;
  padding: 10px 0;
  position: relative;
}

.tabs button:not(:last-child)::after {
  content: "";
  position: absolute;
  right: 0;
  top: 25%;
  bottom: 25%;
  width: 1px;
  background-color: #ccc;
}

.tabs button.active {
  color: #007bff;
}

/* タイムライン */
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
}
.empty-message {
  text-align: center;
  margin-top: 2rem;
  color: #888;
}
</style>

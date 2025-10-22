<template>
  <div class="page-container">
    <!-- ページタイトル -->
    <h1 class="page-title">🎍川柳SNS🎍</h1>
    <hr />

    <!-- 上部タブ -->
    <div class="tabs">
      <button :class="{ active: filter === 'all' }" @click="filter = 'all'">一覧</button>
      <button :class="{ active: filter === 'likes' }" @click="filter = 'likes'">いいね</button>
      <button :class="{ active: filter === 'following' }" @click="filter = 'following'">フォロー中</button>
    </div>
    <hr />

    <!-- 投稿リスト -->
    <div class="timeline">
      <ul v-if="filteredTimeline.length">
        <li v-for="post in filteredTimeline" :key="post.id">
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
const message = ref('');
const filter = ref('all');

const token = ref(localStorage.getItem('token'));
const currentUser = ref(token.value ? jwtDecode(token.value) : null);

const fetchTimeline = async () => {
  try {
    const res = await fetch('http://localhost:3001/api/posts/timeline');
    const data = await res.json();
    if (!res.ok) throw new Error('タイムラインの読み込みに失敗しました。');
    timeline.value = data;
  } catch {
    timeline.value = [];
  }
};

const handleDelete = async (postId) => {
  if (!confirm('本当にこの投稿を削除しますか？')) return;
  try {
    const res = await fetch(`http://localhost:3001/api/posts/${postId}`, {
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

const filteredTimeline = computed(() => {
  if (filter.value === 'all') return timeline.value;
  if (filter.value === 'likes') return timeline.value.filter(post => post.likes && post.likes.includes(currentUser.value.id));
  if (filter.value === 'following') return timeline.value.filter(post => post.authorFollowed);
  return timeline.value;
});

const emptyMessage = computed(() => {
  if (filter.value === 'all') return '投稿はありません';
  if (filter.value === 'likes') return 'いいねした投稿はありません';
  if (filter.value === 'following') return 'フォローしたアカウントの投稿はありません';
  return '';
});

onMounted(() => {
  // サンプル投稿を直接追加
  timeline.value = [
    { id: 1, author: '山田太郎', content: '花散るや　風にまかせて　時は過ぐ' },
    { id: 2, author: '佐藤花子', content: '月明かり　影を照らして　夜は静か' }
  ];
});
</script>

<style scoped>
.page-container {
  max-width: 600px;
  margin: 0 auto;
  padding-bottom: 80px; /* 下部バーと重ならないように */
}

/* ページタイトル中央配置 */
.page-title {
  text-align: center;
  margin: 20px 0 5px;
  font-size: 1.5em;
}

/* 上部タブ */
.tabs {
  display: flex;
  justify-content: space-around; /* タブを左右均等に配置 */
  margin: 10px 0;
}
.tabs button {
  flex-grow: 1;           /* 均等に幅を分ける */
  text-align: center;     /* ボタン内の文字は中央寄せ */
  background: none;
  border: none;
  font-weight: bold;
  color: #555;
  cursor: pointer;
  padding: 8px 0;
  position: relative;
}

/* タブの間に縦線を追加（最後のボタンには表示しない） */
.tabs button:not(:last-child)::after {
  content: "|";
  position: absolute;
  right: 0;
  color: #ccc;
}

/* アクティブタブ */
.tabs button.active {
  color: #007bff;
}

/* タイムライン */
.timeline ul {
  list-style: none;
  padding: 0;
}
.timeline li {
  border-bottom: 1px solid #eee;
  padding: 15px 0;
}

/* 投稿がない場合のメッセージ */
.empty-message {
  text-align: center;
  color: #888;
  margin-top: 20px;
}
</style>

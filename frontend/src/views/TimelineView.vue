<script setup>
import { ref, computed, onMounted } from 'vue';
import { jwtDecode } from 'jwt-decode';
import PostCard from '../components/PostCard.vue'; // PostCardコンポーネントをインポート

const timeline = ref([]);
const message = ref('');
const filter = ref('all'); // フィルタリングの状態 ('all', 'likes', 'following')

const token = ref(localStorage.getItem('token'));
const currentUser = ref(token.value ? jwtDecode(token.value) : null);

// バックエンドからタイムラインデータを取得する関数
const fetchTimeline = async () => {
  try {
    const res = await fetch('http://localhost:3001/api/posts/timeline');
    const data = await res.json();
    if (!res.ok) throw new Error('タイムラインの読み込みに失敗しました。');
    timeline.value = data;
  } catch (err) {
    message.value = err.message || 'データの取得中にエラーが発生しました。';
    timeline.value = []; // エラー時は空にする
  }
};

// 投稿削除処理の関数
const handleDelete = async (postId) => {
  if (!confirm('本当にこの投稿を削除しますか？')) return;
  try {
    const res = await fetch(`http://localhost:3001/api/posts/${postId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token.value}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '削除に失敗しました。');
    // UIから削除された投稿を除外
    timeline.value = timeline.value.filter(post => post.id !== postId);
    message.value = data.message;
  } catch (err) {
    message.value = err.message;
  }
};

// フィルタリングされたタイムラインを計算する算出プロパティ
const filteredTimeline = computed(() => {
  if (filter.value === 'all') {
    return timeline.value;
  }
  // 注意: 'likes' と 'following' のフィルタリングロジックは、
  // バックエンドAPIが対応するデータを返すようになってから実装する必要があります。
  if (filter.value === 'likes') {
    // 仮のフィルタリング (実際には `post.likedByMe` のようなプロパティを使う)
    // return timeline.value.filter(post => post.likes && post.likes.includes(currentUser.value.id));
    return []; // 未実装のため空を返す
  }
  if (filter.value === 'following') {
    // 仮のフィルタリング (実際には `post.authorIsFollowed` のようなプロパティを使う)
    // return timeline.value.filter(post => post.authorFollowed);
     return []; // 未実装のため空を返す
  }
  return timeline.value;
});

// 投稿がない場合に表示するメッセージ
const emptyMessage = computed(() => {
  if (filter.value === 'all' && filteredTimeline.value.length === 0) return '投稿はまだありません。';
  if (filter.value === 'likes' && filteredTimeline.value.length === 0) return 'いいねした投稿はありません。';
  if (filter.value === 'following' && filteredTimeline.value.length === 0) return 'フォロー中のユーザーの投稿はありません。';
  return '';
});

// コンポーネントがマウントされた時にタイムラインデータを取得
onMounted(() => {
  fetchTimeline();
});
</script>

<template>
  <div class="page-container">
    <h1 class="page-title">🎍川柳SNS🎍</h1>
    <hr />
    <p v-if="message" class="error-message">{{ message }}</p> <div class="tabs">
      <button :class="{ active: filter === 'all' }" @click="filter = 'all'">一覧</button>
      <button :class="{ active: filter === 'likes' }" @click="filter = 'likes'">いいね</button>
      <button :class="{ active: filter === 'following' }" @click="filter = 'following'">フォロー中</button>
    </div>
    <hr />

    <div class="timeline">
      <ul v-if="filteredTimeline.length > 0">
        <li v-for="post in filteredTimeline" :key="post.id">
          <PostCard :post="post" :currentUser="currentUser" @delete="handleDelete" />
        </li>
      </ul>
      <p v-else class="empty-message">{{ emptyMessage }}</p>
    </div>
  </div>
</template>

<style scoped>
.page-container {
  max-width: 600px;
  margin: 0 auto;
  padding-bottom: 80px; /* 下部タブバーと重ならないように */
}

.page-title {
  text-align: center;
  margin: 20px 0 5px;
  font-size: 1.5em;
  font-weight: bold;
}

.error-message {
  color: red;
  text-align: center;
  margin-bottom: 10px;
}

.tabs {
  display: flex;
  justify-content: space-around;
  margin: 10px 0;
}
.tabs button {
  flex-grow: 1;
  text-align: center;
  background: none;
  border: none;
  font-weight: bold;
  color: #555;
  cursor: pointer;
  padding: 8px 0;
  position: relative;
  font-size: 0.9em;
}

.tabs button:not(:last-child)::after {
  content: "|";
  position: absolute;
  right: 0;
  color: #ccc;
}

.tabs button.active {
  color: #007bff;
  /* アクティブなタブの下線など */
  border-bottom: 2px solid #007bff;
}

.timeline ul {
  list-style: none;
  padding: 0;
}
.timeline li {
  /* PostCardにスタイルを任せるため、li自体のスタイルは最小限に */
  margin-bottom: 15px;
}

.empty-message {
  text-align: center;
  color: #888;
  margin-top: 30px;
  padding: 20px;
}
</style>
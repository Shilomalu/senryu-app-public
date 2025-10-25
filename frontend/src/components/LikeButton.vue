<template>
  <div class="like-wrapper">
    <button class="like-button" @click="toggleLike">
      <span v-if="liked">💮</span>
      <span v-else>💠</span>
      <span class="label">{{ liked ? 'いいね済み' : 'いいね' }}</span>
      <span class="count">{{ likeCount }}</span>
    </button>

    <!-- 誰がいいねしたかを見る欄 -->
    <button class="show-likes-btn" @click="toggleLikeList" v-if="likeCount > 0">
      👁 いいねした人を見る
    </button>

    <!-- モーダル or ドロップダウン風リスト -->
    <div v-if="showLikeList" class="like-list">
      <p v-if="!likedUsers.length" class="empty">まだ誰もいいねしていません</p>
      <ul v-else>
        <li v-for="user in likedUsers" :key="user.id">
          {{ user.name || user.username || `ユーザー${user.id}` }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, watch } from 'vue';

const props = defineProps({
  postId: { type: Number, required: true },
  currentUserId: { type: Number, required: true },
  initialLiked: { type: Boolean, default: false },
  initialLikeCount: { type: [Number, String], default: 0 }
});

const emit = defineEmits(['like-toggled', 'update-likes']);

// --- 状態管理 ---
const liked = ref(props.initialLiked);
const likeCount = ref(Number(props.initialLikeCount) || 0);
const likedUsers = ref([]);       // 誰がいいねしたかのリスト
const showLikeList = ref(false);  // 一覧表示の開閉

// --- 初期ロード ---
const fetchLikedUsers = async () => {
  try {
    const res = await fetch(`/api/posts/${props.postId}/likes`);
    if (!res.ok) throw new Error('いいね情報の取得に失敗しました');
    likedUsers.value = await res.json();
  } catch (err) {
    console.error(err);
  }
};

// --- 開いたときに一覧を取得 ---
const toggleLikeList = async () => {
  showLikeList.value = !showLikeList.value;
  if (showLikeList.value && !likedUsers.value.length) {
    await fetchLikedUsers();
  }
};

// --- いいねの切り替え ---
const toggleLike = async () => {
  liked.value = !liked.value;
  likeCount.value += liked.value ? 1 : -1;

  try {
    const res = await fetch(`/api/posts/${props.postId}/like`, {
      method: liked.value ? 'POST' : 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: props.currentUserId })
    });

    if (!res.ok) throw new Error('いいねの更新に失敗しました');

    // 親に更新通知（タイムラインのフィルタに反映させる）
    emit('like-toggled', { postId: props.postId, liked: liked.value });
    emit('update-likes', { postId: props.postId, liked: liked.value });
  } catch (err) {
    console.error(err);
  }

  // 最新のいいねリストを再取得
  fetchLikedUsers();
};

// --- postIdが変わったらリスト更新 ---
watch(() => props.postId, fetchLikedUsers);
</script>

<style scoped>
.like-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.like-button {
  background: none;
  border: 1px solid #ccc;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 6px;
}

.like-button:hover {
  background-color: #f9f9f9;
}

.show-likes-btn {
  font-size: 13px;
  color: #007bff;
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
}

.show-likes-btn:hover {
  text-decoration: underline;
}

.like-list {
  margin-top: 4px;
  border: 1px solid #ccc;
  border-radius: 6px;
  background-color: #fff;
  padding: 8px;
  max-height: 120px;
  overflow-y: auto;
  width: 160px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.like-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.like-list li {
  font-size: 14px;
  padding: 2px 0;
  border-bottom: 1px solid #eee;
}

.like-list li:last-child {
  border-bottom: none;
}

.empty {
  font-size: 13px;
  color: #777;
}
</style>

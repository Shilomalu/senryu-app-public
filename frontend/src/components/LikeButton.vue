<template>
  <div class="like-wrapper">
    <button class="like-button" @click="toggleLike">
      <span v-if="liked">🌸</span>
      <span v-else>💠</span>
      <span class="label">{{ liked ? 'いとをかし済み' : 'いとをかし' }}</span>
      <span class="count">{{ likeCount }}</span>
    </button>

    <button class="show-likes-btn" @click="toggleLikeList" v-if="likeCount > 0">
      👁 いとをかしした人を見る
    </button>

    <div v-if="showLikeList" class="like-list">
      <p v-if="!likedUsers.length" class="empty">まだ誰もいとをかししていません</p>
      <ul v-else>
        <li v-for="user in likedUsers" :key="user.id">
          {{ user.name || user.username || `ユーザー${user.id}` }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, onMounted, onUnmounted, watch } from 'vue';

const props = defineProps({
  postId: { type: Number, required: true },
  currentUserId: { type: Number, required: true }
});
const emit = defineEmits(['like-toggled', 'update-likes']);

const liked = ref(false);
const likeCount = ref(0);
const likedUsers = ref([]);
const showLikeList = ref(false);
let socket = null;

// --- APIから現在の状態を取得 ---
const fetchLikeStatus = async () => {
  try {
    const res = await fetch(`/api/posts/${props.postId}/likes/status?userId=${props.currentUserId}`);
    const data = await res.json();
    liked.value = data.liked;
    likeCount.value = data.count;
    likedUsers.value = data.users;
  } catch (err) {
    console.error('状態取得失敗:', err);
  }
};

// --- ユーザー一覧取得 ---
const fetchLikedUsers = async () => {
  try {
    const res = await fetch(`/api/posts/${props.postId}/likes`);
    likedUsers.value = await res.json();
  } catch (err) {
    console.error('一覧取得失敗:', err);
  }
};

const toggleLikeList = async () => {
  showLikeList.value = !showLikeList.value;
  if (showLikeList.value && !likedUsers.value.length) await fetchLikedUsers();
};

// --- いいね処理 ---
const toggleLike = async () => {
  liked.value = !liked.value;
  likeCount.value += liked.value ? 1 : -1;

  try {
    await fetch(`/api/posts/${props.postId}/like`, {
      method: liked.value ? 'POST' : 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: props.currentUserId })
    });

    emit('like-toggled', { postId: props.postId, liked: liked.value });
    emit('update-likes', { postId: props.postId, liked: liked.value });
  } catch (err) {
    console.error('いとをかし送信失敗:', err);
  }
};

// --- WebSocket接続 ---
const connectSocket = () => {
  socket = new WebSocket(`wss://your-server-domain/ws/posts/${props.postId}`);

  socket.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.type === 'like_update' && msg.postId === props.postId) {
      likeCount.value = msg.count;
      likedUsers.value = msg.users;
    }
  };

  socket.onopen = () => console.log('WebSocket接続成功');
  socket.onclose = () => console.log('WebSocket切断');
};

// --- ライフサイクル管理 ---
onMounted(() => {
  fetchLikeStatus();
  connectSocket();
});
onUnmounted(() => {
  if (socket) socket.close();
});
watch(() => props.postId, fetchLikeStatus);
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
.like-button:hover { background-color: #f9f9f9; }
.show-likes-btn {
  font-size: 13px;
  color: #007bff;
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
}
.show-likes-btn:hover { text-decoration: underline; }
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
.like-list ul { list-style: none; padding: 0; margin: 0; }
.like-list li {
  font-size: 14px;
  padding: 2px 0;
  border-bottom: 1px solid #eee;
}
.like-list li:last-child { border-bottom: none; }
.empty { font-size: 13px; color: #777; }
</style>

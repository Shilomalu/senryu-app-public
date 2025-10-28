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
import { ref, defineProps, defineEmits, onMounted, watch } from 'vue';

const props = defineProps({
  postId: { type: Number, required: true },
  currentUserId: { type: Number, required: true }
});

const emit = defineEmits(['like-toggled', 'update-likes']);

const liked = ref(false);
const likeCount = ref(0);
const likedUsers = ref([]);
const showLikeList = ref(false);

// --- 初期化 ---
const fetchLikeStatus = async () => {
  try {
    const res = await fetch(`/api/posts/${props.postId}/likes/status?userId=${props.currentUserId}`);
    if (!res.ok) throw new Error('いとをかし情報の取得に失敗しました');
    const data = await res.json();
    liked.value = data.liked;
    likeCount.value = data.count;
    likedUsers.value = data.users;
  } catch (err) {
    console.error(err);
  }
};

const fetchLikedUsers = async () => {
  try {
    const res = await fetch(`/api/posts/${props.postId}/likes`);
    if (!res.ok) throw new Error('いとをかし一覧の取得に失敗しました');
    likedUsers.value = await res.json();
  } catch (err) {
    console.error(err);
  }
};

const toggleLikeList = async () => {
  showLikeList.value = !showLikeList.value;
  if (showLikeList.value && !likedUsers.value.length) {
    await fetchLikedUsers();
  }
};

// --- いとをかし切り替え ---
const toggleLike = async () => {
  liked.value = !liked.value;
  likeCount.value += liked.value ? 1 : -1;

  try {
    const res = await fetch(`/api/posts/${props.postId}/like`, {
      method: liked.value ? 'POST' : 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: props.currentUserId })
    });
    if (!res.ok) throw new Error('いとをかし更新に失敗しました');

    // サーバーから最新 likes 配列を取得
    const data = await res.json();
    likedUsers.value = data.users;
    likeCount.value = data.count;

    // タブ表示用に親に通知
    emit('update-likes', { postId: props.postId, liked: liked.value, users: likedUsers.value });

  } catch (err) {
    console.error(err);
    liked.value = !liked.value;
    likeCount.value += liked.value ? 1 : -1;
  }
};

// --- マウント時に状態を取得 ---
onMounted(fetchLikeStatus);
watch(() => props.postId, fetchLikeStatus);
</script>

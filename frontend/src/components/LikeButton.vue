<script setup>
import { ref, defineProps, defineEmits } from 'vue';

// 親から渡されるprops
const props = defineProps({
  postId: Number,           // 投稿ID
  initialLiked: Boolean,    // 初期いいね状態
  currentUserId: Number,    // 現在のユーザーID
  initialLikeCount: Number  // 初期いいね件数
});

// 親にイベントを送るためのemit
const emit = defineEmits(['like-toggled']);

// いいね状態
const liked = ref(props.initialLiked);
// いいね件数
const likeCount = ref(props.initialLikeCount);

// いいねボタンを押したときの処理
function toggleLike() {
  liked.value = !liked.value;

  // いいね件数を増減
  likeCount.value += liked.value ? 1 : -1;

  // APIに反映（必要ならサーバー側と同期）
  fetch(`/api/posts/${props.postId}/like`, {
    method: liked.value ? 'POST' : 'DELETE'
  });

  // 親コンポーネントに状態を通知
  emit('like-toggled', { postId: props.postId, liked: liked.value });
}
</script>

<template>
  <button class="like-button" @click="toggleLike">
    <span v-if="liked">💮</span>
    <span v-else>💠</span>
    <span class="label">{{ liked ? 'いいね済み' : 'いいね' }}</span>
    <span class="count">{{ likeCount }}</span>
  </button>
</template>

<style scoped>
.like-button {
  background: none;
  border: 1px solid #ccc;
  padding: 5px 10px;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.label {
  font-size: 14px;
}
.count {
  font-size: 14px;
  color: #555;
}
</style>

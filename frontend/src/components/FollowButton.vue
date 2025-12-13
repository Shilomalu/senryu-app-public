<template>
  <div class="follow-wrapper">
    <div 
      class="follow-button-fixed-width"
      v-if="props.targetUserId !== props.currentUserId"
    >
      <button 
        class="follow-button" 
        @click="toggleFollow"
        :class="{ 'follow-blue': !isFollowing }"  >
        <span v-if="isFollowing">文友 済み</span>
        <span v-else>文友になる</span>
      </button>
    </div>

    <button class="show-followers-btn common-btn" @click="goToFollowersList">
      文友を見る
      <span class="count">{{ followerCount }}</span>
    </button>

  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps({
  targetUserId: { type: Number, required: true },   // フォロー対象
  currentUserId: { type: Number, required: true }   // 現在のログインユーザー
});
const emit = defineEmits(['follow-toggled', 'update-followers']);
const router = useRouter();
const isFollowing = ref(false);
const followerCount = ref(0);
let socket = null;

// ルーターの'followers'ルートに遷移
const goToFollowersList = () => {
  router.push({ name: 'followers', params: { id: props.targetUserId } });
};

// --- 現在のフォロー状態を取得 ---
const fetchFollowStatus = async () => {
  try {
    const res = await fetch(`/api/users/${props.targetUserId}/followers/status?userId=${props.currentUserId}`);
    const data = await res.json();
    isFollowing.value = data.following;
    followerCount.value = data.count;
  } catch (err) {
    console.error('文友状態取得失敗:', err);
  }
};

// --- フォロー/解除処理 ---
const toggleFollow = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
      console.error('認証トークンがありません。');
      isFollowing.value = !isFollowing.value;
      followerCount.value += isFollowing.value ? -1 : 1;
      return;
  }

  isFollowing.value = !isFollowing.value;
  followerCount.value += isFollowing.value ? 1 : -1;

  try {
    await fetch(`/api/users/${props.targetUserId}/follow`, {
      method: isFollowing.value ? 'POST' : 'DELETE',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
    });

    emit('follow-toggled', { targetUserId: props.targetUserId, following: isFollowing.value });
    emit('update-followers', { targetUserId: props.targetUserId, following: isFollowing.value });
  } catch (err) {
    console.error('フォロー処理失敗:', err);
    isFollowing.value = !isFollowing.value;
    followerCount.value += isFollowing.value ? -1 : 1;
  }
};

// --- ライフサイクル ---
onMounted(() => {
  fetchFollowStatus();
});
watch(() => props.targetUserId, fetchFollowStatus);
</script>

<style scoped>
.follow-wrapper {
  display: flex;
  flex-direction: column; 
  align-items: flex-end; 
  gap: 4px; 
  margin-left: auto; 
}

.follow-button-fixed-width {
    width: 110px; 
    text-align: center;
}

.follow-button {
  padding: 4px 8px; 
  font-size: 0.8rem; 
  border-radius: 4px; 
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px; 
  white-space: nowrap;
  width: 100%; 
  box-sizing: border-box; 
  
  /* 「フォロー中」のスタイル */
  background: none; 
  border: 1px solid #ccc; 
  color: #000; 
  cursor: pointer;
}

.follow-button:hover { 
  background-color: #f0f0f0; 
}

.follow-blue {
    background-color: #007bff;
    border: 1px solid #007bff;
    color: #ffffff;
    font-weight: bold;
}

.follow-blue:hover {
    background-color: #0056b3;
    border-color: #0056b3;
}

.show-followers-btn {
  padding: 4px 8px;
  font-size: 0.8rem;
  border-radius: 4px;
  white-space: nowrap;
  width: 110px; 
  box-sizing: border-box;
  display: flex; 
  align-items: center; 
  justify-content: center; 
}

.count {
    margin-left: 3px;
    background-color: rgba(255, 255, 255, 0.3); 
    color: white; 
    padding: 1px 4px;
    border-radius: 8px;
    font-size: 0.6em;
}
</style>
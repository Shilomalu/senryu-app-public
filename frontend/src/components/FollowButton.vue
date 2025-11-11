<template>
  <div class="follow-wrapper">
    <button class="follow-button" @click="toggleFollow">
      <span v-if="isFollowing">🌿 フォロー中</span>
      <span v-else>🌱 フォロー</span>
      <span class="count">{{ followerCount }}</span>
    </button>

    <button class="show-followers-btn" @click="toggleFollowerList" v-if="followerCount > 0">
      👁 フォロワーを見る
    </button>

    <div v-if="showFollowerList" class="follower-list">
      <p v-if="!followers.length" class="empty">まだフォロワーはいません</p>
      <ul v-else>
        <li v-for="user in followers" :key="user.id">
          {{ user.name || user.username || `ユーザー${user.id}` }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, onMounted, onUnmounted, watch } from 'vue';

const props = defineProps({
  targetUserId: { type: Number, required: true },   // フォロー対象
  currentUserId: { type: Number, required: true }   // 現在のログインユーザー
});
const emit = defineEmits(['follow-toggled', 'update-followers']);

const isFollowing = ref(false);
const followerCount = ref(0);
const followers = ref([]);
const showFollowerList = ref(false);
let socket = null;

// --- 現在のフォロー状態を取得 ---
const fetchFollowStatus = async () => {
  try {
    const res = await fetch(`/api/users/${props.targetUserId}/followers/status?userId=${props.currentUserId}`);
    const data = await res.json();
    isFollowing.value = data.following;
    followerCount.value = data.count;
    followers.value = data.users;
  } catch (err) {
    console.error('フォロー状態取得失敗:', err);
  }
};

// --- フォロワー一覧取得 ---
const fetchFollowers = async () => {
  try {
    const res = await fetch(`/api/users/${props.targetUserId}/followers`);
    followers.value = await res.json();
  } catch (err) {
    console.error('フォロワー一覧取得失敗:', err);
  }
};

const toggleFollowerList = async () => {
  showFollowerList.value = !showFollowerList.value;
  if (showFollowerList.value && !followers.value.length) await fetchFollowers();
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
  align-items: flex-start;
  gap: 4px;
}
.follow-button {
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
.follow-button:hover { background-color: #f9f9f9; }
.show-followers-btn {
  font-size: 13px;
  color: #007bff;
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
}
.show-followers-btn:hover { text-decoration: underline; }
.follower-list {
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
.follower-list ul { list-style: none; padding: 0; margin: 0; }
.follower-list li {
  font-size: 14px;
  padding: 2px 0;
  border-bottom: 1px solid #eee;
}
.follower-list li:last-child { border-bottom: none; }
.empty { font-size: 13px; color: #777; }
</style>

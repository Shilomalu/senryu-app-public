<template>
  <div class="like-wrapper">
    <button @click="toggleLike" :class="['like-button', liked ? 'liked' : '']">
      <span v-if="liked">🌸 いとをかし済み</span>
      <span v-else>💠 いとをかし</span>
      <span class="count">{{ likeCount }}</span>
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const emit = defineEmits(['like-updated'])

const props = defineProps({
  postId: { type: Number, required: true }
})

const liked = ref(false)
const likeCount = ref(0)

const auth = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
})

const fetchStatus = async () => {
  try {
    const res = await axios.get(`/api/posts/${props.postId}/likes/status`, auth())
    liked.value = res.data.liked
    likeCount.value = res.data.count
  } catch {}
}

const toggleLike = async () => {
  const previous = { liked: liked.value, likeCount: likeCount.value }

  // UI即時更新（楽観的更新）
  if (!liked.value) {
    liked.value = true
    likeCount.value++
    axios.post(`/api/posts/${props.postId}/like`, {}, auth())
      .catch(() => Object.assign(liked, previous))
  } else {
    liked.value = false
    likeCount.value--
    axios.delete(`/api/posts/${props.postId}/like`, auth())
      .catch(() => Object.assign(liked, previous))
  }

  // ✅ いいねが更新されたことを親に通知
  emit('like-updated')
}

onMounted(fetchStatus)
</script>

<style scoped>
.like-button {
  cursor: pointer;
  background-color: #eee;
  border: none;
  padding: 6px 10px;
  border-radius: 6px;
  transition: .2s;
}
.like-button.liked { background-color: #ffc0cb; }
.count { margin-left: 5px; font-weight: bold; }
</style>

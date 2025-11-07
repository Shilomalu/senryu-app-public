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
import { ref, watch } from 'vue'
import axios from 'axios'

const props = defineProps({
  postId: { type: Number, required: true },
  initialLiked: { type: Boolean, default: false },
  initialCount: { type: Number, default: 0 }
})

const emit = defineEmits(['like-updated'])

const liked = ref(props.initialLiked)
const likeCount = ref(props.initialCount)

// props が更新されたら ref を同期
watch(() => props.initialLiked, (newVal) => {
  liked.value = newVal
})
watch(() => props.initialCount, (newVal) => {
  likeCount.value = newVal
})

const auth = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
})

const toggleLike = async () => {
  const previous = { liked: liked.value, likeCount: likeCount.value }

  if (!liked.value) {
    liked.value = true
    likeCount.value++
    axios.post(`/api/posts/${props.postId}/like`, {}, auth())
      .catch(() => {
        liked.value = previous.liked
        likeCount.value = previous.likeCount
      })
  } else {
    liked.value = false
    likeCount.value--
    axios.delete(`/api/posts/${props.postId}/like`, auth())
      .catch(() => {
        liked.value = previous.liked
        likeCount.value = previous.likeCount
      })
  }

  emit('like-updated')
}
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

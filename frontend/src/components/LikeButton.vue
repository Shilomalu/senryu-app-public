<template>
  <div class="like-wrapper">
    <button @click="toggleLike" :class="['like-button', liked ? 'liked' : '']">
      <span v-if="liked">🌸 いとをかし</span>
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
  currentUserId: { type: Number, default: 0 },
  initialIsLiked: { type: Boolean, default: false },      // PostCardから受け取る名前に合わせる
  initialLikesCount: { type: Number, default: 0 }        // PostCardから受け取る名前に合わせる
})

const emit = defineEmits(['like-updated'])

const liked = ref(props.initialIsLiked)
const likeCount = ref(props.initialLikesCount)

// props が更新されたら ref を同期
watch(() => props.initialIsLiked, (newVal) => liked.value = newVal)
watch(() => props.initialLikesCount, (newVal) => likeCount.value = newVal)

const auth = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
})

const toggleLike = async () => {
  const previous = { liked: liked.value, likeCount: likeCount.value }

  try {
    if (!liked.value) {
      liked.value = true
      likeCount.value++
      await axios.post(`/api/posts/${props.postId}/like`, {}, auth())
    } else {
      liked.value = false
      likeCount.value--
      await axios.delete(`/api/posts/${props.postId}/like`, auth())
    }
    emit('like-updated', props.postId, liked.value, likeCount.value)
  } catch {
    liked.value = previous.liked
    likeCount.value = previous.likeCount
  }
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

<template>
  <div class="like-wrapper">
    <button @click="toggleLike" :class="['like-button', liked ? 'liked' : '']">
      <span v-if="liked">🌸 いとをかし済み</span>
      <span v-else>💠 いとをかし</span>
      <span class="count">{{ likeCount }}</span>
    </button>

    <div v-if="users?.length > 0" class="like-users">
      <small>いいねしたユーザー: {{ users.map(u => u.username).join(', ') }}</small>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import axios from 'axios'

export default {
  name: 'LikeButton',
  props: {
    postId: {
      type: Number,
      required: true
    }
  },
  setup(props) {
    const liked = ref(false)
    const likeCount = ref(0)
    const users = ref([])

    const token = localStorage.getItem('token')
    const config = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }

    // 初期状態取得
    const fetchLikeStatus = async () => {
      try {
        const res = await axios.get(`/api/posts/${props.postId}/likes/status`, config)
        liked.value = res.data.liked
        likeCount.value = res.data.count || 0
        users.value = res.data.users || []
      } catch (err) {
        console.error('いいね状態取得エラー:', err)
      }
    }

    const toggleLike = async () => {
      try {
        let res
        if (!liked.value) {
          res = await axios.post(`/api/posts/${props.postId}/like`, {}, config)
          liked.value = true
        } else {
          res = await axios.delete(`/api/posts/${props.postId}/like`, config)
          liked.value = false
        }
        likeCount.value = res.data.count || 0
        users.value = res.data.users || []
      } catch (err) {
        console.error('いいね切り替えエラー:', err)
        alert('いいねできませんでした。')
      }
    }

    onMounted(() => {
      fetchLikeStatus()
    })

    return { liked, likeCount, users, toggleLike }
  }
}
</script>

<style scoped>
.like-wrapper {
  margin-top: 5px;
}
.like-button {
  cursor: pointer;
  background-color: #f0f0f0;
  border: none;
  padding: 5px 10px;
  border-radius: 5px;
}
.like-button.liked {
  background-color: #ffc0cb;
}
.count {
  margin-left: 5px;
  font-weight: bold;
}
.like-users {
  margin-top: 3px;
  font-size: 0.8em;
  color: #555;
}
</style>

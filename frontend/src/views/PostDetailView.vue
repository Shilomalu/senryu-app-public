<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PostCard from '@/components/PostCard.vue'
import ReplyForm from '@/components/ReplyForm.vue'
import ReplyCard from '@/components/ReplyCard.vue'

const route = useRoute()
const router = useRouter()
const post = ref(null)
const replies = ref([])
const isLoading = ref(true)
const error = ref(null)

// 投稿とリプライを取得
async function fetchPostAndReplies() {
  isLoading.value = true
  error.value = null
  
  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/posts/${route.params.id}`)
    if (!response.ok) {
      throw new Error('投稿の取得に失敗しました')
    }
    
    const data = await response.json()
    post.value = data.post
    replies.value = data.replies
  } catch (err) {
    console.error('投稿取得エラー:', err)
    error.value = '投稿の読み込みに失敗しました'
  } finally {
    isLoading.value = false
  }
}

// リプライが投稿されたときの処理
function handleReplyPosted() {
  fetchPostAndReplies()
}

// リプライが削除されたときの処理
function handleReplyDeleted(replyId) {
  replies.value = replies.value.filter(reply => reply.id !== replyId)
}

// 投稿が削除されたときの処理
function handlePostDeleted() {
  router.push('/')
}

onMounted(() => {
  fetchPostAndReplies()
})
</script>

<template>
  <div class="post-detail">
    <div v-if="isLoading" class="loading">
      読み込み中...
    </div>
    
    <div v-else-if="error" class="error">
      {{ error }}
    </div>
    
    <div v-else>
      <PostCard 
        v-if="post" 
        :post="post" 
        @post-deleted="handlePostDeleted"
      />
      
      <div v-if="post" class="replies-section">
        <h2>返信</h2>
        
        <ReplyForm 
          :post-id="post.id" 
          @reply-posted="handleReplyPosted"
        />
        
        <div v-if="replies.length > 0" class="replies-list">
          <ReplyCard
            v-for="reply in replies"
            :key="reply.id"
            :reply="reply"
            @reply-deleted="handleReplyDeleted"
          />
        </div>
        
        <div v-else class="no-replies">
          まだ返信はありません
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.post-detail {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.error {
  color: #dc3545;
  text-align: center;
  padding: 1rem;
}

.replies-section {
  margin-top: 2rem;
}

.replies-section h2 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.replies-list {
  margin-top: 1rem;
}

.no-replies {
  text-align: center;
  padding: 2rem;
  color: #666;
  background-color: #f8f9fa;
  border-radius: 4px;
}
</style>
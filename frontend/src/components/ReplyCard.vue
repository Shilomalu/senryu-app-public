<script setup>
import { computed } from 'vue'
import { jwtDecode } from 'jwt-decode'

const props = defineProps({
  reply: {
    type: Object,
    required: true
  },
  currentUser: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['reply-deleted'])

const canDelete = computed(() => {
  const token = localStorage.getItem('token')
  if (!token) return false
  try {
    const decoded = jwtDecode(token)
    return decoded.id === props.reply.user_id
  } catch {
    return false
  }
})

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleString('ja-JP')
}

async function handleDelete() {
  if (!confirm('この返信を削除してもよろしいですか？')) return

  try {
    const token = localStorage.getItem('token')
    const response = await fetch(`/api/replies/${props.reply.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('返信の削除に失敗しました')
    }

    emit('reply-deleted', props.reply.id)
  } catch (error) {
    console.error('返信削除エラー:', error)
    alert('返信の削除に失敗しました')
  }
}
</script>

<template>
  <div class="reply-card">
    <div class="reply-header">
      <strong>{{ reply.authorName }}</strong>
      <button 
        v-if="canDelete"
        class="delete-button"
        @click="handleDelete"
      >
        削除
      </button>
    </div>
    <div class="reply-content">
      {{ reply.content }}
    </div>
    <div class="reply-footer">
      <small class="timestamp">{{ formatDate(reply.created_at) }}</small>
    </div>
  </div>
</template>

<style scoped>
.reply-card {
  padding: 1rem;
  border-top: 1px solid #f0f0f0;
  background-color: #fafafa;
  height: 120px; /* 固定高さ（好みで調整） */
  box-sizing: border-box;
  overflow: hidden;
}

.reply-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.reply-content {
  margin-bottom: 0.5rem;
  white-space: pre-wrap;
}

.reply-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.timestamp {
  color: #666;
}

.delete-button {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  color: #dc3545;
  background: none;
  border: 1px solid #dc3545;
  border-radius: 4px;
  cursor: pointer;
}

.delete-button:hover {
  color: white;
  background-color: #dc3545;
}
</style>
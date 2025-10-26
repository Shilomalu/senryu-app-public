<script setup>
import { ref } from 'vue'

const props = defineProps({
  postId: {
    type: [Number, String],
    required: true
  },
  currentUser: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['reply-posted'])
const content = ref('')
const isSubmitting = ref(false)

async function handleSubmit(e) {
  e.preventDefault()
  if (!content.value.trim()) return
  if (isSubmitting.value) return

  isSubmitting.value = true
  try {
    const token = localStorage.getItem('token')
    const response = await fetch(`/api/posts/${props.postId}/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ content: content.value })
    })

    if (!response.ok) {
      throw new Error('返信の投稿に失敗しました')
    }

    content.value = ''
    emit('reply-posted')
  } catch (error) {
    console.error('返信投稿エラー:', error)
    alert('返信の投稿に失敗しました')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <form @submit="handleSubmit" class="reply-form">
    <textarea 
      v-model="content"
      class="reply-input"
      placeholder="返信を入力してください"
      rows="3"
    ></textarea>
    <div class="button-container">
      <button 
        type="submit" 
        class="submit-button" 
        :disabled="isSubmitting || !content.trim()"
      >
        {{ isSubmitting ? '送信中...' : '返信' }}
      </button>
    </div>
  </form>
</template>

<style scoped>
.reply-form {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.reply-input {
  width: 100%;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  resize: vertical;
}

.button-container {
  display: flex;
  justify-content: flex-end;
}

.submit-button {
  padding: 0.375rem 1rem;
  font-size: 1rem;
  color: white;
  background-color: #007bff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.submit-button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.submit-button:not(:disabled):hover {
  background-color: #0056b3;
}
</style>
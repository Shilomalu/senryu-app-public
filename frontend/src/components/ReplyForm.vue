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
const content1 = ref('')
const content2 = ref('')
const content3 = ref('')
const isSubmitting = ref(false)

async function handleSubmit(e) {
  e.preventDefault()
  // require at least one non-empty part
  if (!content1.value.trim() && !content2.value.trim() && !content3.value.trim()) return
  if (isSubmitting.value) return

  isSubmitting.value = true
  try {
    const token = localStorage.getItem('token')
    // combine parts into single content string (same format as posts)
    const combined = `${content1.value.trim()} ${content2.value.trim()} ${content3.value.trim()}`.trim()

    const response = await fetch(`/api/posts/${props.postId}/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ content: combined })
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      const msg = data.error || '返信の投稿に失敗しました'
      throw new Error(msg)
    }

    // clear inputs
    content1.value = ''
    content2.value = ''
    content3.value = ''
    emit('reply-posted')
  } catch (error) {
    console.error('返信投稿エラー:', error)
    alert(error.message || '返信の投稿に失敗しました')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <form @submit="handleSubmit" class="reply-form">
    <div class="reply-inputs">
      <input v-model="content1" type="text" placeholder="上の句（五）" maxlength="10">
      <input v-model="content2" type="text" placeholder="中の句（七）" maxlength="15">
      <input v-model="content3" type="text" placeholder="下の句（五）" maxlength="10">
    </div>
    <div class="button-container">
      <button 
        type="submit" 
        class="submit-button" 
        :disabled="isSubmitting || (!content1.trim() && !content2.trim() && !content3.trim())"
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

.reply-inputs {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 8px;
}

.reply-inputs input {
  padding: 8px;
  font-size: 1rem;
  text-align: center;
  border: 1px solid #ced4da;
  border-radius: 4px;
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
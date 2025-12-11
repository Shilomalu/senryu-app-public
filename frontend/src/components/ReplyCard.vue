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

// ★追加: 本文をスペースで区切って配列にする
// (例) "古池や 蛙飛び込む 水の音" -> ["古池や", "蛙飛び込む", "水の音"]
const poemLines = computed(() => {
  if (!props.reply.content) return []
  // 全角スペースまたは半角スペースで分割し、空文字を除去
  return props.reply.content.trim().split(/[\s　]+/).filter(line => line.length > 0)
})

function formatDate(dateString) {
  const date = new Date(dateString)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

async function handleDelete() {
  if (!confirm('この返句を削除してもよろしいですか？')) return

  try {
    const token = localStorage.getItem('token')
    const response = await fetch(`/api/replies/${props.reply.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('返句の削除に失敗しました')
    }

    emit('reply-deleted', props.reply.id)
  } catch (error) {
    console.error('返句削除エラー:', error)
    alert('返句の削除に失敗しました')
  }
}
</script>

<template>
  <div class="reply-card">
    <div class="card-header">
      <span class="author-name">👤 {{ reply.authorName }}</span>
      <button 
        v-if="canDelete" 
        class="delete-btn" 
        @click="handleDelete"
        title="削除"
      >
        ×
      </button>
    </div>

    <div class="poem-container">
      <div class="poem-text">
        <p 
          v-for="(line, index) in poemLines" 
          :key="index" 
          class="poem-line"
        >
          {{ line }}
        </p>
      </div>
    </div>

    <div class="card-footer">
      <span class="date">{{ formatDate(reply.created_at) }}</span>
    </div>
  </div>
</template>

<style scoped>
.reply-card {
  width: 180px;
  height: 340px;
  background-color: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  margin-right: 10px;
  padding: 12px;
  position: relative;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 30px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 8px;
}

.author-name {
  font-size: 0.85rem;
  font-weight: bold;
  color: #555;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

.delete-btn {
  background: none;
  border: none;
  color: #999;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}
.delete-btn:hover {
  color: #dc3545;
}

.poem-container {
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #fafafa;
  border-radius: 4px;
  padding: 10px;
  overflow: hidden; /* はみ出し防止 */
}

.poem-text {
  writing-mode: vertical-rl; /* 縦書き・右から左へ改行 */
  text-orientation: upright;
  font-family: "Yu Mincho", "Hiragino Mincho ProN", serif;
  font-size: 1.1rem;
  line-height: 1.8;
  color: #333;
  
  height: 100%;
  width: 100%;
  
  /* フレックスボックスで配置調整 */
  display: flex;
  flex-direction: column; /* 縦書きモードでのcolumnは「右から左」への並び順になります */
  justify-content: center; /* 左右中央（縦書きモードの主軸方向） */
  align-items: center;     /* 上下中央（縦書きモードの交差軸方向） */
  flex-wrap: wrap;         /* 長すぎる場合に折り返しを許可するかどうか */
  gap: 0.8rem;             /* 行間の隙間 */
}

/* ★追加: 各行のスタイル */
.poem-line {
  margin: 0;
  padding: 0;
  white-space: nowrap; /* 行内での折返しを禁止 */
}

.card-footer {
  height: 20px;
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
  margin-top: 5px;
}

.date {
  font-size: 0.75rem;
  color: #aaa;
}
</style>
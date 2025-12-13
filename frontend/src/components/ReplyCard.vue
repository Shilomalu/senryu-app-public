<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { jwtDecode } from 'jwt-decode'

// ★アイコンリソースのインポート（PostCardと同じ設定）
import icon0 from "@/assets/icons/kajinsample0.jpeg"
import icon1 from "@/assets/icons/kajinsample1.jpeg"
import icon2 from "@/assets/icons/kajinsample2.jpeg"
import icon3 from "@/assets/icons/kajinsample3.jpeg"
import icon4 from "@/assets/icons/kajinsample4.jpeg"
import icon5 from "@/assets/icons/kajinsample5.jpeg"
import icon6 from "@/assets/icons/kajinsample6.jpeg"
import icon7 from "@/assets/icons/kajinsample7.jpeg"
import icon8 from "@/assets/icons/kajinsample8.jpeg"
import icon9 from "@/assets/icons/kajinsample9.jpeg"
import icon10 from "@/assets/icons/kajinsample10.jpeg"
import icon11 from "@/assets/icons/kajinsample11.jpeg"

const icons = [
  { id: 0, src: icon0 },
  { id: 1, src: icon1 },
  { id: 2, src: icon2 },
  { id: 3, src: icon3 },
  { id: 4, src: icon4 },
  { id: 5, src: icon5 },
  { id: 6, src: icon6 },
  { id: 7, src: icon7 },
  { id: 8, src: icon8 },
  { id: 9, src: icon9 },
  { id: 10, src: icon10 },
  { id: 11, src: icon11 }
];

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
const router = useRouter()

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

const goToProfile = () => {
  if (props.reply.user_id) {
    router.push(`/users/${props.reply.user_id}`)
  }
}

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
      <button class="author-btn" @click="goToProfile">
        <img :src="icons[reply.icon_index]?.src || icons[0].src" class="profile-icon" />
        <span class="author-name">{{ reply.authorName || '名無し' }}</span>
      </button>

      <button 
        v-if="canDelete" 
        class="delete-btn" 
        @click="handleDelete"
        title="削除"
      >
        ×
      </button>
    </div>

    <div class="poem-wrapper">
      <div class="poem">
        <template v-if="reply.ruby_content && reply.ruby_content.length">
          <div v-for="(phrase, pIndex) in reply.ruby_content" :key="pIndex" class="post-line">
            <span v-for="(ruby_data, wIndex) in phrase" :key="wIndex" class="word-unit">
              <ruby>{{ ruby_data.word }}<rt>{{ ruby_data.ruby }}</rt></ruby>
            </span>
          </div>
        </template>
        
        <template v-else>
           <p class="post-line">{{ reply.content }}</p>
        </template>
      </div>
    </div>

    <div class="card-footer">
      <span class="date">{{ formatDate(reply.created_at) }}</span>
    </div>
  </div>
</template>

<style scoped>
.reply-card {
  width: 180px;   /* 幅を固定（変更なし） */
  height: 340px;  /* 高さを固定（変更なし） */
  background-color: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  margin-right: 10px;
  padding: 10px;
  position: relative;
}

/* ヘッダー周り */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  height: 36px; /* アイコンサイズに合わせて調整 */
}

.author-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  overflow: hidden;
}

.profile-icon {
  width: 32px;
  height: 32px;
  object-fit: cover;
  border-radius: 50%;
  border: 1px solid #ccc;
  flex-shrink: 0;
}

.author-name {
  font-size: 0.75rem;
  font-weight: bold;
  color: #555;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 90px;
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

/* 川柳表示エリア */
.poem-wrapper {
  flex-grow: 1;
  width: 100%;
  background-color: #fafafa;
  border-radius: 4px;
  padding: 0.5rem;
  box-sizing: border-box;
  
  /* 中央揃え設定 */
  display: flex;
  justify-content: center; /* 左右中央（行の配置） */
  align-items: center;     /* 上下中央（コンテンツ） */
  overflow: hidden;
}

/* 川柳本文 */
.poem {
  writing-mode: vertical-rl;
  text-orientation: upright;
  font-family: "Hiragino Mincho ProN", serif;
  font-size: 16px; /* 幅180pxに収まるサイズ */
  line-height: 1.8;
  
  display: flex;
  flex-direction: column;
  align-items: center;    /* 各行を中央揃え */
  justify-content: center;
  height: 100%;
}

.post-line {
  margin: 0 0 0.4rem 0;
  text-align: center;
  color: #000;
  white-space: nowrap;
}

.word-unit {
  display: inline-block;
}

ruby {
  ruby-position: over;
}

rt {
  font-size: 0.5em;
  color: #555;
  text-align: center;
  margin-bottom: -0.4em;
}

/* フッター */
.card-footer {
  height: 20px;
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
  margin-top: 5px;
}

.date {
  font-size: 0.7rem;
  color: #aaa;
}
</style>
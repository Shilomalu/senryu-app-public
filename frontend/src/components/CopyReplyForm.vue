<script setup>
import { ref, reactive } from 'vue'
import { analyzeText } from '../composables/useAnalyzeText.js'

const props = defineProps({
  postId: {
    type: [Number, String],
    required: true
  }
})

const emit = defineEmits(['reply-posted'])

const phrases = reactive([
  { text: '', ruby_data: [] },
  { text: '', ruby_data: [] },
  { text: '', ruby_data: [] },
]);

const isSubmitting = ref(false);

const handleReply = async () => {
  if (isSubmitting.value) return

  if (!phrases[0].text.trim() || !phrases[1].text.trim() || !phrases[2].text.trim()) {
    return alert("返句をすべて入力してください")
  }

  isSubmitting.value = true

  // ルビ解析を念のためもう一度走らせる（編集後も反映）
  for (let index = 0; index < 3; ++index) {
    if (!phrases[index].ruby_data) {
      await Promise(analyzeText(index, phrases))
    }
  }

  const token = localStorage.getItem('token')

  try {
    const res = await fetch(`/api/posts/${props.postId}/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        content1: phrases[0].text.trim(),
        content2: phrases[1].text.trim(),
        content3: phrases[2].text.trim(),
        ruby_dataset: phrases.map(p => p.ruby_data)
      })
    })

    if (!res.ok) throw new Error("返句投稿に失敗しました")

    // 成功後クリア
    phrases.forEach(p => {
      p.text = ''
      p.ruby_data = []
    })
    emit('reply-posted')
  } catch (err) {
    console.error(err)
    alert(err.message)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <form @submit.prevent="handleReply">
    <div class="input-sections">
      <div v-for="(phrase, index) in phrases" :key="index" class="phrase-group">
        <input
          v-model="phrase.text"
          type="text"
          :placeholder="['五', '七', '五'][index]"
          @change="analyzeText(index, phrases)"
          :maxlength="[10, 15, 10][index]"
          class="main-input"
          @input="phrase.text = 
            phrase.text.replace(/[^\u3041-\u3096\u30A1-\u30F6\u4E00-\u9FFFーー～々。、「」・！？]/g, '')"
        />

        <!-- ▼ ルビ編集エリア (解析結果がある場合のみ表示) ▼ -->
        <div v-if="phrase.ruby_data.length > 0" class="ruby-edit-area">
          <p class="ruby-label">ルビの調整 (漢字のみ)</p>
          <div class="ruby-items">
            <div v-for="(item, i) in phrase.ruby_data" :key="i" class="ruby-item">
              <!-- 単語の表示 -->
              <span class="word-surface">{{ item.word }}</span>
              <!-- ルビ入力欄 (ルビがある場合のみ表示) -->
              <input 
                v-if="item.ruby !== null" 
                v-model="item.ruby" 
                class="ruby-input"
                @input="item.ruby = item.ruby.replace(/[^\u3041-\u3096ーー]/g, '')"
              >
              <span v-else class="no-ruby">-</span>
            </div>
          </div>
        </div>
      </div>
      
      <button class="submit-btn common-btn" :disabled="isSubmitting">
        {{ isSubmitting ? '送信中...' : '返句' }}
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
  height: 200px; /* 固定高さ */
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

.phrase-group {
  margin-bottom: 5px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #eee;
  text-align: left;
}
.phrase-group label {
  font-weight: bold;
  display: block;
  margin-bottom: 8px;
  color: #333;
}
.main-input {
  width: 100%;
  padding: 12px;
  font-size: 1.1em;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
  text-align: center;
}

/* ルビ編集エリア */
.ruby-edit-area {
  margin-top: 12px;
  background-color: #fff;
  padding: 10px;
  border: 1px dashed #ccc;
  border-radius: 4px;
}
.ruby-label {
  font-size: 0.85em;
  color: #666;
  margin-bottom: 8px;
}

.ruby-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}
.ruby-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 30px;
}
.word-surface {
  font-size: 1.0em;
  font-weight: bold;
  margin-bottom: 2px;
}
.ruby-input {
  width: 60px;
  font-size: 0.8em;
  text-align: center;
  padding: 2px;
  border: 1px solid #ddd;
  border-radius: 3px;
}
.no-ruby {
  font-size: 0.8em;
  color: #ccc;
  padding: 2px 0;
}
.submit-btn {
  width: 100%;
  padding: 12px;
  margin-top: 10px;
  margin-bottom: 10px;
}
</style>
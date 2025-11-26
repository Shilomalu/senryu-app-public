<script setup>
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import PostCard from '../components/PostCard.vue';

//こんな感じでJSONでdataの内容を受け取る予定、例[{text: "古池", ruby: "ふるいけ"}, {text: "や", ruby: null}]
const phrases = reactive([
  { text: '', ruby_data: [] },
  { text: '', ruby_data: [] },
  { text: '', ruby_data: [] }
]);

const selectedGenre = ref(1);
const message = ref('');
const router = useRouter();

const genres = [
  { id : 1, name : '＃春'},
  { id : 2, name : '＃夏'},
  { id : 3, name : '＃秋'},
  { id : 4, name : '＃冬'},
  { id : 5, name : '＃スポーツ'},
  { id : 6, name : '＃食べ物'},
  { id : 7, name : '＃学校'},
  { id : 8, name : '＃旅行'},
];

//しんじにバックエンド用のapiを作成依頼(未完了)
const analyzeText = async (index) => {
  const text = phrases[index].word;
  if(!text){
    phrases[index].ruby_data = [];
    return;
  }

  try{
    const res = await axios.post('/api/ruby', { text });
    phrases[index].ruby_data = res.data.ruby_data;
  }catch(err){
    console.error('解析失敗', err);
    phrases[index].ruby_data = [{ word: text, ruby: null }];
  }
}

const previewPost = computed(() => {
  const content = phrases.map(p => p.text).join(' ');
  
  const rubyContent = phrases.map(p => {
    if (p.ruby_data && p.ruby_data.length > 0) {
      return p.ruby_data;
    }
    return p.word ? [{ word: p.word, ruby: null }] : [];
  });

  return {
    id: 'preview',
    user_id: 0,
    authorName: 'あなた',
    content: content,
    ruby_content: rubyContent, // これで「空っぽ」ではなく「文字データ」が渡る
    repliesCount: 0,
    likesCount: 0,
    genre_id: selectedGenre.value
  };
});

//postsを修正すること頼む(未完了)
const handlePost = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    message.value = 'ログインが必要です。';
    return;
  }

  const senryudata = {
    content1: phrases[0].word,
    content2: phrases[1].word,
    content3: phrases[2].word,
    ruby: phrases.map(p => p.ruby_data),
    genre_id: selectedGenre.value,
  };

  try {
    await axios.post('/api/posts', senryudata, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    message.value = '投稿しました！';
    setTimeout(() => router.push('/'), 1500);

  } catch (err) {
    const errorRes = err.response?.ruby_data;
    
    if (errorRes?.errorCode) {
        let errorMessages = [];
        if (errorRes.errorCode & 1) errorMessages.push('上の句が5音ではありません。');
        if (errorRes.errorCode & 2) errorMessages.push('中の句が7音ではありません。');
        if (errorRes.errorCode & 4) errorMessages.push('下の句が5音ではありません。');
        message.value = errorMessages.join('\n');
    } else if (errorRes?.errorCode === -1) {
        message.value = '記号などが多すぎます。';
    } else {
        message.value = errorRes?.error || errorRes?.message || '投稿に失敗しました。';
    }
  }
};

// 入力可能文字種の詳細へ遷移
const goDescription = () => {
  router.push('/post/description');
};

</script>

<template>
  <div class="form-container">
    <h1>川柳を詠む</h1>
    <div class="text-wrapper">
      <p class="form-text" @click="goDescription">初めての方はこちら</p>
    </div>
    <form @submit.prevent="handlePost">
    　<div class="input-sections">
        <!-- 上・中・下の句の入力ループ -->
        <div v-for="(phrase, index) in phrases" :key="index" class="phrase-group">
          <label>{{ ['上', '中', '下'][index] }}の句</label>
          
          <!-- テキスト入力 (変更確定時に解析) -->
          <input 
            v-model="phrase.word" 
            type="text" 
            :placeholder="['五', '七', '五'][index]"
            @change="analyzeText(index)" 
            required
            :maxlength="[10, 15, 10][index]"
            class="main-input"
          >

          <!-- ▼ ルビ編集エリア (解析結果がある場合のみ表示) ▼ -->
          <div v-if="phrase.ruby_data.length > 0" class="ruby-edit-area">
            <p class="ruby-label">ルビの調整 (漢字のみ)</p>
            <div class="ruby-items">
              <div v-for="(item, i) in phrase.ruby_data" :key="i" class="ruby-item">
                <!-- 単語の表示 -->
                <span class="word-surface">{{ item.text }}</span>
                
                <!-- ルビ入力欄 (ルビがある場合のみ表示) -->
                <input 
                  v-if="item.ruby !== null" 
                  v-model="item.ruby" 
                  class="ruby-input"
                >
                <span v-else class="no-ruby">-</span>
              </div>
            </div>
          </div>
        </div>
      </div>
　
　
  <!-- ジャンル選択ボタン -->
  <div class="genre-buttons">
  <button 
    v-for="genre in genres"
    :key="genre.id"
    type="button"
    :class="{ active: selectedGenre === genre.id }"
    @click="selectedGenre = genre.id"
  >
    {{ genre.name }}
  </button>
</div>

      <div class="preview-section">
        <h2>プレビュー</h2>
        <p class="preview-note">※実際の表示イメージ</p>
        <!-- isPreview="true" を渡してボタン等を隠す -->
        <PostCard :post="previewPost" :isPreview="true" />
      </div>

  <!-- 投稿ボタン -->
  <button type="submit" class="submit-btn">投稿</button>


</form>

    <p v-if="message">{{ message }}</p>
  </div>
</template>

<style scoped>
.form-container {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
  padding-bottom: 100px;
  text-align: center;
}

.page-title { 
  margin-bottom: 10px; 
  font-size: 1.5em; 
  font-weight: bold;
}

.text-wrapper {
  text-align: right;
  margin-bottom: 15px;
}
.form-text {
  display: inline-block;
  color: #3366bb;
  cursor: pointer;
  font-size: 0.9em;
}
.form-text:hover { text-decoration: underline; }

.phrase-group {
  margin-bottom: 20px;
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
.ruby-label { font-size: 0.85em; color: #666; margin-bottom: 8px; }

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
  font-size: 0.9em;
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

.genre-buttons {
  display : grid;
  grid-template-columns : repeat(4,1fr);
  gap : 10px;
  margin-bottom : 30px;
}
.genre-buttons button {
  padding : 8px;
  font-size : 0.9em;
  border-radius: 6px;
  border: 1px solid #007bff;
  background-color: white;
  cursor: pointer;
  transition: 0.2s;
}
.genre-buttons button.active {
  background-color: #007bff;
  color: white;
}
.genre-buttons button:hover {
  background-color: #0056b3;
  color: white;
}

/* プレビューエリア */
.preview-section {
  margin-bottom: 30px;
  border-top: 2px solid #eee;
  padding-top: 20px;
}
.preview-section h2 { font-size: 1.2em; margin-bottom: 5px; color: #555; }
.preview-note { font-size: 0.8em; color: #888; margin-bottom: 15px; }

.submit-btn {
  width: 100%;
  padding: 14px;
  font-size: 1.1em;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.2s;
}
.submit-btn:hover { background-color: #0056b3; }

.message-display {
  margin-top: 15px;
  padding: 10px;
  border-radius: 5px;
  background-color: #f8d7da;
  color: #721c24;
  white-space: pre-wrap;
  text-align: center;
}
</style>
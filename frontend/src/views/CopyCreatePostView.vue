<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import axios from 'axios'
import PostCard from '../components/PostCard.vue'
import { analyzeText } from '../composables/useAnalyzeText.js'
import { useHandlePost } from '../composables/useHandlePost.js'

//こんな感じでJSONでdataの内容を受け取る予定、例[{word: "古池", ruby: "ふるいけ"}, {word: "や", ruby: null}]
const phrases = reactive([
  { text: '', ruby_data: [] },
  { text: '', ruby_data: [] },
  { text: '', ruby_data: [] },
]);

const isJoinTheme = ref(true);
const selectedGenre = ref(null);
const message = ref('');
const currentTheme = ref(null);
const show_genres = ref(false);
let genreAbortController = null;
const show = ref(false);
const page = ref(1);
const totalPages = 4;

const genres = [
  { id: 1, name: '＃春' },
  { id: 2, name: '＃夏' },
  { id: 3, name: '＃秋' },
  { id: 4, name: '＃冬' },
  { id: 5, name: '＃趣味' },
  { id: 6, name: '＃食べ物' },
  { id: 7, name: '＃学校' },
  { id: 8, name: '＃その他' },
];

const { handlePost } = useHandlePost(
  selectedGenre,
  currentTheme,
  isJoinTheme,
  message
)

onMounted(async () => {
  try {
    const res = await axios.get('/api/themes/current')
    if (res.data) {
      currentTheme.value = res.data // { weekly_theme_id, theme_name, ... } が入る
    }
  } catch (err) {
    console.error('お題取得エラー:', err)
  }
});

onMounted(async () => {
  try {
    const res = await axios.get('/api/themes/current');
    if (res.data) {
      currentTheme.value = res.data; // { weekly_theme_id, theme_name, ... } が入る
    }
  } catch (err) {
    console.error('お題取得エラー:', err);
  }
});

const open = async () => {
  show.value = true;
  page.value = 1;
};

const close = () => {
  show.value = false;
};

const next = () => {
  if (page.value < totalPages) page.value++;
};

const prev = () => {
  if (page.value > 1) page.value--;
};

const previewPost = computed(() => {
  const content = phrases.map((p) => p.text).join(' ')

  const rubyContent = phrases.map((p) => {
    if (p.ruby_data && p.ruby_data.length > 0) {
      return p.ruby_data
    }
    return p.text ? [{ word: p.text, ruby: null }] : []
  })

  return {
    id: 'preview',
    user_id: 0,
    authorName: 'あなた',
    content: content,
    ruby_content: rubyContent, // これで「空っぽ」ではなく「文字データ」が渡る
    repliesCount: 0,
    likesCount: 0,
    genre_id: selectedGenre.value,
  }
});

//ジャンルIDを自動推論
const genre_predict = async () => {
  console.log('genre_predict')
  const content1 = phrases[0].text.trim()
  const content2 = phrases[1].text.trim()
  const content3 = phrases[2].text.trim()

  if (!content1 || !content2 || !content3) {
    return
  }

  if (genreAbortController) {
    genreAbortController.abort();
  }
  genreAbortController = new AbortController();

  try {
    const res = await axios.post('/api/genre/predict', {
      content1: content1,
      content2: content2,
      content3: content3,
    },{
      signal: genreAbortController.signal
    });

    const genreId = Number(res.data.genre_id);
    selectedGenre.value = genreId;
  } catch(err){
    if (axios.isCancel(err)) {
      console.log('古いジャンル推論をキャンセルしました（正常）');
    } else {
      console.error("ジャンルの自動推論でエラーが発生しました",err);
    }
  }
};
</script>

<template>
  <button class="help-btn" @click="open">？</button>
  <div v-if="show" class="modal-overlay" @click="close">
    <div class="modal-box" @click.stop>
      <div class="modal-content">
        <button class="close-btn" @click="close"><span class="underline-gray">-閉じる</span></button>
        <div v-if="page === 1">
          <h3 class="section-title">＜投稿手順＞</h3>
          <br>
          <ol type="1">
            <li>今週のお題に投稿するかを選択(詳しくは今週のお題についてを参照)</li>
            <li>上の句・中の句・下の句 にそれぞれ入力してください</li>
            <li><span class="underline">下見</span>(プレビュー)を確認し、よろしければ<span class="underline">投稿</span>ボタンを押してください</li>
            <li>漢字のルビが間違っている場合は<span class="underline">ルビの調整</span>からルビを変更し、<span class="underline">投稿</span>ボタンを押してください</li>
          </ol>
        </div>
        <div v-if="page === 2">
          <h3 class="section-title">＜文字数のカウントについて＞</h3>
          <br>
          <ol>
            <li>当アプリでは <strong>モーラ(拍)</strong> という単位で音を数えます</li>
            <li>句読点・記号類は <strong>0 モーラ</strong> としてカウントします</li>
          </ol>
          <br>
          <h4 class="example-title">【例】</h4>
          <ul class="example-list">
            <li>
              <strong>「楽器」 → 3 モーラ</strong><br>
              　が (1) ＋ っ (1) ＋ き (1) → 3 モーラ
            </li>
            <li>
              <strong>「しょっぱい」 → 4 モーラ</strong><br>
              　しょ (1) ＋ っ (1) ＋ ぱ (1) ＋ い (1) → 4 モーラ
            </li>
            <li>
              <strong>「ヤッター！」 → 4 モーラ</strong><br>
              　ヤ (1) ＋ ッ (1) ＋ ター (2) ＋ ！ (0) → 4 モーラ
            </li>
          </ul>
        </div>
        <div v-if="page === 3">
          <h3 class="section-title">＜投稿に関する注意点＞</h3>
          <br>
          <ol>
            <li>入力できる文字は ひらがな・カタカナ・漢字 と 句読点・記号類 ( 。、「」・！？ ) です</li>
            <li>句読点・記号類は一句の中で４文字まで使用できます</li>
            <li>字余り・字足らずを考慮して、それぞれのモーラ数が五・七・五に対して-1から+1文字までの間なら、投稿することができます</li>
            <li>あなたの川柳をAIが自動で種別(ジャンル)分け、色付けしてくれます</li>
            <li><span class="underline">種別を手動入力する</span>からひとつ、ジャンルを選ぶこともできます</li>
          </ol>
        </div>
        <div v-if="page === 4">
          <h3 class="section-title">＜今週のお題について＞</h3>
          <br>
          <ol>
            <li>毎週お題が1つ選ばれて、お題に沿った投稿をする・見ることができます</li>
            <li>投稿時に<span class="underline">このお題に応募する</span>から、参加するかどうかを選択できます</li>
            <li><span class="underline">句会</span>の<span class="underline">今週のお題</span>から、先週の位(ランキング)と今週の投稿を見ることができます</li>
            <li>ランキングは<span class="underline">いとをかし</span>(いいね)の数で決まります</li>
          </ol>
          <br>
          <p style="text-align: center"><font size="+1">早速投稿してみましょう！</font></p>
        </div>

      </div>
      <div class="modal-footer">
        <button class="nav-btn" @click="prev" :disabled="page === 1">◂戻る</button>
        <button v-if="page < 4" class="nav-btn" @click="next" :disabled="page === 4">次へ▸</button>
        <button v-else class="nav-btn" @click="close">投稿を始める</button>
      </div>
    </div>
  </div>

  <div class="form-container">
    <h1>川柳を詠む</h1>
    <div v-if="currentTheme" class="theme-banner">
      <span class="theme-label">📅 今週のお題開催中！</span>
      <p class="theme-title">「{{ currentTheme.theme_name }}」</p>
      <div class="theme-toggle-wrapper">
        <label class="theme-checkbox-label">
          <input type="checkbox" v-model="isJoinTheme" class="theme-checkbox" />
          このお題に応募する
        </label>
      </div>
      <p class="theme-desc" v-if="isJoinTheme">　※来週の位（ランキング）に名乗りを上げられます</p>
      <p class="theme-desc" v-else>※お題には参加せず、通常の投稿として扱われます</p>
    </div>
    <form @submit.prevent>
      <div class="input-sections">
        <!-- 上・中・下の句の入力ループ -->
        <div v-for="(phrase, index) in phrases" :key="index" class="phrase-group">
          <label>{{ ['上', '中', '下'][index] }}の句</label>

          <!-- テキスト入力 (変更確定時に解析) -->
          <input
            v-model="phrase.text"
            type="text"
            :placeholder="['五', '七', '五'][index]"
            @change="
              analyzeText(index, phrases);
              genre_predict()
            "
            required
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
      </div>

      <!--種別手動入力ボタン-->
      <div class="genre_set_group">
        <button
          type="button"
          id="genre_set_button"
          @click="
            show_genres = !show_genres;
            selectedGenre = null
          "
          :class="[{ active: show_genres }, 'dark-btn']"
        >
          種別を手動入力する
        </button>
      </div>

      <!-- 種別選択ボタン -->
      <div v-if="show_genres === true">
        <div class="genre-buttons">
          <button
            v-for="genre in genres"
            :key="genre.id"
            type="button"
            :class="[{ active: selectedGenre === genre.id }, common-btn]"
            @click="selectedGenre = genre.id"
          >
            {{ genre.name }}
          </button>
        </div>
      </div>

      <div class="preview-section">
        <h2>下見</h2>
        <p class="preview-note">※実際の表示イメージ</p>
        <!-- isPreview="true" を渡してボタン等を隠す -->
        <PostCard :post="previewPost" :isPreview="true" />
      </div>

      <!-- 投稿ボタン -->
      <button 
        type="submit" 
        class="submit-btn common-btn"
        :disabled="!phrases[0].ruby_data || !phrases[1].ruby_data || !phrases[2].ruby_data" 
        @click="handlePost(phrases)"
      >投稿</button>
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
  cursor: pointer;
  font-size: 0.9em;
}
.form-text:hover {
  text-decoration: underline;
}

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

.genre_set_group {
  text-align: left;
}

#genre_set_button {
  height: 40px; /* 全ボタン共通の高さ */
  padding: 0;
  font-size: 0.9em;
  margin-bottom: 50px;
  transition: 0.2s;
}

.genre-buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 30px;
}
.genre-buttons button {
  height: 40px; /* 全ボタン共通の高さ */
  padding: 0;
  font-size: 0.9em;
  border-radius: 8px;
  border: 1px solid #1F6F78;
  background-color: white;
  cursor: pointer;
  transition: 0.4s; /* ← 回転も滑らかにするため少し長めに */
  transform-origin: center center; /* 中央を基準に回転・拡大 */
}

.genre-buttons button:active {
  transform: none;
}

.genre-buttons button.active {
  font-size: 1.1em;

  /* 🔥 1回転+拡大 */
  transform: rotate(360deg) scale(1.1);
  background-color: #1F6F78;
  color: white;
  font-weight: bold;
}
/* プレビューエリア */
.preview-section {
  margin-bottom: 30px;
  border-top: 2px solid #eee;
  padding-top: 20px;
  display: flex;
  justify-content: center; /* 横中央 */
  align-items: center; /* 縦方向も中央寄せ（任意） */
  flex-direction: column;
}
.preview-section h2 {
  font-size: 1.2em;
  margin-bottom: 5px;
  color: #555;
}
.preview-note {
  font-size: 0.8em;
  color: #888;
  margin-bottom: 15px;
}

.submit-btn {
  width: 100%;
  padding: 14px;
  font-size: 1.1em;
  border-radius: 6px;
  transition: background-color 0.2s;
}
.message-display {
  margin-top: 15px;
  padding: 10px;
  border-radius: 5px;
  background-color: #f8d7da;
  color: #721c24;
  white-space: pre-wrap;
  text-align: center;
}

.theme-banner {
  background-color: #fff3cd; /* 薄い黄色 */
  border: 2px solid #ffecb5;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  color: #856404;
}
.theme-label {
  font-weight: bold;
  font-size: 0.9em;
  display: block;
  margin-bottom: 5px;
  color: #d39e00;
}
.theme-title {
  font-size: 1.4em;
  font-weight: bold;
  margin: 0 0 5px 0;
  color: #333;
}
.theme-desc {
  font-size: 0.85em;
  margin: 0;
  opacity: 0.8;
}

.theme-toggle-wrapper {
  margin-top: 10px;
  background-color: rgba(255, 255, 255, 0.6);
  padding: 8px;
  border-radius: 5px;
  display: inline-block;
}

.theme-checkbox-label {
  cursor: pointer;
  font-weight: bold;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.1em;
}

.theme-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #6c8a4a;
}

/* 右上に？ボタン */
.help-btn {
  position: fixed;
  top: 14px;
  right: 14px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  font-weight: 700;
  font-size: 22px;
  justify-content: center;
  background-color: #5c7b45;
  color: white;
  z-index: 2000;
}

.close-btn {
  position: absolute;
  top: 20px;
  right: 18px;
  border: none;
  justify-content: center;
}

/* モーダル背景 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 3000;
}

/* モーダル本体 */
.modal-box {
  position: relative;
  width: 85%;
  max-width: 420px;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 0 8px rgba(0,0,0,0.2);
  animation: fadein 0.2s;
}

/* テキスト領域 */
.modal-content {
  min-height: 140px;
  margin-bottom: 20px;
}

/* フッター */
.modal-footer {
  display: flex;
  justify-content: space-between;
}

/* 戻る / 次へ ボタン */
.nav-btn {
  padding: 2px 10px;
  border: none;
  border-radius: 8px;
  background: #eee;
  font-size: 16px;
}

.nav-btn:disabled {
  opacity: 0.4;
}

/* アニメーション */
@keyframes fadein {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

.underline {
  text-decoration: underline;
  text-decoration-color: #aaa;
}

.underline-gray {
  text-decoration: underline;
  text-decoration-color: #ddd;
}
</style>
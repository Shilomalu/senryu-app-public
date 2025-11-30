<script setup>
import { nextTick, ref } from 'vue'
import PostCard from '@/components/PostCard.vue'

const keyword = ref('')
const results = ref([])
const is_searched = ref(false)
const scroll_target = ref(null) //検索ボタンを押した際に自動でスクロールさせる用
const show_postcard = ref(false)

//ここからジャンル関係
const show_genres = ref(false)
const genres = [
  { id: 1, name: '＃春' },
  { id: 2, name: '＃夏' },
  { id: 3, name: '＃秋' },
  { id: 4, name: '＃冬' },
  { id: 5, name: '＃スポーツ' },
  { id: 6, name: '＃食べ物' },
  { id: 7, name: '＃学校' },
  { id: 8, name: '＃旅行' },
]
const selectedGenre = ref(null)
//refをつけることによって画面をリロードすることなくテンプレートを変えられるようになる

const search_method = async (e) => {
  e.preventDefault() //リロードしないようにしてる
  if (keyword.value === '' && selectedGenre.value === null) {
    alert('検索ワードを入力してください')
    return
  }

  const search_value = new URLSearchParams()

  if (keyword.value !== '') {
    search_value.append('input_words', keyword.value)
  }

  if (selectedGenre.value !== null) {
    search_value.append('genre', selectedGenre.value)
  }

  const target_url = `/api/search?${search_value.toString()}`
  try {
    const response = await fetch(target_url)

    if (response.ok === false) {
      alert('検索中にエラーが発生しました')
      return
    }
    is_searched.value = true //refをつけたものの値を変えるときは.valueをつけるって
    show_postcard.value = false
    const search_result_raw = await response.json() 

    const processed_results = search_result_raw.map(post => {
      let parsedRuby = [];
      try {
        if (typeof post.ruby_content === 'string') {
          parsedRuby = JSON.parse(post.ruby_content);
        } else if (Array.isArray(post.ruby_content)) {
          parsedRuby = post.ruby_content;
        }
      } catch (e) {
        console.error('JSON parse error', e);
        parsedRuby = [];
      }
      return {
        ...post,
        ruby_content: parsedRuby, // 変換したデータを入れる
      };
    });

    results.value = processed_results

    if (search_result.length === 0) {
      return '該当する川柳がありません'
    }

    //スクロールさせる
    await nextTick()

    // まずスクロール（これがすぐ動く）
    scroll_target.value?.scrollIntoView({ behavior: 'smooth' })

    //0.4秒待ってから（スクロール完了タイミング）、アニメーション再描画
    setTimeout(() => {
      show_postcard.value = true
    }, 800)
  } catch (err) {
    console.error('検索中にエラーが発生:', err)
    alert('検索中にエラーが発生しました。')
  }
}

const set_genreId=(id)=>{
  const numId=Number(id);
  selectedGenre.value=numId;
  console.log('[chooseGenre] id:', id, '→ set to selectedGenre:', selectedGenre.value);
}
</script>

<template>
  <div class="search_container">
    <h1 id="title">検索ページ</h1>
    <form @submit="search_method">
      <h2>検索ワード入力</h2>

      <input id="search_input" placeholder="検索ワードを入力してください" v-model="keyword" />
      <br />

      <button
        type="button"
        id="genre_button"
        @click="show_genres = !show_genres"
        :class="{ active: show_genres }"
      >
        <div v-if="show_genres == false">ジャンルで検索する</div>
        <div v-else>閉じる</div>
      </button>

      <div v-if="show_genres == true" class="genre_section">
        <button
          v-for="(genre, index) in genres"
          :key="genre.id"
          type="button"
          :class="{ active: selectedGenre=== Number(genre.id) }"
          @click="set_genreId(genre.id)" 
          :style="{ animationDelay: index * 0.08 + 's' }"
        >
          {{ genre.name }}
        </button>
      </div>

      <button type="submit" id="search_button">検索</button>

      <div id="search_result">
        <div ref="scroll_target" style="width: 100%">
          <div v-if="is_searched === false">
            <h2 style="margin-top: 40px">検索結果</h2>
          </div>
          <div v-else>
            <h2 style="margin-top: 40px">検索結果:{{ results.length }}件</h2>
          </div>
          <div v-if="results.length === 0">
            <p>検索結果がありません。</p>
          </div>

          <div v-else class="search_results">
            <div
              v-for="(item, index) in results"
              :key="item.id"
              class="postcard_search"
              :class="{ fadeUpCard: show_postcard }"
              :style="{ animationDelay: `${index * 0.1}s` }"
            >
              <PostCard
                :post="{
                  id: item.id,
                  authorName: item.username,
                  user_id: item.user_id,
                  content: item.content,
                  created_at: item.created_at,
                  ruby_content: item.ruby_content,
                  genre_id: item.genre_id,
                }"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>

<style scoped>
.search_container {
  width: 80%;
  margin: 50px auto 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

#title {
  font-size: 3rem;
  font-weight: 600;
  margin-bottom: 30px;
  align-self: center;
}
.search_container h2 {
  text-align: left;
  width: 100%;
}
#search_input {
  width: 500px;
  height: 50px;
  margin-top: 20px;
  border-radius: 6px;
  border: 1px solid #007bff;
}
#search_button {
  width: 200px;
  height: 50px;
  border: none;
  border-radius: 5px;
  background-color: rgb(80, 80, 129);
  color: white;
  margin-top: 10px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
  transition: 0.2s;
  align-self: center;
}
#search_button:hover {
  cursor: pointer;
  transform: translateY(-5px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.5);
  opacity: 0.8;
}
.result-item {
  margin-top: 20px;
  padding: 15px;
  border-bottom: 1px solid #ddd;
}

.postcard_search {
  width: 450px;
  margin-bottom: 30px;
  opacity: 0;
}

@media (max-width: 450px) {
  .postcard_search {
    width: 80%;
  }
}

.search_field {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

form {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: fit-content;
}

#search_result {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: fit-content;
}

.fadeUpCard {
  opacity: 0;
  transform: translateY(20px);
  animation: fadeUp 0.5s ease forwards;
}

@keyframes fadeUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

#genre_button {
  width: 200px;
  height: 40px;
  margin-top: -10px;
  margin-bottom: 30px;
  border-radius: 6px;
  border: 1px solid #007bff;
  background-color: white;
  cursor: pointer;
  transition: 0.2s;
  align-self: flex-start;
}

#genre_button.active {
  background-color: #007bff;
  color: white;
}

#genre_button:hover {
  transform: scale(1.1);
}

.genre_section {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin: 15px 0 20px;
}

.genre_section button {
  padding: 8px;
  font-size: 0.9em;
  border-radius: 6px;
  border: 1px solid #007bff;
  background-color: white;
  cursor: pointer;
  transition: 0.2s;
  opacity: 0;
  animation: fadeup 0.3s forwards ease-out;
}

@keyframes fadeup {
  from {
    opacity: 0;
    transform: scale(0.5) translateY(30px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.genre_section button.active {
  background-color: #007bff;
  color: white;
}

.genre_section button:hover {
  background-color: #0056b3;
  color: white;
}
</style>

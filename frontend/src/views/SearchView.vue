<script setup>
import { nextTick, ref } from 'vue'
import PostCard from '@/components/PostCard.vue'


const keyword = ref('')
const results = ref([])
const is_searched=ref(false);
const scroll_target=ref(null) ;//検索ボタンを押した際に自動でスクロールさせる用
const show_postcard=ref(false);
//refをつけることによって画面をリロードすることなくテンプレートを変えられるようになる

const search_method = async (e) => {
e.preventDefault();//リロードしないようにしてる
  if(keyword.value===""){
    alert("検索ワードを入力してください");
    return;
  }

  const target_url= `http://localhost:3001/api/search?q=${encodeURIComponent(keyword.value)}`;
  try{
    const response=await fetch(target_url);

    if(response.ok===false){
      alert ("検索中にエラーが発生しました");
      return;
    }
    is_searched.value=true;//refをつけたものの値を変えるときは.valueをつけるって
    show_postcard.value=false;
    const search_result=await response.json();
    results.value=search_result;

    if(search_result.length===0){
      return "該当する川柳がありません";
    }

    //スクロールさせる
    await nextTick()

// ① まずスクロール（これがすぐ動く）
scroll_target.value?.scrollIntoView({ behavior: 'smooth' })

// ② 0.4秒待ってから（スクロール完了タイミング）、アニメーション再描画
setTimeout(() => {
  show_postcard.value=true;
}, 800)
  }
 catch (err) {
    console.error("検索中にエラーが発生:", err);
    alert("検索中にエラーが発生しました。");
  }
}
</script>

<template>
  <div class="search_container">
   
    <h1 style="font-size: 3rem; font-weight: 600;margin-bottom: 30px;">検索ページ</h1>
    <h2>検索ワード入力</h2>
    <form @submit="search_method">

      <input
        id="search_input"
        placeholder="検索ワードを入力してください"
        v-model="keyword"
      />
      <br>
      
      <button type="submit" id="search_button">検索</button>
    </form>
    <div ref="scroll_target" style="width: 100%;">
    <div v-if="is_searched===false">
    <h2 style="margin-top: 40px;">検索結果</h2>
    </div>
    <div v-else>
       <h2 style="margin-top: 40px;">検索結果:{{ results.length }}件</h2>
    </div>
    <div v-if="results.length === 0">
      <p>検索結果がありません。</p>
    </div>

    <div v-else class="search_results">
  <div
    v-for="(item, index) in results"
    :key="item.id"
    class="postcard_search"
    :class="{fadeUpCard:show_postcard}"
    :style="{ animationDelay: `${index * 0.1}s` }"
  >
    <PostCard
      :post="{
        id: item.id,
        authorName: item.username,
        user_id: item.user_id,
        content: item.content,
        created_at: item.created_at
      }"
    />
  </div>
</div>
  </div>
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
#search_input {
  width: 500px;
  height: 50px;
  margin-top: 20px;
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

.search_results{
  display: flex;
 display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;

  
}

.postcard_search{
  width: 450px;
  margin-bottom: 30px;
  opacity: 0;
  
  
}

@media(max-width:450px){
  .postcard_search{
    width: 80%;
  }
}

.search_field{
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

form{
  display: flex;
  flex-direction: column;
  align-items: center;
}

.fadeUpCard {
  opacity: 0;
  transform: translateY(20px);
  animation: fadeUp 0.5s ease forwards;
}


</style>

<style>
@keyframes fadeUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

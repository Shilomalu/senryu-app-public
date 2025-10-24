<script setup>
//ここにコード
</script>

<template>
  
  <div class="search_container">  
  <h1 style="font-size: 3rem; font-weight: 600;margin-bottom: 30px;">検索ページ</h1>
    <h2>検索ワード入力</h2>
    <form >
      <input id="search_input" placeholder="検索ワードを入力してください" type="text" ></input>
      <button type="submit" id="search_button">検索</button>
    </form>
    
  <h2 style="margin-top: 40px;">検索結果</h2>

  </div>
</template>

<style scoped>

.search_container{
  width: 80%;
  margin: 50px auto 0;
  text-align: left;
}

#search_input{
  width: 100%;
  height: 50px;
  margin-top: 20px;
}

#search_button{
  width: 200px;
  height: 50px;
  border: none;
  border-radius: 5px;
  background-color: rgb(80, 80, 129);
  color:white;
  margin-top: 10px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.3);
  transition: 0.2s;
}

#search_button:hover{
  cursor: pointer;
  transform: translateY(-5px) scale(1.00001);
  box-shadow: 0 6px 12px rgba(0,0,0,0.5);
  opacity: 0.8;

}
</style>
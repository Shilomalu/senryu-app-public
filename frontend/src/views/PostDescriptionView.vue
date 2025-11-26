<script setup>
import { useRouter } from 'vue-router';
const router = useRouter();

const returnPost = () => {
  router.push('/post');
};
</script>

<template>
  <div style="display: flex;
  justify-content: space-between;">
  <h1 class="title">入力可能な文字一覧</h1>
  <button @click="returnPost" class="button1">戻る</button>
  </div>

  <h2 class="index">&#x2705;入力可能な文字</h2>
  <ul class="items">
    <li>ひらがな</li>
    <li >全角カタカナ</li>
    <li >漢字</li>
    <li >一部の記号:　。「」！？</li>
  </ul>
  <h2 class="index">⚠️表示形式が変更される文字</h2>
   <ul class="items">
    <li>半角ｶﾀｶﾅ：全角カタカナとして表示されます</li>
    
  </ul>
  <h2 class="index">&#x1F6AB;入力できない文字</h2>
   <ul class="items">
    <li >アルファベットなど</li>
    <li>絵文字や顔文字</li>
    
  </ul>
  
</template>


<style scoped>
.title{
  font-weight: 700;

}
.index{
  transition: 1s;
  margin-top: 50px;
  border-bottom: #163e69 solid 2px;
}


.button1 {
  width: 100px;
  padding: 10px;
  font-size: 1em;
  background-color: #007bff;
  margin-right: 50px;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: 0.2s;
}
.button1:hover {
  background-color: #0056b3;
}




</style>
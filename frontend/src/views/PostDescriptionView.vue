<script setup>
import { useRouter } from 'vue-router';
const router = useRouter();

const returnPost = () => {
  router.push('/post');
};
</script>

<template>
  <div class="form-container">
  <details class="accordion">
  <summary class="accordion_summary">投稿手順</summary>
  <ol class="items">
    <li>上の句、中の句、下の句の各欄を思うままに埋める</li>
    <li>八つあるボタンから、適した一つを選択</li>
    <li>投稿内容を確認の上、投稿ボタンを押す</li>
  </ol>
  </details>

  <details class="accordion">
    <summary class="accordion_summary">投稿ルール</summary>
    <div class="accordion_detail">

      <h3 class="index">&#x2705;入力可能な文字</h3>
      <ul class="items">
        <li>ひらがな</li>
        <li>全角カタカナ</li>
        <li>漢字</li>
        <li>一部の記号 :　。、・「」！？</li>
      </ul>
      <h3 class="index">&#x1F6AB;入力できない文字</h3>
      <ul class="items">
        <li>アルファベットなど</li>
        <li>半角カタカナ</li>
        <li>絵文字や顔文字</li>
      </ul>
    </div>

    <h3 class="index">⚠️注意点</h3>
    <ul class="items">
      <li>
      五･七･五で投稿<br>
      <span class="note">字余りと字足らずを考慮し、各行で±1文字の範囲ならOK</span>
      </li>
      <li>記号は一句で4文字まで使用可能</li>
    </ul>
  </details>

  <details class="accordion">
  <summary class="accordion_summary">ルビ変更方法</summary>
  <ul class="items">
    <li></li>
  </ul>
  </details>
  </div>
</template>


<style scoped>
.form-container {
  text-align: left;
}

.index{
  transition: 1s;
  margin-top: 10px;
  border-bottom: #163e69 solid 2px;
}

.accordion {
  margin: 2em 0;
}

.accordion_summary {
  font-size: 20px;
  font-weight: 700;
  margin-top: 40px;
  position: relative;
  list-style: none;
}

.accordion_summary::-webkit-details-marker {
  display: none;
}

.accordion_summary::after {
  content: "+";
  font-size: 20px;
  position: absolute;
}

.accordion[open] .accordion_summary::after {
  content: "−";
}

.items li .note {
  display: block;
  margin-top: -5px;
  margin-left: 7.5px;
  font-size: 0.95em;
}

</style>
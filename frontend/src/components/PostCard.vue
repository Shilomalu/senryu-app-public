<template>
  <div class="card">
    <!-- ユーザー情報 -->
    <div class="author">
      🧑 {{ post.author }}
    </div>

    <!-- 川柳ボックス -->
    <div class="poem-wrapper">
      <div class="poem">
        <p v-for="(line, index) in lines" :key="index" class="post-line">
          {{ line }}
        </p>
      </div>
    </div>

    <!-- アクションボタン -->
    <div class="actions">
      <span class="like-btn">💛いとをかし</span>
      <button class="reply-btn">返信</button>
    </div>
  </div>
</template>

<script setup>
import { defineProps, computed } from 'vue';

const props = defineProps({
  post: {
    type: Object,
    required: true,
    default: () => ({
      author: 'テストユーザー',
      content: '花散るや　風にまかせて　時は過ぐ'
    })
  }
});

// 全角スペースで投稿を3行に分割
const lines = computed(() => props.post.content.split('　'));
</script>

<style scoped>
.card {
  border: 1px solid #ccc;
  border-radius: 10px;
  padding: 1rem;
  margin: 1rem auto;
  width: 80%;
  background-color: #fff;
  display: flex;
  flex-direction: column;
}

.author {
  font-weight: bold;
  margin-bottom: 0.5rem;
}

/* 川柳ボックス */
.poem-wrapper {
  border: 1px solid #ccc;
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 0.5rem;
  width: 100%;
  min-height: 120px;
  display: flex;
  justify-content: center; /* ボックス内横中央 */
  align-items: center;     /* ボックス内縦中央 */
  background-color: #fafafa;
}

/* 川柳テキスト（縦書き） */
.poem {
  writing-mode: vertical-rl;
  text-orientation: upright;
  font-family: "Hiragino Mincho ProN", serif;
  font-size: 20px;
  line-height: 1.8;
  display: flex;
  flex-direction: column;
}

.post-line {
  margin: 0 0 0.5rem 0;
  text-align: center;
}

.actions {
  display: flex;
  justify-content: flex-end; /* カード右端にボタンを配置 */
  gap: 1rem;
}

.like-btn {
  cursor: pointer;
}

.reply-btn {
  background-color: #f4f4f4;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
}
</style>

<script setup>
import { ref, onMounted } from 'vue';

const timeline = ref([]);
const message = ref('');

const fetchTimeline = async () => {
  try {
    const res = await fetch('http://localhost:3001/api/posts/timeline');
    const data = await res.json();
    if (!res.ok) throw new Error('タイムラインの読み込みに失敗しました。');
    timeline.value = data;
  } catch (err) {
    message.value = err.message;
  }
};

onMounted(fetchTimeline);
</script>

<template>
  <div class="page-container">
    <h1>タイムライン</h1>
    <p v-if="message">{{ message }}</p>
    <div class="timeline">
      <ul>
        <li v-for="post in timeline" :key="post.id">
          <p class="content">{{ post.content }}</p>
          <p class="author">- {{ post.authorName }}</p>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.page-container { max-width: 600px; margin: 0 auto; }
.timeline ul { list-style: none; padding: 0; }
.timeline li { border-bottom: 1px solid #eee; padding: 15px 0; }
.content { font-size: 1.2em; white-space: pre-wrap; }
.author { text-align: right; color: #555; margin-top: 10px; }
</style>
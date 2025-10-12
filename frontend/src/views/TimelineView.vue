<script setup>
import PostCard from '../components/PostCard.vue'
import { ref, onMounted } from 'vue';
import { jwtDecode } from 'jwt-decode';

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

const token = ref(localStorage.getItem('token'));
const currentUser = ref(token.value ? jwtDecode(token.value) : null);

const handleDelete = async (postId) => {
    if (!confirm('本当にこの投稿を削除しますか？')) {
        return;
    }
    try {
        const res = await fetch(`http://localhost:3001/api/posts/${postId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token.value}`,
            },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        
        // タイムラインから削除された投稿をフィルタリングしてUIを更新
        timeline.value = timeline.value.filter(post => post.id !== postId);
        message.value = data.message;

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
        <li v-for="post in timeline" :key="post.id">
        <p class="content">{{ post.content }}</p>
        <p class="author">- {{ post.authorName }}</p>
        <button v-if="currentUser && post.user_id === currentUser.id" @click="handleDelete(post.id)">
          削除
        </button>
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
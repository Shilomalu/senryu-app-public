<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const content = ref('');
const message = ref('');
const router = useRouter();

const handlePost = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    message.value = 'ログインが必要です。';
    return;
  }

  try {
    const res = await fetch('http://localhost:3001/api/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ content: content.value }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '投稿に失敗しました。');
    
    message.value = '投稿しました！';
    setTimeout(() => router.push('/'), 1500);
  } catch (err) {
    message.value = err.message;
  }
};
</script>

<template>
  <div class="form-container">
    <h1>川柳を詠む</h1>
    <form @submit.prevent="handlePost">
      <div>
        <textarea v-model="content" placeholder="五・七・五で一句" rows="4" required></textarea>
      </div>
      <button type="submit">投稿</button>
    </form>
    <p v-if="message">{{ message }}</p>
  </div>
</template>

<style scoped>
.form-container { max-width: 500px; margin: 0 auto; }
textarea { width: 100%; padding: 10px; font-size: 1.2em; box-sizing: border-box; }
button { width: 100%; padding: 10px; }
</style>
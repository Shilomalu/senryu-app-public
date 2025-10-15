<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const content1 = ref('');//5
const content2 = ref('');//7
const content3 = ref('');//5

const message = ref('');
const router = useRouter();

const handlePost = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    message.value = 'ログインが必要です。';
    return;
  }

  const senryudata = {
    content1: content1.value,
    content2: content2.value,
    content3: content3.value,
  };

  try {
    const res = await fetch('http://localhost:3001/api/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(senryudata),
    });
    const data = await res.json();

    if (!res.ok) {
      if (data.errorCode) {
        let errorMessages = [];
        if (data.errorCode & 1) errorMessages.push('上の句が5音ではありません。');
        if (data.errorCode & 2) errorMessages.push('中の句が7音ではありません。');
        if (data.errorCode & 4) errorMessages.push('下の句が5音ではありません。');
        throw new Error(errorMessages.join('\n'));
      }
      throw new Error(data.error || '投稿に失敗しました。');
    }
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
      <div class="senryu-inputs">
        <input v-model="content1" type="text" placeholder="上の句（五）" required maxlength="10">
        <input v-model="content2" type="text" placeholder="中の句（七）" required maxlength="15">
        <input v-model="content3" type="text" placeholder="下の句（五）" required maxlength="10">
      </div>
      <button type="submit">投稿</button>
    </form>
    <p v-if="message">{{ message }}</p>
  </div>
</template>

<style scoped>
.form-container { max-width: 500px; margin: 0 auto; }
/* 3つの入力欄を横に並べるスタイル */
.senryu-inputs {
  display: flex;
  gap: 10px; /* 入力欄の間の隙間 */
  margin-bottom: 20px;
}
.senryu-inputs input {
  flex: 1; /* 横幅を均等に分ける */
  padding: 10px;
  font-size: 1.1em;
  text-align: center;
}
button { width: 100%; padding: 10px; }
</style>
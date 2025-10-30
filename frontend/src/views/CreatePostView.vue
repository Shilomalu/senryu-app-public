<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const content1 = ref(''); // 上の句（5）
const content2 = ref(''); // 中の句（7）
const content3 = ref(''); // 下の句（5）

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
      if (data.errorCode > 0) {
        let errorMessages = [];
        if (data.errorCode & 1) errorMessages.push('上の句が5音ではありません。');
        if (data.errorCode & 2) errorMessages.push('中の句が7音ではありません。');
        if (data.errorCode & 4) errorMessages.push('下の句が5音ではありません。');
        throw new Error(errorMessages.join('\n'));
      } else if (data.errorCode === -1) {
        throw new Error('記号などが多すぎます。');
      }
      throw new Error(data.error || '投稿に失敗しました。');
    }
    message.value = '投稿しました！';
    setTimeout(() => router.push('/'), 1500);
  } catch (err) {
    message.value = err.message;
  }
};

// 入力可能文字種の詳細へ遷移
const goDescription = () => {
  router.push('/post/description');
};
</script>

<template>
  <div class="form-container">
    <h1>川柳を詠む</h1>
    <div class="text-wrapper">
      <p class="form-text" @click="goDescription">入力できる文字種一覧はこちら</p>
    </div>
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
.form-container {
  max-width: 500px;
  margin: 0 auto;
  text-align: center;
}

.text-wrapper{
  text-align: right;
}
.form-text {
  display: inline-block;
  color: #3366bb;
  cursor: pointer;
}
.form-text:hover {
  text-decoration: underline;
}

/* 入力欄を縦に並べるスタイル */
.senryu-inputs {
  display: flex;
  flex-direction: column; /* 縦並びに変更！ */
  gap: 10px;
  margin-bottom: 20px;
}

.senryu-inputs input {
  padding: 10px;
  font-size: 1.1em;
  text-align: center;
}

button {
  width: 100%;
  padding: 10px;
  font-size: 1em;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
button:hover {
  background-color: #0056b3;
}
</style>

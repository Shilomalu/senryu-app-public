<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const content1 = ref(''); // 上の句（5）
const content2 = ref(''); // 中の句（7）
const content3 = ref(''); // 下の句（5）

const selectedGenre = ref(1);
const message = ref('');
const router = useRouter();

const genres = [
  { id : 1, name : '＃春'},
  { id : 2, name : '＃夏'},
  { id : 3, name : '＃秋'},
  { id : 4, name : '＃冬'},
  { id : 5, name : '＃スポーツ'},
  { id : 6, name : '＃食べ物'},
  { id : 7, name : '＃学校'},
  { id : 8, name : '＃旅行'},
];

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
    genre_id: selectedGenre.value,
  };

  try {
    const res = await fetch('/api/posts', {
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

  <!-- ジャンル選択ボタン -->
  <div class="genre-buttons">
  <button 
    v-for="genre in genres"
    :key="genre.id"
    type="button"
    :class="{ active: selectedGenre === genre.id }"
    @click="selectedGenre = genre.id"
  >
    {{ genre.name }}
  </button>
</div>

  <!-- 投稿ボタン -->
  <button type="submit" class="submit-btn">投稿</button>


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

.genre-buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}

.genre-buttons button {
  height: 40px;           /* 全ボタン共通の高さ */
  padding: 0;
  font-size: 0.9em;
  border-radius: 8px;
  border: 1px solid #007bff;
  background-color: white;
  cursor: pointer;
  transition: 0.4s;               /* ← 回転も滑らかにするため少し長めに */
  transform-origin: center center; /* 中央を基準に回転・拡大 */
}

.genre-buttons button.active {
  background-color: #007bff;
  color: white;
  font-size: 1.1em;

  /* 🔥 1回転+拡大 */
  transform: rotate(360deg) scale(1.1);
}

.genre-buttons button:hover {
  background-color: #007bff;
  color: white;
}


.submit-btn {
  width: 100%;
  padding: 10px;
  font-size: 1em;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
.submit-btn:hover {
  background-color: #0056b3;
}
</style>
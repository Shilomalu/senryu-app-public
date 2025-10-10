<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const username = ref('');
const email = ref('');
const password = ref('');
const message = ref('');
const router = useRouter();

const handleRegister = async () => {
  try {
    const res = await fetch('http://localhost:3001/api/users/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username.value,
        email: email.value,
        password: password.value,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '登録に失敗しました。');
    message.value = '登録に成功しました！ログインページに移動します。';
    setTimeout(() => router.push('/login'), 2000);
  } catch (err) {
    message.value = err.message;
  }
};
</script>

<template>
  <div class="form-container">
    <h1>新規ユーザー登録</h1>
    <form @submit.prevent="handleRegister">
      <div>
        <label for="username">ユーザー名</label>
        <input type="text" id="username" v-model="username" required />
      </div>
      <div>
        <label for="email">メールアドレス</label>
        <input type="email" id="email" v-model="email" required />
      </div>
      <div>
        <label for="password">パスワード</label>
        <input type="password" id="password" v-model="password" required />
      </div>
      <button type="submit">登録</button>
    </form>
    <p v-if="message">{{ message }}</p>
  </div>
</template>

<style scoped>
.form-container { max-width: 400px; margin: 0 auto; }
div { margin-bottom: 15px; }
label { display: block; margin-bottom: 5px; }
input { width: 100%; padding: 8px; box-sizing: border-box; }
button { width: 100%; padding: 10px; }
</style>
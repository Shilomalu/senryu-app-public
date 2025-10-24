<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const username = ref('');
const email = ref('');
const password = ref('');
const message = ref('');
const isError = ref('');
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
    throw err;
  }
};

// 【重要】フォームで呼び出すラッパー関数を定義し、エラーの真偽値を設定
const handleRegisterWithErrorCheck = async () => {
  isError.value = false; // 毎回リセット
  message.value = ''; // メッセージもリセット
  try {
    await handleRegister();
    // 成功時は isError は false のまま
  } catch (err) {
    // 失敗時: メッセージを設定し、isErrorをtrueにする
    message.value = err.message;
    isError.value = true;
  }
}
</script>

<template>
  <div class="form-container">
    <h1>入門</h1>     <form @submit.prevent="handleRegisterWithErrorCheck">       <div>
        <label for="username">ユーザー名</label>         <input type="text" id="username" v-model="username" required />
      </div>
      <div>
        <label for="email">メールアドレス</label>         <input type="email" id="email" v-model="email" required />
      </div>
      <div>
        <label for="password">パスワード</label>         <input type="password" id="password" v-model="password" required />
      </div>
      <button type="submit" class="register-button">入門</button>     </form>
    
        <p v-if="message" :class="{'error-message': isError, 'success-message': !isError}">
        {{ message }}
    </p>

    <div class="login-link-area">
        <p>既に登録済みですか？</p>
        <router-link to="/login" class="login-link">席入りはこちら</router-link>
    </div>
  </div>
</template>

<style scoped>
/* LoginViewと共通の和風デザインを適用 */
.form-container { 
    max-width: 400px; 
    margin: 60px auto; 
    padding: 40px 30px; 
    background-color: #ffffff;
    border: 1px solid #dcdcdc;
    border-radius: 10px; 
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); 
}

h1 { 
    text-align: center; 
    color: #4a4a4a; 
    margin-bottom: 35px; 
    font-size: 26px;
    font-weight: 500;
    letter-spacing: 2px;
    border-bottom: 2px solid #a8b082; 
    display: inline-block;
    padding-bottom: 5px;
}

/* フォーム要素 */
div { margin-bottom: 25px; } 

label { 
    display: block; 
    margin-bottom: 8px; 
    font-weight: bold; 
    color: #5d5d5d; 
    font-size: 14px;
}

input { 
    width: 100%; 
    padding: 12px; 
    box-sizing: border-box; 
    border: 1px solid #c0c0c0; 
    border-radius: 6px; 
    transition: border-color 0.3s;
}
input:focus {
    border-color: #a8b082; 
    outline: none;
    box-shadow: 0 0 0 3px rgba(168, 176, 130, 0.2); 
}

/* 入門ボタンのスタイル (LoginViewのボタンと同一デザイン) */
/* 【重要】座布団デザインの適用と修正 */
.register-button {
    width: 100%;
    padding: 16px; /* パディングを増やしてふっくらと */
    margin-top: 10px;
    
    background-color: #5c7b45; /* 座布団の色：深めの緑色 */
    color: white; 
    
    border: 3px solid #3d502d; /* 濃いめの縁取り */
    border-radius: 8px; 
    
    box-shadow: 0 6px 0 0 #3d502d; /* 影で立体感を強調 */
    
    cursor: pointer;
    font-size: 18px;
    font-weight: bold;
    letter-spacing: 2px; 
    
    transition: all 0.15s ease;
}

/* クリック時 (座布団が沈む効果) */
.register-button:active {
    background-color: #536b3d;
    box-shadow: 0 2px 0 0 #3d502d; 
    transform: translateY(4px); 
}

.register-button:hover {
    background-color: #6a8b51;
}

/* メッセージのスタイル (LoginViewと共通) */
.error-message {
    color: #d9534f;
    background-color: #fcebeb;
    border: 1px solid #ebccd1;
    padding: 10px;
    border-radius: 4px;
    text-align: center;
    margin-top: 30px;
}
.success-message {
    color: #5cb85c;
    background-color: #f1f8f1;
    border: 1px solid #d6e9c6;
    padding: 10px;
    border-radius: 4px;
    text-align: center;
    margin-top: 30px;
}

/* 席入りリンクのエリア (LoginViewと共通) */
.login-link-area {
    text-align: center;
    margin-top: 40px; 
    padding-top: 20px;
    border-top: 1px solid #eeeeee;
}
.login-link-area p {
    color: #777;
    margin-bottom: 10px;
    font-size: 14px;
}
.login-link {
    color: #7b8e5c; 
    text-decoration: none;
    font-weight: bold;
}
.login-link:hover {
    text-decoration: underline;
}
</style>
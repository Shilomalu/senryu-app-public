<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const email = ref('');
const password = ref('');
const message = ref('');
const router = useRouter();

const handleLogin = async () => {
  try {
    const res = await fetch('http://localhost:3001/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.value,
        password: password.value,
      }),
    });
    // ログイン->席入り、新規登録->入門、タイムライン->句会
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '席入りできませんでした。');
    
    localStorage.setItem('token', data.token); // トークンをブラウザに保存
    message.value = '席入りしました！句会に移動します。';
    setTimeout(() => router.push('/'), 2000);
  } catch (err) {
    message.value = err.message;
  }
};

// メッセージがエラーかどうか判定する算出プロパティを追加
const isError = ref(false);// 初期化

// handleLogin内でエラー時にisErrorをtrueに設定する
const handleLoginWithErrorCheck = async () => {
  isError.value = false; // 毎回リセット
  try {
    await handleLogin();
  } catch (err) {
    message.value = err.message;
    isError.value = true;
  }
}
</script>

<template>
  <div class="form-container">
    <h1>席入り（ログイン）</h1>
    <form @submit.prevent="handleLoginWithErrorCheck">
      <div>
        <label for="email">メールアドレス</label>
        <input type="email" id="email" v-model="email" required />
      </div>
      <div>
        <label for="password">パスワード</label>
        <input type="password" id="password" v-model="password" required />
      </div>
      <button type="submit" class="login-button">席入り</button>
    </form>
    
    <p v-if="message" :class="{'error-message': isError, 'success-message': !isError}">
    {{ message }}
    </p>

    <div class="register-link-area">
        <p>句会への参加登録はお済みですか？</p>
        <router-link to="/register" class="register-link">入門（新規登録）はこちら</router-link>
    </div>
  </div>
</template>

<style scoped>
/* 基本設定とコンテナデザインの改善 */
.form-container { 
    max-width: 400px; 
    margin: 60px auto; /* 上下の余白を増やして中央に配置 */
    padding: 40px 30px;  /* パディングを増やしてゆったりと */
    background-color: #ffffff; /* 白い紙のような背景 */
    border: 1px solid #dcdcdc;
    border-radius: 10px; 
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); /* 影を加えて立体感を出す */
}

h1 { 
    text-align: center; 
    color: #4a4a4a; /* 落ち着いたグレー */
    margin-bottom: 35px; 
    font-size: 26px;
    font-weight: 500;
    letter-spacing: 2px; /* 字間を空けて上品に */
    border-bottom: 2px solid #a8b082; /* 和風のアクセントライン (例: 抹茶色) */
    display: inline-block;
    padding-bottom: 5px;
}

/* フォーム要素 */
div { margin-bottom: 25px; } /* 余白を増やして見やすく */

label { 
    display: block; 
    margin-bottom: 8px; 
    font-weight: bold; 
    color: #5d5d5d; 
    font-size: 14px;
}

input { 
    width: 100%; 
    padding: 12px; /* パディングを増やして入力しやすく */
    box-sizing: border-box; 
    border: 1px solid #c0c0c0; /* 少し濃いめの枠線 */
    border-radius: 6px; 
    transition: border-color 0.3s;
}
input:focus {
    border-color: #a8b082; /* フォーカス時にアクセントカラー */
    outline: none;
    box-shadow: 0 0 0 3px rgba(168, 176, 130, 0.2); /* 柔らかな光 */
}

/* 席入りボタンの改善 (和風カラーの採用) */
.login-button { 
    width: 100%; 
    padding: 14px; 
    background-color: #7b8e5c; /* 渋めの緑 (苔色や若草色) */
    color: white; 
    border: none; 
    border-radius: 6px; 
    cursor: pointer; 
    font-size: 18px;
    font-weight: bold;
    letter-spacing: 1px;
    transition: background-color 0.3s, transform 0.1s;
}
.login-button:hover {
    background-color: #5d6d45; /* ホバーで暗く */
}
.login-button:active {
    transform: translateY(1px); /* クリック時に沈む効果 */
}

/* メッセージのスタイル (エラー/成功) */
.error-message {
    color: #d9534f; /* 赤色 */
    background-color: #fcebeb; /* 非常に薄い赤背景 */
    /* ... 他は既存のままでOK */
    margin-top: 30px;
}
.success-message {
    color: #5cb85c; /* 緑色 */
    background-color: #f1f8f1; /* 非常に薄い緑背景 */
    /* ... 他は既存のままでOK */
    margin-top: 30px;
}

/* 新規登録リンクのエリアの改善 */
.register-link-area {
    text-align: center;
    margin-top: 40px;  /* 上部余白を大きく */
    padding-top: 20px;
    border-top: 1px solid #eeeeee;
}
.register-link-area p {
    color: #777;
    margin-bottom: 10px;
    font-size: 14px;
}
.register-link {
    color: #7b8e5c; /* ボタンと同じ和風カラー */
    text-decoration: none;
    font-weight: bold;
}
.register-link:hover {
    text-decoration: underline;
}
</style>
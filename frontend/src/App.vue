<script setup>
import { ref, onMounted } from 'vue';
import { RouterView, RouterLink } from 'vue-router';
import { jwtDecode } from 'jwt-decode';

// --- スプラッシュ画面制御 ---
const showSplash = ref(true);
const fadingOut = ref(false);

onMounted(() => {
  // 2秒表示
  setTimeout(() => {
    fadingOut.value = true; // フェードアウト開始

    // フェードアウトが終わったら非表示へ
    setTimeout(() => {
      showSplash.value = false;
    }, 800);
  }, 2000);

  // --- トークンチェック ---
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;

      if (decoded.exp < currentTime) {
        console.log('トークンの有効期限切れ。削除します。');
        localStorage.removeItem('token');
      }

    } catch (error) {
      console.error('無効なトークン形式。削除します。', error);
      localStorage.removeItem('token');
    }
  }
});
</script>

<template>
  <!-- 🔥 スプラッシュ画面 -->
  <div
    v-if="showSplash"
    :class="['splash', fadingOut ? 'fade-out' : 'fade-in']"
  >
    <img src="/senly_logo.png" class="splash-logo" />
  </div>

  <!-- 🔥 アプリ本体 -->
  <div v-else>
    <main class="content">
      <RouterView />
    </main>

    <footer class="tab-bar">
      <RouterLink to="/" class="tab-link">
        <span>ホーム</span>
      </RouterLink>
      <RouterLink to="/search" class="tab-link">
        <span>検索</span>
      </RouterLink>
      <RouterLink to="/post" class="tab-link">
        <span>投稿</span>
      </RouterLink>
      <RouterLink to="/profile" class="tab-link">
        <span>プロフィール</span>
      </RouterLink>
      <RouterLink to="/dfumi" class="tab-link">
        <span>ダイレクトふみ</span>
      </RouterLink>
    </footer>
  </div>
</template>

<style scoped>
/* =========================
   スプラッシュ背景
========================= */
.splash {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #ffffff;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 99999;
}

/* =========================
   ふわっと表示 → フェードアウト
========================= */
.fade-in .splash-logo {
  animation: splashIn 1.6s ease-out forwards;
}

.fade-out .splash-logo {
  animation: splashOut 0.8s ease-in forwards;
}

/* --- 表示アニメーション（俳句アプリ風） --- */
@keyframes splashIn {
  0% {
    opacity: 0;
    transform: scale(0.6);
    filter: blur(4px);
  }
  60% {
    opacity: 1;
    transform: scale(1.05);
    filter: blur(0px);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* --- 消えるアニメーション --- */
@keyframes splashOut {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(0.8);
    filter: blur(3px);
  }
}

/* --- ロゴサイズ調整 --- */
.splash-logo {
  width: 250px; /* 大きめ */
  border-radius: 50%;
}

/* =========================
   ここから下は通常のあなたのCSS
========================= */
.content {
  padding-bottom: 80px;
}
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  height: 60px;
  background-color: #ffffff;
  border-top: 1px solid #e0e0e0;
  box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.05);
  align-items: stretch;
}

.tab-link {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #888;
  text-decoration: none;
  font-size: 12px;
  height: 100%;
  box-sizing: border-box;
}
.router-link-active {
  color: #007bff;
  border-bottom: 5px solid #007bff;
  background-color: hwb(210 75% 0%);
  font-size: 1.1rem;
}
</style>

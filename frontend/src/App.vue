<script setup>
import { ref, onMounted, watch } from 'vue';
import { RouterView, RouterLink } from 'vue-router';
import { jwtDecode } from 'jwt-decode';

// --- スプラッシュ画面制御 ---
const showSplash = ref(true);
const fadingOut = ref(false);

const notifications = ref([]); // 通知一覧

// tokenをリアクティブ化
const token = ref(localStorage.getItem("token"));

// tokenが変わったらlocalStorageに反映
watch(token, (val) => {
  if (val) localStorage.setItem("token", val);
  else localStorage.removeItem("token");
});

// 通知を削除する関数
const removeNotification = (id) => {
  notifications.value = notifications.value.filter(n => n.id !== id)

  // 必要ならサーバー側も削除
  fetch(`/api/notifications/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token.value}`
    }
  }).catch(err => console.error("通知削除エラー:", err))
}


// アプリケーションがマウント（準備完了）された時に実行する処理
  // もしトークンが存在すれば、有効かどうかをチェック
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
  if (token.value) {
    try {
      const decoded = jwtDecode(token.value);
      const currentTime = Date.now() / 1000;

      if (decoded.exp < currentTime) {
        console.log('トークンの有効期限切れ。削除します。');
        token.value = null;
      }

    } catch (error) {
      console.error('無効なトークン形式。削除します。', error);
      token.value = null;
    }
  }

  // マウント時に通知を取得
  fetchNotifications();
  // トークンが存在しなければ、元々ログアウト状態なので何もしない
});

// API から通知を取得して notifications に格納
const fetchNotifications = async () => {
  if (!token.value) return;

  try {
    const res = await fetch("/api/notifications", {
      headers: {
        Authorization: `Bearer ${token.value}`
      }
    });

    if (!res.ok) throw new Error("通知取得に失敗");

    notifications.value = await res.json();

  } catch (err) {
    console.error("通知取得エラー:", err);
  }
};
</script>

<template>
 <div id = "app">

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
       <RouterView :notifications="notifications" @remove="removeNotification" />
    </main>

  


  <footer class="tab-bar">
    <RouterLink to="/" class="tab-link">
      <span>句会</span>
    </RouterLink>
    <RouterLink to="/search" class="tab-link">
      <span>検索</span>
    </RouterLink>
    <RouterLink to="/post" class="tab-link">
      <span>投稿</span>
    </RouterLink>
    <RouterLink to="/profile" class="tab-link">
      <span>句歴</span>
    </RouterLink>
    <RouterLink to="/dfumi" class="tab-link">
      <span>ふみ</span>
    </RouterLink>
    <RouterLink to="/notifications" class="tab-link">
      <span>お知らせ</span>
    </RouterLink>
  </footer>
  </div>
  
  
    
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
  width: 500px; /* 大きめ */
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
  color: #6c8a4a;
  border-bottom: 5px solid #6c8a4a;
  background-color: hwb(124 83% 0%);
  font-size: 1.1rem;
}

</style>
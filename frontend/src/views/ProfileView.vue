<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import axios from 'axios';
import PostCard from '@/components/PostCard.vue';

const router = useRouter();

// ログイン状態
const isLoggedIn = ref(false);

// ユーザー情報
const userId = ref(null)
const username = ref('');
const email = ref('');
const profile_text = ref('');
const posts = ref([]);
const favorite = ref(null);

// JWTトークン
const token = localStorage.getItem('token');

//　お気に入りの一句用
const showModal = ref(false);
const openFavoriteModal = () => (showModal.value = true);
const closeModal = () => (showModal.value = false);


// ログイン状態チェックとプロフィール取得
const loadProfile = async () => {
  if (!token) {
    isLoggedIn.value = false;
    return;
  }

  isLoggedIn.value = true;

  try {
    // プロフィール取得
    const { data } = await axios.get('/api/users/me', {
      headers: { Authorization: `Bearer ${token}` }
    });

    userId.value = data.id
    username.value = data.username;
    email.value = data.email;
    profile_text.value = data.profile_text;

    // 自分の投稿取得
    const timelineRes = await axios.get(`/api/posts/user/${data.id}`);
    posts.value = timelineRes.data;

    // お気に入りの一句があれば取得
    if (data.favorite_id) {
      const favPost = timelineRes.data.find(post => post.id === data.favorite_id);
      if (favPost) {
        favorite.value = favPost;
      }
    }

  } catch (err) {
    console.error(err);
    alert('プロフィールの取得に失敗しました');
    isLoggedIn.value = false;
  }
};

// 投稿をお気に入りに設定
const selectFavorite = async (post) => {
  try {
    await axios.put(
      '/api/users/me',
      { favorite_id: post.id },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    favorite.value = post; // 画面上に反映
    closeModal();
  } catch (err) {
    console.error('お気に入り設定エラー:', err);
    alert('お気に入りに設定できませんでした');
  }
};

onMounted(() => {
  loadProfile();
});

// ログアウト
const logout = () => {
  localStorage.removeItem('token');
  isLoggedIn.value = false;
  router.push('/');
};

// プロフィール編集
const goEdit = () => {
  router.push('/profile/edit');
};
</script>

<!--
<template>
  <div>
    <div v-if="isLoggedIn" class="profile-container">
      <div class="profile-header">
        <h1>マイプロフィール</h1>
        <div class="button-group">
          <button @click="goEdit" class="edit-btn">編集</button>
          <button @click="logout" class="logout-btn">ログアウト</button>
        </div>
      </div>
      
      <div class="profile-info">
        <ul>
          <li><strong>ユーザー名：</strong> {{ username }}</li>
          <li><strong>メールアドレス：</strong> {{ email }}</li>
          <li><strong>自己紹介：</strong> {{ profile_text }}</li>
          <li>
            <strong>投稿した川柳一覧：</strong>
            <ul>
              <li v-for="post in posts" :key="post.user_id">{{ post.content }}</li>
            </ul>
          </li>
        </ul>
      </div>
    </div>

    <div v-else class="auth-prompt">
      <h2>ログインが必要です</h2>
      <p>プロフィールを閲覧・編集するには、ログインまたは新規登録をしてください。</p>
      <div class="button-group">
        <RouterLink to="/login" class="button">ログイン画面へ</RouterLink>
        <RouterLink to="/register" class="button">新規登録画面へ</RouterLink>
      </div>
    </div>
  </div>
</template>
-->

<template>
  <div>
    <div v-if="isLoggedIn" class="profile-container">
      <div class="profile-header">
        <h1>マイプロフィール</h1>
        <div class="button-group">
          <button @click="goEdit" class="edit-btn">編集</button>
          <button @click="logout" class="logout-btn">ログアウト</button>
        </div>
      </div>

      <div class="profile-info">
        <ul>
          <li><strong>ユーザー名：</strong> {{ username }}</li>
          <!--<li><strong>メールアドレス：</strong> {{ email }}</li> -->
          <li><strong>自己紹介：</strong> {{ profile_text }}</li>
          <li>
            <strong>お気に入りの一句：</strong>
            <div v-if="favorite">
              {{ favorite.content }}
              <button @click="openFavoriteModal" class="edit-favorite-btn">変更</button>
            </div>
            <div v-else>
              <button @click="openFavoriteModal" class="add-favorite-btn">お気に入りの一句を追加</button>
            </div>
          </li>
        </ul>
      </div>
      <section class="user-posts">
        <h3>過去の投稿</h3>

        <div class="posts-grid">
          <PostCard
            v-for="post in posts"
            :key="post.id"
            :post="post"
            :current-user="{ id: userId }"
          />
        </div>

        <div v-if="!posts.length" class="no-posts">投稿がまだありません</div>
      </section>
    </div>

    <div v-else class="auth-prompt">
      <h2>ログインが必要です</h2>
      <p>プロフィールを閲覧・編集するには、ログインまたは新規登録をしてください。</p>
      <div class="button-group">
        <RouterLink to="/login" class="button">ログイン画面へ</RouterLink>
        <RouterLink to="/register" class="button">新規登録画面へ</RouterLink>
      </div>
    </div>

    <!-- 過去投稿モーダル -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal">
        <h3>お気に入りに設定する句を選択</h3>
        <button class="close-btn" @click="closeModal">×</button>
        <div class="modal-content">
          <ul>
            <li v-for="post in posts" :key="post.id"  
            @click="selectFavorite(post)" 
            class="selectable-post">
              {{ post.content }}
            </li>

          </ul>
        </div>
      </div>
    </div>
  </div>
</template>


<style scoped>
.profile-container {
  max-width: 600px;
  margin: 2rem auto;
  padding: 2rem;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  background-color: #fff;
  text-align: center;
  color: #000;
}

.profile-info {
  text-align: left;
  margin-top: 2rem;
}

.profile-info ul {
  list-style: none;
  padding: 0;
}

.profile-info li {
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.user-posts {
  margin-top: 3rem;
}

.posts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.no-posts {
  text-align: center;
  color: #666;
  margin-top: 1rem;
}

.button-container {
  display: flex;
  justify-content: flex-end; /* 右寄せ */
  gap: 10px; /* ボタン間のスペース */
  margin-top: 2rem;
}

.profile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.profile-header h1 {
  font-weight: bold;
  font-size: 1.8rem;
  margin-left: 10px;
  margin-right: 20px;
}

.button-group {
  display: flex;
  gap: 10px;
}

.button-group button {
  padding: 8px 18px;
  border: none;
  border-radius: 6px;
  color: #fff;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.edit-btn {
  background-color: #007bff;
}

.edit-btn:hover {
  background-color: #0056b3;
}

.logout-btn {
  background-color: #dc3545;
}

.logout-btn:hover {
  background-color: #a71d2a;
}

/* モーダル用 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 20px;
  border-radius: 10px;
  max-height: 80%;
  overflow-y: auto;
  width: 400px;
  position: relative;
}

.modal-content {
  max-height: 60vh;
  overflow-y: auto;
  margin-top: 10px;
}

.close-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: transparent;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
}

.selectable-post {
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
}

.selectable-post:hover {
  background-color: #f0f0f0;
}

.add-favorite-btn {
  margin-left: 10px;
  padding: 4px 10px;
  font-size: 0.9rem;
  background-color: #007bff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: #ffffff;
}

.add-favorite-btn:hover {
  background-color: #0056b3;
}

.edit-favorite-btn {
  margin-left: 10px;
  padding: 4px 10px;
  font-size: 0.9rem;
  background-color: #007bff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: #ffffff;
}

.edit-favorite-btn:hover {
  background-color: #0056b3;
}


/* ログインを促す画面用のスタイル */
.auth-prompt {
  max-width: 500px;
  margin: 4rem auto;
  padding: 2rem;
  text-align: center;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  
}

.auth-prompt h2 {
  margin-bottom: 1rem;
}

.auth-prompt p {
  margin-bottom: 2rem;
  
}

.button-group {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.button {
  display: inline-block;
  padding: 12px 24px;
  background-color: #007bff;
  color: white;
  text-decoration: none;
  border-radius: 5px;
  font-weight: bold;
}


</style>
<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import axios from 'axios';
import PostCard from '@/components/PostCard.vue';
import icon0 from "@/assets/icons/kajinsample0.jpeg"
import icon1 from "@/assets/icons/kajinsample1.jpeg"
import icon2 from "@/assets/icons/kajinsample2.jpeg"
import icon3 from "@/assets/icons/kajinsample3.jpeg"
import icon4 from "@/assets/icons/kajinsample4.jpeg"
import icon5 from "@/assets/icons/kajinsample5.jpeg"
import icon6 from "@/assets/icons/kajinsample6.jpeg"
import icon7 from "@/assets/icons/kajinsample7.jpeg"
import icon8 from "@/assets/icons/kajinsample8.jpeg"
import icon9 from "@/assets/icons/kajinsample9.jpeg"
import icon10 from "@/assets/icons/kajinsample10.jpeg"
import icon11 from "@/assets/icons/kajinsample11.jpeg"

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

const icons = [
  { id: 0, src: icon0 },
  { id: 1, src: icon1 },
  { id: 2, src: icon2 },
  { id: 3, src: icon3 },
  { id: 4, src: icon4 },
  { id: 5, src: icon5 },
  { id: 6, src: icon6 },
  { id: 7, src: icon7 },
  { id: 8, src: icon8 },
  { id: 9, src: icon9 },
  { id: 10, src: icon10 },
  { id: 11, src: icon11 }
];

const icon = ref(0)

// JWTトークン
const token = localStorage.getItem('token');

//　お気に入りの一句用
const showFavModal = ref(false);
const openFavModal = () => (showFavModal.value = true);
const closeFavModal = () => (showFavModal.value = false);


// アイコン変更用
const showIconModal = ref(false);
const openIconModal = () => (showIconModal.value = true);
const closeIconModal = () => (showIconModal.value = false);


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

    console.log("me の結果:", data); 

    userId.value = data.id
    username.value = data.username;
    email.value = data.email;
    profile_text.value = data.profile_text;
    icon.value = data.icon_index ?? 0;

    // 自分の投稿取得
    const timelineRes = await axios.get(`/api/posts/user/${data.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    posts.value = timelineRes.data.map(post => ({
       ...post,
       // MySQLから返ってくる 1/0 を Boolean に変換しておくと PostCard が扱いやすい
       isLiked: Boolean(post.isLiked), 
       likesCount: Number(post.likesCount)
    }));

    // お気に入りの一句があれば取得
    if (data.favorite_id) {
      const favPost = timelineRes.data.find(post => post.id === data.favorite_id);
      if (favPost) favorite.value = favPost;
    }

  } catch (err) {
    console.error(err);
    alert('句歴の取得に失敗しました');
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
    closeFavModal();
  } catch (err) {
    console.error('お気に入り設定エラー:', err);
    alert('お気に入りに設定できませんでした');
  }
};

// アイコンの変更
const selectIcon = async (iconId) => {
  try {
    await axios.post("/api/users/me/icon",
      { icon: iconId },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    icon.value = iconId; // 画面反映
    closeIconModal();
  } catch (error) {
    console.error(error);
  }
}

// 投稿削除機能
const handleDelete = async (postId) => {
  if (!confirm('本当にこの投稿を削除しますか？')) return;

  try {
    await axios.delete(`/api/posts/${postId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    // 成功したら画面のリストからも削除して、見た目を更新する
    posts.value = posts.value.filter(post => post.id !== postId);
    
    // もし削除した投稿がお気に入り（選り抜きの一句）だった場合、表示を消す
    if (favorite.value && favorite.value.id === postId) {
      favorite.value = null;
    }

    alert('削除しました');
  } catch (err) {
    console.error('削除エラー:', err);
    alert('削除に失敗しました');
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
        <h1>自分の句歴</h1>
        <div class="button-group">
          <button @click="goEdit" class="edit-btn">編集</button>
          <button @click="logout" class="logout-btn">退出</button>
        </div>
      </div>
      
      <div class="profile-info">
        <ul>
          <li><strong>俳号：</strong> {{ username }}</li>
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
      <h2>席入り（ログイン）が必要です</h2>
      <p>句歴を閲覧・編集するには、席入りまたは入門（新規登録）をしてください。</p>
      <div class="button-group">
        <RouterLink to="/login" class="button">席入り画面へ</RouterLink>
        <RouterLink to="/register" class="button">入門画面へ</RouterLink>
      </div>
    </div>
  </div>
</template>
-->

<template>
  <div>
    <div v-if="isLoggedIn" class="form-container">
      <div class="profile-header">
        <h1>句歴</h1>

        <div class="button-group">
          <button @click="goEdit" class="edit-btn common-btn">編集</button>
          <button @click="logout" class="logout-btn alert-btn">退出</button>
        </div>

      </div>


      <div class="icon-wrapper" @click="openIconModal">
        <img :src="icons[icon].src" class="profile-icon" />
        <h3 style="color: #888;">現在の姿</h3>
      </div>

      <br></br>
      <br></br>

      <div class="profile-info">
        <ul>
          <li style="font-size: 1.2rem;"><strong>俳号：</strong> {{ username }}</li>
          <!--<li><strong>メールアドレス：</strong> {{ email }}</li> -->
          <li style="font-size: 1.2rem;"><strong>添え書き：</strong>{{ profile_text }}</li>
        </ul>
      </div>
    
      <div class="favorite-item">
        <div v-if="favorite">
          <div class="favorite-true">
            代表作
            <button @click="openFavModal" class="edit-favorite-btn common-btn">変更</button>
          </div>
          <PostCard :post="favorite" />
        </div>

        <div v-else class="favorite-box">
          <button @click="openFavModal" class="add-favorite-btn common-btn">
            代表作を追加
          </button>
        </div>
      </div>

      <br></br>
      <h3 style="text-align: center; font-size: 1.2rem;">過去の投稿一覧</h3>


      <section class="user-posts">
        <ul class="posts-grid">
          <li v-for="post in posts" :key="post.id">
            <PostCard
              :post="post"
              :current-user="{ id: userId }"
              @delete="handleDelete"
            />
          </li>
        </ul>

        <div v-if="!posts.length" class="no-posts">
          投稿がまだありません
        </div>
      </section>
    </div>

    <div v-else class="auth-prompt">
      <h2 style="color: black;">席入り（ログイン）が必要です</h2>
      <p style="color: black;">句歴（プロフィール）を閲覧・編集するには<br></br>席入りまたは入門をしてください。</p>
      <div class="button-group">
        <RouterLink to="/login" class="button common-btn">席入り画面へ</RouterLink>
        <RouterLink to="/register" class="button common-btn">入門画面へ</RouterLink>
      </div>
    </div>

    <!-- 過去投稿用 -->
    <div v-if="showFavModal" class="modal-overlay">
      <div class="modal">
        <h3>代表作に設定する句を選択</h3>
        <button class="close-btn" @click="closeFavModal">×</button>
        <div class="modal-content">
          <ul v-if="posts.length">
            <li v-for="post in posts" :key="post.id"  
            @click="selectFavorite(post)" 
            class="selectable-post"
            style="color: black;">
              {{ post.content }}
            </li>
          </ul>
          <div v-else>
            投稿がまだありません
          </div>
        </div>
      </div>
    </div>

    <!-- アイコン変更用　-->
    <div v-if="showIconModal" class="modal-overlay">
      <div class="modal icon-modal">
        <h3 style="padding-left:20px; padding-top:10px;">姿を選択</h3>
        <button class="close-btn" @click="closeIconModal"><h2>×</h2></button>

        <div class="icon-list">
          <div
            v-for="iconItem in icons"
            :key="iconItem.id"
            class="icon-item"
            :class="{ 'locked-icon': iconItem.id >= 9 && posts.length < 5 }"
          >
            <img 
              :src="iconItem.src" 
              class="icon-preview"
              :style="{ opacity: (iconItem.id >= 9 && posts.length < 5) ? 0.1: 1, cursor: (iconItem.id >= 9 && posts.length < 5) ? 'not-allowed' : 'pointer' }"
              @click.stop="(iconItem.id >= 9 && posts.length < 5) ? null : selectIcon(iconItem.id)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<style scoped>
.form-container {
  width: 100%;
  margin: 0 auto;
  flex-shrink: 1;
  color: #000;
}


.profile-item {
  display: flex;
  align-items: flex-start;
}

.profile-item strong {
  white-space: nowrap;
  margin-right: 4px;
}

.profile-text {
  white-space: pre-line;
}


.profile-info {
  text-align: left;
  margin-top: 0;
  flex-grow: 1;
}

.profile-info ul {
  list-style: none;
  padding: 0;
}

.profile-info li {
  margin-bottom: 1rem;
  font-size: 1rem;
}

.profile-info-content {
  display: flex;
  align-items: flex-start;
  margin-bottom: 2rem;
  gap: 32px;
}

.icon-wrapper {
  width: 150px;
  height: 150px;
  cursor: pointer;
  margin: 0 auto;
}

.icon-edit-overlay {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: rgba(0,0,0,0.6);
  color: white;
  padding: 6px 8px;
  border-radius: 50%;
  font-size: 16px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.icon-wrapper:hover .icon-edit-overlay {
  opacity: 1;
}

.profile-icon {
  width: 150px;
  height: 150px;
  object-fit: cover;
  border-radius: 16px;
  border: 3px solid #ccc;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}


.icon-preview {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #ccc;
  cursor: pointer;
}

.icon-list {
  display: flex;
  flex-wrap: wrap; 
  gap: 5px;
  justify-content: center; 
  margin-top: 20px;
  position: relative;  
}

.icon-item {
  cursor: pointer;
  padding: 3px;
  border: 3px solid transparent; 
  border-radius: 12px;
  transition: all 0.2s ease;
}

.icon-preview:hover {
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
}

.user-posts {
  width: 100%;
  flex-grow: 1;
  display: flex;
  flex-direction: row;
  gap: 1.5rem;
  overflow-x: auto;
  overflow-y: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  padding-top: 20px;
  padding-bottom: 60px;
}

.user-posts::-webkit-scrollbar {
  display: none;
}

.posts-grid {
  display: flex;
  flex-direction: row;
  gap: 1.5rem;
  padding: 0;
  margin: 0;
}

.posts-grid li {
  list-style: none;
  flex: 0 0 80vw;
  width: 100%;
  max-width: 400px;
  scroll-snap-align: center;
  height: auto;
}

.no-posts {
  width: 100%;
  text-align: center;
  padding: 20px;
  color: #888;
}


.favorite-true {
  text-align: center;
  font-size: 1.2rem;
  padding-top: 10px;
  padding-bottom: 10px;
}

.no-posts {
  text-align: center;
  color: #666;
  margin-top: 1rem;
  margin-left: 3.5rem;
}

.button-container {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 2rem;
}

.profile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
}

.profile-header h1 {
  font-weight: bold;
  font-size: 1.8rem;
  margin: 0;
}

.button-group {
  display: flex;
  gap: 10px;
}

.button-group button {
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 1rem;
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
  color: #000
}

.modal {
  background: white;
  padding: 20px;
  border-radius: 10px;
  max-height: 80%;
  overflow-y: auto;
  width: 380px;
  position: relative;
}

.modal-content {
  max-height: 60vh;
  overflow-y: auto;
  margin-top: 10px;
}

.icon-modal {
  height: 500px;
  width: 330px;
  overflow-y: hidden;
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 40px;
  background: transparent;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  z-index: 1010;
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
  margin: 0 auto;
  padding: 4px 10px;
  font-size: 0.9rem;
  border-radius: 4px;
}

.edit-favorite-btn {
  margin-left: 10px;
  padding: 4px 10px;
  font-size: 0.9rem;
  border-radius: 4px;
}


/* ログインを促す画面用のスタイル */
.auth-prompt {
  max-width: 100%;
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
  border-radius: 5px;
}


</style>
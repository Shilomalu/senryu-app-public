<template>
  <div class="page-container">
    <!-- 固定ヘッダー -->
    <div class="fixed-header">
      <div class="header-content">
        <h1 class="page-title">🎍川柳SNS🎍</h1>
        
        <!-- 右上のメニューボタン -->
        <button class="menu-toggle-btn" @click="toggleMenu">
          <span class="menu-icon">≡</span>
        </button>
      </div>

      <!-- ドロップダウンメニュー (開閉式) -->
      <transition name="menu-fade">
        <div v-if="isMenuOpen" class="dropdown-menu">
          <p class="menu-label">表示切り替え</p>
          <button 
            :class="['menu-item', { active: filter === 'all' }]" 
            @click="selectFilter('all')"
          >
            🏠 一覧
          </button>
          <button 
            :class="['menu-item', { active: filter === 'likes' }]" 
            @click="selectFilter('likes')"
          >
            🌸 いとをかし
          </button>
          <button 
            :class="['menu-item', { active: filter === 'following' }]" 
            @click="selectFilter('following')"
          >
            👤 フォロー中
          </button>
          <button 
            :class="['menu-item', { active: filter === 'ranking' }]" 
            @click="selectFilter('ranking')"
          >
            📅 今日のお題
          </button>
        </div>
      </transition>

      <!-- メニューを開いている時の背景カバー（クリックで閉じる） -->
      <div v-if="isMenuOpen" class="menu-overlay" @click="isMenuOpen = false"></div>
    </div>

    <!-- タイムライン -->
    <div class="timeline-content">
      
      <!-- 現在表示中のフィルタ名 -->
      <div class="current-filter-info">
        <span class="filter-badge">{{ currentFilterName }}</span>
      </div>

      <transition name="switch" mode="out-in">
        <transition-group
          v-if="timeline.length"
          :key="filter"
          name="fade-slide"
          tag="ul"
          class="timeline"
          id="timeline-scroll-area"
        >
          <!-- ▼ 左端（最古）に「もっと見る」 -->
          <li key="load-more" class="more-area-left">
            <div class="load-more-wrapper">
              <button 
                v-if="hasMore" 
                class="load-more-btn" 
                @click="loadMore" 
                :disabled="loadingMore"
              >
                {{ loadingMore ? '読み込み中...' : 'もっと見る' }}
              </button>
              <p v-else class="no-more-message">これ以上投稿はありません</p>
            </div>
          </li>

          <!-- ▼ 投稿一覧 -->
          <li v-for="post in orderedTimeline" :key="post.id">
            <PostCard :post="post" :currentUser="currentUser" @delete="handleDelete" />
          </li>
        </transition-group>

        <p v-else class="empty-message" :key="filter + '-empty'">
          {{ emptyMessage }}
        </p>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { jwtDecode } from 'jwt-decode';
import PostCard from '../components/PostCard.vue';

const timeline = ref([]);
const filter = ref('all');
const message = ref('');
const isMenuOpen = ref(false); // メニューの開閉状態

const token = ref(localStorage.getItem('token'));
const currentUser = ref(token.value ? jwtDecode(token.value) : null);

const PAGE_SIZE = 10;
const hasMore = ref(true);
const loadingMore = ref(false);

// 逆順で右端が最新になるように並べ替え
const orderedTimeline = computed(() => {
  return [...timeline.value].reverse();
});

// 現在のフィルター名の表示用
const currentFilterName = computed(() => {
  switch (filter.value) {
    case 'all': return '全投稿一覧';
    case 'likes': return 'いとをかし(いいね)した投稿';
    case 'following': return 'フォロー中の投稿';
    case 'ranking': return '今日のお題';
    default: return '一覧';
  }
});

// メニューの開閉切り替え
const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

// メニューからフィルタを選択した時の処理
const selectFilter = (mode) => {
  filter.value = mode;
  isMenuOpen.value = false; // メニューを閉じる
  timeline.value = [];
  hasMore.value = true;
  fetchTimeline(true);
};

const fetchTimeline = async (isInitialLoad = false) => {
  try {
    let endpoint = '/api/posts/timeline';
    if (filter.value === 'likes') endpoint = '/api/posts/likes';
    else if (filter.value === 'following') endpoint = '/api/posts/timeline/following';
    // else if (filter.value === 'ranking') endpoint = '/api/posts/theme/today';

    const res = await fetch(`${endpoint}?offset=${timeline.value.length}&limit=${PAGE_SIZE}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token.value}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'タイムラインの読み込みに失敗しました。');

    const newPosts = data
      .map(post => {
        // ルビデータの変換処理 
        let parsedRuby = [];
        try {
            // 文字列ならJSONとして解析して配列に戻す
            if (typeof post.ruby_content === 'string') {
                parsedRuby = JSON.parse(post.ruby_content);
            } 
            // すでに配列ならそのまま使う
            else if (Array.isArray(post.ruby_content)) {
                parsedRuby = post.ruby_content;
            }
        } catch (e) {
            console.error('JSON parse error', e);
            parsedRuby = []; // エラーなら空にしておく
        }
        return {
            ...post,
            ruby_content: parsedRuby, // ★変換したデータをセット
            likesCount: Number(post.likesCount ?? post.likeCount ?? 0),
            isLiked: Boolean(post.isLiked || post.is_liked || post.isLiked === 1),
            likedUserIds: post.likes ? post.likes.map(like => like.user_id) : (post.likedUserIds || []),
        };
      })
      .filter(post => !timeline.value.some(p => p.id === post.id));

    if (isInitialLoad) {
         timeline.value = newPosts;
    } else {
         timeline.value.push(...newPosts);
    }

    if (!newPosts.length || newPosts.length < PAGE_SIZE) hasMore.value = false;

    if (isInitialLoad) {
        await nextTick();
        setTimeout(() => {
            scrollToLatest();
        }, 100);
    }

  } catch (err) {
    console.error(err);
    message.value = err.message || 'データ取得中にエラーが発生しました';
  }
};

const loadMore = async () => {
  if (!hasMore.value || loadingMore.value) return;
  loadingMore.value = true;
  await fetchTimeline();
  loadingMore.value = false;
};

const handleDelete = async (postId) => {
  if (!confirm('本当にこの投稿を削除しますか？')) return;
  try {
    const res = await fetch(`/api/posts/${postId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token.value}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    timeline.value = timeline.value.filter(post => post.id !== postId);
    message.value = data.message;
  } catch (err) {
    message.value = err.message;
  }
};

const emptyMessage = computed(() => {
  if (filter.value === 'all') return '投稿はありません';
  if (filter.value === 'likes') return 'いとをかしの投稿はありません';
  if (filter.value === 'following') return 'フォローしたアカウントの投稿はありません';
  if (filter.value === 'ranking') return '今日のお題の投稿はまだありません';
  return '';
});

const scrollToLatest = () => {
  const el = document.getElementById('timeline-scroll-area');
  if (el) {
    el.style.scrollBehavior = 'auto'; 
    el.scrollLeft = el.scrollWidth;
  }
};

onMounted(async () => {
  await fetchTimeline(true);
});
</script>

<style scoped>
.page-container {
  width: 100%;
  margin: 0;
  padding: 0;
}

/* --- ヘッダー周り --- */
.fixed-header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background-color: #fff;
  z-index: 1000;
  border-bottom: 1px solid #eee;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
  height: 60px; /* 高さを固定 */
}

.header-content {
  display: flex;
  justify-content: center; /* タイトルを中央に */
  align-items: center;
  height: 100%;
  position: relative; /* メニューボタンの配置基準 */
}

.page-title {
  font-family: "Yu Mincho", "serif";
  font-size: 1.5em;
  font-weight: bold;
  color: #333;
  margin: 0;
}

/* メニューボタン */
.menu-toggle-btn {
  position: absolute;
  right: 15px; /* 右端に配置 */
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
  border-radius: 50%;
  transition: background 0.2s;
}
.menu-toggle-btn:hover {
  background-color: #f0f0f0;
}
.menu-icon {
  font-size: 1.8rem;
  line-height: 1;
  color: #555;
}

/* ドロップダウンメニュー */
.dropdown-menu {
  position: absolute;
  top: 65px;
  right: 10px;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.15);
  width: 200px;
  z-index: 2000;
  overflow: hidden;
  padding: 10px 0;
  border: 1px solid #eee;
}

.menu-label {
  font-size: 0.8rem;
  color: #999;
  padding: 5px 15px;
  margin: 0;
  border-bottom: 1px solid #f5f5f5;
}

.menu-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: 12px 20px;
  background: none;
  border: none;
  font-size: 1rem;
  color: #333;
  cursor: pointer;
  transition: background 0.2s;
}
.menu-item:hover {
  background-color: #f9f9f9;
}
.menu-item.active {
  background-color: #e6f0ff;
  color: #007bff;
  font-weight: bold;
}

/* メニュー背景カバー (クリックして閉じる用) */
.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.05); /* ほんの少し暗く */
  z-index: 1500;
}

/* メニューのアニメーション */
.menu-fade-enter-active, .menu-fade-leave-active {
  transition: all 0.2s ease;
}
.menu-fade-enter-from, .menu-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* --- タイムライン周り --- */
.timeline-content {
  padding-top: 80px; /* ヘッダー＋バッジの分 */
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column; /* バッジとリストを縦に */
  box-sizing: border-box;
  padding-bottom: 80px;
}

.current-filter-info {
  text-align: center;
  margin-bottom: 10px;
}
.filter-badge {
  background-color: #eee;
  color: #555;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: bold;
}

.timeline {
  flex-grow: 1;
  display: flex;
  flex-direction: row;
  gap: 1.5rem;
  overflow-x: auto;
  overflow-y: auto;
  scroll-snap-type: x mandatory;
  padding: 0 1rem 1rem 1rem;
  scrollbar-width: none;
  padding-bottom: 200px;
}
.timeline::-webkit-scrollbar { display: none; }
.timeline li {
  flex: 0 0 auto;
  width: 80%;
  max-width: 500px;
  scroll-snap-align: center;
}

/* その他スタイル */
.empty-message { text-align: center; margin-top: 2rem; color: #888; width: 100%; }
.load-more-container { display: flex; justify-content: center; align-items: center; min-width: 100px; margin-right: 1rem; order: -1; }
.load-more-btn { height: 400px; background: #007bff; color: white; padding: 0 1.2rem; border-radius: 8px; border: none; cursor: pointer; }
.load-more-btn:disabled { opacity: 0.6; }
.no-more-message { color: #555; font-size: 0.9rem; writing-mode: vertical-rl; }
.fade-slide-enter-from { opacity: 0; transform: translateY(20px); }
.fade-slide-enter-active { transition: all 0.5s ease; }
</style>
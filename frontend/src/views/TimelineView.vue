<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue';
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
const rankingList = ref([]);       // 先週のランキング用
const currentThemePosts = ref([]); // 今週のお題投稿用
//追加変数
const jumping = ref('');

// 逆順で右端が最新になるように並べ替え
const orderedTimeline = computed(() => {
  return [...timeline.value].reverse();
});

// 現在のフィルター名の表示用
const currentFilterName = computed(() => {
  switch (filter.value) {
    case 'all': return '全投稿一覧';
    case 'likes': return 'いとをかし(いいね)した投稿';
    case 'following': return '文友の投稿';
    case 'ranking': return '先週の位 (TOP10)';
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
    if (filter.value === 'ranking') {
      const headers = { Authorization: `Bearer ${token.value}` };
      // 1. 先週のランキングを取得
      const resRanking = await fetch('/api/themes/ranking/latest', { headers });
      const dataRanking = await resRanking.json();
      
      // ルビのパース処理 (共通関数化するとベストですが、一旦ここに書きます)
      rankingList.value = parsePosts(dataRanking);

      // 2. 今週のお題投稿を取得
      const resCurrent = await fetch('/api/themes/current/posts', { headers });
      const dataCurrent = await resCurrent.json();
      
      // 今週の分は、右が最新になるように逆順にする
      currentThemePosts.value = parsePosts(dataCurrent).reverse();

      // ローディング終了
      hasMore.value = false; // ランキング画面では「もっと見る」は一旦無効に
      return; 
    }
    let endpoint = '/api/posts/timeline';
    if (filter.value === 'likes') endpoint = '/api/posts/likes';
    else if (filter.value === 'following') endpoint = '/api/posts/timeline/following';

    const res = await fetch(`${endpoint}?offset=${timeline.value.length}&limit=${PAGE_SIZE}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token.value}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || '句会の読み込みに失敗しました。');

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

// ★追加: データ変換用のヘルパー関数 (重複コードをまとめる)
const parsePosts = (data) => {
  if (!Array.isArray(data)) return [];
  return data.map(post => {
    let parsedRuby = [];
    try {
        if (typeof post.ruby_content === 'string') {
            parsedRuby = JSON.parse(post.ruby_content);
        } else if (Array.isArray(post.ruby_content)) {
            parsedRuby = post.ruby_content;
        }
    } catch (e) { parsedRuby = []; }

    return {
      ...post,
      ruby_content: parsedRuby,
      likesCount: Number(post.likesCount ?? post.fixed_likes_count ?? 0),
      likedUserIds: post.likedUserIds || [],
      isLiked: Boolean(post.isLiked),
      repliesCount: Number(post.repliesCount ?? 0),
    };
  });
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
    rankingList.value = rankingList.value.filter(post => post.id !== postId);
    currentThemePosts.value = currentThemePosts.value.filter(post => post.id !== postId);

    message.value = data.message;
  } catch (err) {
    message.value = err.message;
  }
};

const emptyMessage = computed(() => {
  if (filter.value === 'all') return '投稿はありません';
  if (filter.value === 'likes') return 'いとをかしの投稿はありません';
  if (filter.value === 'following') return '文友になった人の投稿はありません';
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

// タブ切り替え
const handleTabClick = (tabName) => {
  jumping.value = tabName;
  changeFilter(tabName);
  setTimeout(() => jumping.value = '', 1000);
};

const changeFilter = (mode) => {
  filter.value = mode;
  if (mode === 'ranking') {
    fetchThemePage();
  } else {
    timeline.value = [];
    hasMore.value = true;
    fetchTimeline();
  }
};


// 今週のお題ページ取得
const fetchThemePage = async () => {
  const headers = { Authorization: `Bearer ${token.value}` };

  const resRanking = await fetch('/api/themes/ranking/latest', { headers }); 
  const dataRanking = await resRanking.json();
  rankingList.value = parsePosts(dataRanking);

  const resCurrent = await fetch('/api/themes/current/posts', { headers });
  const dataCurrent = await resCurrent.json();
  currentThemePosts.value = parsePosts(dataCurrent).reverse();
};

const goHome = async () => {
  filter.value = 'all';
  timeline.value = [];
  hasMore.value = true;
  await fetchTimeline(true);  // 初期ロードとして読み込み直す
};


</script>

<template>
  <div class="page-container">
    <!-- 固定ヘッダー -->
    <div class="fixed-header">
      <h1 class="page-title" @click="goHome">🎍川柳巡り🎍</h1>
      <div class="tabs">
        <button
          :class="['tab-btn', { active: filter === 'all', jump: jumping === 'all' }]"
          @click="() => handleTabClick('all')"
        >一覧</button>
        <button
          :class="['tab-btn', { active: filter === 'likes', jump: jumping === 'likes' }]"
          @click="() => handleTabClick('likes')"
        >いとをかし</button>
        <button
          :class="['tab-btn', { active: filter === 'following', jump: jumping === 'following' }]"
          @click="() => handleTabClick('following')"
        >文友</button>
        <button
          :class="['tab-btn', { active: filter === 'ranking', jump: jumping === 'ranking' }]"
          @click="() => handleTabClick('ranking')"
        >今週のお題</button>
      </div>
    </div>

    <!-- タイムライン -->
    <div class="timeline-content">
      <div v-if="filter === 'ranking'" class="special-timeline-container">
    
        <section class="ranking-section">
          <h2 class="section-title">👑 先週の位 (TOP10)</h2>
          <ul class="timeline ranking-list">
            <li v-for="post in rankingList" :key="'rank-' + post.id">
              <div class="rank-badge">{{ post.rank }}位</div>
              <PostCard :post="post" :currentUser="currentUser" @delete="handleDelete" />
            </li>
          </ul>
        </section>

        <section class="current-theme-section">
          <h2 class="section-title">📅 今週のお題 募集中！</h2>
          <ul class="timeline">
            <li v-for="post in currentThemePosts" :key="'theme-' + post.id">
              <PostCard :post="post" :currentUser="currentUser" @delete="handleDelete" />
            </li>
            <li v-if="currentThemePosts.length === 0" class="no-post-msg">
              まだ投稿がありません。一番乗りを目指そう！
            </li>
          </ul>
        </section>

      </div>

      <transition name="switch" mode="out-in" v-else>
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
  /*height: 60px;  高さを固定 */
}

.header-content {
  display: flex;
  justify-content: center; /* タイトルを中央に */
  align-items: center;
  height: 100%;
  position: relative; /* メニューボタンの配置基準 */
}

.page-title {
  text-align: center;
  margin: 10px 0 5px;
  font-size: 1.8em;
  color: #333;
}

.tabs {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
}

@media (max-width: 600px) {
  .tabs {
    grid-template-columns: repeat(2, 1fr); /* スマホは2列×2段 */
  }
}

.tab-btn {
  height: 7vh; 
  min-height: 50px;
  background: #f8f8f8;
  border: 2px solid transparent; /* 枠線のスペースを確保 */
  border-radius: 8px;           /* 丸角にする場合 */
  font-weight: 500;
  font-size: 0.85rem;
  font-family: 'Roboto', sans-serif;
  color: #555;
  cursor: pointer;
  padding: 12px 0;
  transition: all 0.3s ease;
  border-bottom: 3px solid transparent;
  display: inline-block; /* transform効かせる */
}

.tab-btn.active {
  /* height: 60px;  */
  background: #1F6F78;
  border: 2px solid #1F6F78;  /* 枠線も同色で囲む */
  color: #fff;
  /* border-bottom: 3px solid #1F6F78; */
  font-weight: 700;
  font-size: 1.2rem;
  letter-spacing: 0.02em;
  transform: scale(1.0);
}

.tab-btn:not(.active):hover {
  /* height: 60px;  */
  background: #eee;
  font-size: 1.2rem;
  transform: scale(1.0);
  color: #1F6F78;
}

/* ぴょんバウンドアニメ
@keyframes bounce {
  0%   { transform: translateY(0); }
  30%  { transform: translateY(-1000px); }
  60%  { transform: translateY(0); }
  70%  { transform: translateY(-15px); }
  80%  { transform: translateY(0); }
  90%  { transform: translateY(-5px); }
  100% { transform: translateY(0); }
}

.tab-btn.jump {
  font-size: 1.1rem;
  animation: bounce 1.0s ease 4;
}
*/

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
  padding-top:180px; /* ヘッダー＋バッジの分 */
  width: 100%;
  /* height: 100vh; */
  display: flex;
  flex-direction: column; /* バッジとリストを縦に */
  box-sizing: border-box;
  /* padding-bottom: 80px; */
}

.timeline-content li {
  list-style: none;
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
  padding: 4vh;
  scrollbar-width: none;
}

.timeline::-webkit-scrollbar { display: none; }
.timeline li {
  list-style: none;
  flex: 0 0 auto;
  width: 100%;
  max-width: 500px;
  scroll-snap-align: center;
  height: auto;
}

@media (max-width: 600px) {
  .timeline {
    padding-top: 10vh;
  }
}

/* その他スタイル */
.empty-message { text-align: center; margin-top: 2rem; color: #888; width: 100%; }
.load-more-container { display: flex; justify-content: center; align-items: center; min-width: 100px; margin-right: 1rem; order: -1; }
.load-more-btn {
  height: 400px;
  padding: 0 1.2rem;
}
.load-more-btn:disabled { opacity: 0.6; }
.no-more-message { color: #555; font-size: 0.9rem; writing-mode: vertical-rl; padding-top: 120px; padding-left: 20px;}
.fade-slide-enter-from { opacity: 0; transform: translateY(20px); }
.fade-slide-enter-active { transition: all 0.5s ease; }

.special-timeline-container {
  width: 100%;
  height: 100%;
  overflow-y: auto; /* 全体を縦スクロール可能に */
  padding-bottom: 20px;
}

.ranking-section, .current-theme-section {
  margin-bottom: 30px;
  border-bottom: 1px dashed #ccc;
  padding-bottom: 10px;
}

.section-title {
  margin-left: 15px;
  font-size: 1.1rem;
  color: #555;
  font-weight: bold;
  margin-bottom: 10px;
}

.rank-badge {
  text-align: center;
  font-weight: bold;
  color: #fff;
  background-color: #d4af37; /* 金色っぽい色 */
  padding: 2px 8px;
  border-radius: 10px;
  margin-bottom: 5px;
  display: inline-block;
}
.ranking-list li:nth-child(1) .rank-badge { background-color: #ffd700; font-size: 1.2em; } /* 1位 */
.ranking-list li:nth-child(2) .rank-badge { background-color: #c0c0c0; } /* 2位 */
.ranking-list li:nth-child(3) .rank-badge { background-color: #cd7f32; } /* 3位 */

.no-post-msg {
  padding: 20px;
  color: #888;
}
</style>
<template>
  <div class="card" :class="genreClass(post.genre_id)">
    <div class="card-header">
      <button class="author-btn" @click="goToProfile">
       👤{{ post.authorName || post.author }}
      </button>
      <FollowButton v-if="currentUser && post.user_id !== currentUser.id" :targetUserId="post.user_id" :currentUserId="currentUser.id" />
      <button 
        v-if="currentUser && post.user_id === currentUser.id"
        class="delete-x-btn" 
        @click="$emit('delete', post.id)"
        title="削除"
      >
        ×
      </button>
    </div>

    <div class="poem-wrapper">
      <div class="poem">
        <template v-if="post.ruby_content && post.ruby_content.length > 0">
          <div v-for="(phrase, pIndex) in post.ruby_content" :key="pIndex" class="post-line">
            <span v-for="(ruby_data, wIndex) in phrase" :key="wIndex" class="word-unit">
              <ruby>{{ ruby_data.word }}<rt>{{ ruby_data.ruby }}</rt></ruby>
            </span>
          </div>
        </template>
        <template v-else>
          <p v-for="(line, index) in lines" :key="index" class="post-line">{{ line }}</p>
        </template>
      </div>
    </div>

    <div class="actions-container" v-if="!isPreview">
      <div class="main-actions">
        <LikeButton :postId="post.id" :currentUserId="currentUser?.id || 0" :initialIsLiked="post.isLiked" :initialLikesCount="post.likesCount" />
        <button class="reply-btn" @click="toggleReplies">
            返信{{ post.repliesCount || 0 }}
        </button>
      </div>
      </div>

    <div class="replies-wrapper" :class="{ open: !isPreview && showReplies }">
      <div class="replies-inner">
        <div v-if="!replies.length" class="no-replies">返信はありません</div>
        <div v-else class="reply-scroll-container">
          <div v-for="reply in replies" :key="reply.id" class="reply">
            <ReplyCard :reply="reply" :current-user="currentUser" @reply-deleted="handleReplyDeleted" />
          </div>
        </div>
        <ReplyForm :post-id="post.id" :current-user="currentUser" @reply-posted="handleReplyPosted" />
      </div>
    </div>

  </div>
</template>

<script setup>
import { defineProps, ref, computed, watch} from 'vue';
import { useRouter } from 'vue-router';
import LikeButton from './LikeButton.vue';
import FollowButton from './FollowButton.vue';
import ReplyForm from './ReplyForm.vue';
import ReplyCard from './ReplyCard.vue';

const props = defineProps({
  post: { type: Object, required: true, default: () => ({}) },
  currentUser: { type: Object, default: null },
  isPreview: { type: Boolean, default: false }
});

const router = useRouter();
const lines = computed(() => props.post.content ? props.post.content.split(' ') : []);
const showReplies = ref(false);
const replies = ref([]);
const isLoadingReplies = ref(false);
const replyCount = ref(props.post.repliesCount || 0);
watch(() => props.post.repliesCount, (newVal) => {
  replyCount.value = newVal || 0;
});

const toggleReplies = async () => {
  showReplies.value = !showReplies.value;
  if (showReplies.value && !replies.value.length) {
    await fetchReplies();
  }
};

const fetchReplies = async () => {
  isLoadingReplies.value = true;
  try {
    const res = await fetch(`/api/posts/${props.post.id}`);
    if (!res.ok) throw new Error('返信の取得に失敗しました');
    const data = await res.json();
    replies.value = data.replies || [];
    replyCount.value = replies.value.length;
  } catch (error) {
    console.error('返信取得エラー:', error);
  } finally {
    isLoadingReplies.value = false;
  }
};


const handleReplyPosted = () => {
  replyCount.value++; 
  fetchReplies();
};
const handleReplyDeleted = (replyId) => {
  replies.value = replies.value.filter(reply => reply.id !== replyId);
  if (replyCount.value > 0) {
    replyCount.value--; // 即座に見た目を更新（-1）
  }
};

const goToProfile = () => { if (!props.isPreview && props.post.user_id) router.push(`/users/${props.post.user_id}`); };
const genreClass = (genreId) => {
  const genres = ['','spring','summer','autumn','winter','sports','food','school','travel'];
  return genres[genreId] ? `genre-${genres[genreId]}` : '';
};
</script>

<style scoped>
.card {
  width: 260px;
  max-width: none;
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  color: #000;
  
  /* ★高さの設定を変更 */
  height: auto; 
  min-height: 400px;
  /* transitionは削除（wrapperでやるため） */
  overflow: visible; /* はみ出し許可 */
}

/* ★アニメーション用のスタイル */
.replies-wrapper {
  max-height: 0;       /* 最初は高さ0 */
  opacity: 0;          /* 最初は透明 */
  overflow: hidden;    /* はみ出た部分は隠す */
  transition: max-height 0.5s ease, opacity 0.5s ease; /* 伸びるアニメーション */
}

.replies-wrapper.open {
  max-height: 1200px;  /* 十分大きな値に設定（これより大きくなると切れるので注意） */
  opacity: 1;          /* 表示 */
}

/* 中身のレイアウト */
.replies-inner {
  padding-top: 1rem;
  border-top: 1px solid #ccc;
  margin-top: 0.5rem;
}

/* その他は以前のまま */
.card-header { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  margin-bottom: 0.5rem; 
}
.author-btn { 
  background: none; 
  border: none; 
  font-weight: bold; 
  cursor: pointer; 
  padding: 0; 
  display: flex; 
  align-items: center; 
  gap: 0.5rem; 
}
.poem-wrapper { 
  width: 100%; 
  padding: 1rem; 
  border: 1px solid #ccc; 
  border-radius: 10px; 
  margin-bottom: 0.5rem; 
  display: flex; 
  background-color: #fff; 
  justify-content: center; 
  align-items: center; 
  box-sizing: border-box; 
  height: 250px; 
}
.poem { 
  writing-mode: vertical-rl; 
  text-orientation: upright; 
  font-family: "Hiragino Mincho ProN", serif; 
  font-size: clamp(16px, 2vw, 22px); 
  line-height: 1.8; 
  display: flex; 
  flex-direction: column;
}
.post-line { 
  margin: 0 0 0.5rem 0; 
  text-align: center; 
  color: #000; 
}
.word-unit { 
  display: inline-block;
}
ruby { 
  ruby-position: over; 
  flex-direction: column; 
  align-items: center; 
}
rt {
  font-size: 0.5em; 
  color: #555; 
  text-align: center; 
  margin-bottom: -0.4em; 
}
.actions-container { 
  display: flex; 
  flex-direction: column; 
  align-items: flex-end; 
  gap: 0.5rem; 
  margin-top: 0.5rem; 
  margin-bottom: 0.5rem; 
}
.main-actions { 
  display: flex; 
  align-items: center; 
  gap: 1rem; 
}
.reply-btn {
  background-color: #007bff; 
  color: #fff; 
  border: none; 
  height: 35px; 
  line-height: 35px; 
  padding: 0 10px; 
  border-radius: 8px;
}
.reply-btn:hover { 
  background-color: #0056b3;
}

.delete-x-btn {
  background: none;
  border: none;
  color: #999;
  font-size: 1.5rem; /* ×を見やすく大きく */
  cursor: pointer;
  padding: 0 5px;
  line-height: 1;
  margin-left: auto; /* 必要に応じて右端に寄せる */
}

.delete-x-btn:hover {
  color: #dc3545; /* ホバー時に赤く */
}
.reply-scroll-container { 
  height: 360px; 
  display: flex; 
  flex-direction: row-reverse; 
  overflow-x: auto; 
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth; 
  border-top: 1px solid #eee; 
  border-bottom: 1px solid #eee; 
}
.reply-scroll-container > .reply {
  scroll-snap-align: start; 
  flex: 0 0 auto; 
  margin-left: 10px; 
}
.reply-scroll-container::-webkit-scrollbar {
  display: none; 
}
.reply-scroll-container { 
  scrollbar-width: none; 
}
.no-replies { 
  color: #888; 
  font-style: italic; 
  margin-bottom: 0.3rem; 
}

/* ジャンルごとの背景色 */
.card.genre-spring { background-color: #ffe4e1; }
.card.genre-summer { background-color: #fffacd; }
.card.genre-autumn { background-color: #f5deb3; }
.card.genre-winter { background-color: #e0ffff; }
.card.genre-sports { background-color: #d0f0c0; }
.card.genre-food { background-color: #ffebcd; }
.card.genre-school { background-color: #d8bfd8; }
.card.genre-travel { background-color: #add8e6; }
</style>
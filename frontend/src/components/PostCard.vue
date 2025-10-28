<template>
  <div class="card" :class="{ 'card-expanded': showReplies }">
    <button class="author-btn" @click="goToProfile">
      👤 {{ post.authorName || post.author }}
    </button>

    <div class="poem-wrapper">
      <div class="poem">
        <p v-for="(line, index) in lines" :key="index" class="post-line">
          {{ line }}
        </p>
      </div>
    </div>

    <div class="actions">
      <LikeButton />
      <button class="reply-btn" @click="toggleReplies">
        返信{{ post.repliesCount || 0 }}
      </button>
      <button 
        v-if="currentUser && post.user_id === currentUser.id"
        class="delete-btn" 
        @click="$emit('delete', post.id)"
      >
        削除
      </button>
    </div>

    <div v-if="showReplies" class="replies">
      <div v-if="!replies.length" class="no-replies">返信はありません</div>
        <div v-else class="reply-scroll-container">
          <div v-for="reply in replies" :key="reply.id" class="reply">
            <ReplyCard 
              :reply="reply" 
              :current-user="currentUser"
              @reply-deleted="handleReplyDeleted" 
            />
          </div>
        </div>
        <ReplyForm 
          :post-id="post.id" 
          :current-user="currentUser"
          @reply-posted="handleReplyPosted" 
        />
    </div>
  </div>
</template>

<script setup>
import { defineProps, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import LikeButton from './LikeButton.vue';
import ReplyForm from './ReplyForm.vue';
import ReplyCard from './ReplyCard.vue';

const props = defineProps({
  post: {
    type: Object,
    required: true,
    default: () => ({
    authorName: 'テストユーザー',
    user_id: 1,
      content: '花散るや　風にまかせて　時は過ぐ',
      replies: []
    })
  },
  currentUser: {
    type: Object,
    default: null
  }
});

const router = useRouter();

const lines = computed(() => props.post.content.split(' '));
const showReplies = ref(false);
const replies = ref([]);
const isLoadingReplies = ref(false);

const toggleReplies = async () => {
  showReplies.value = !showReplies.value;
  if (showReplies.value && !replies.value.length) {
    await fetchReplies();
  }
};

// 返信を取得
const fetchReplies = async () => {
  isLoadingReplies.value = true;
  try {
  const res = await fetch(`/api/posts/${props.post.id}`);
    if (!res.ok) throw new Error('返信の取得に失敗しました');
    const data = await res.json();
    replies.value = data.replies || [];
  } catch (error) {
    console.error('返信取得エラー:', error);
  } finally {
    isLoadingReplies.value = false;
  }
};

// 返信が投稿されたときの処理
const handleReplyPosted = () => {
  fetchReplies();
};

// 返信が削除されたときの処理
const handleReplyDeleted = (replyId) => {
  replies.value = replies.value.filter(reply => reply.id !== replyId);
  // 返信数を更新
  if (props.post.repliesCount) {
    props.post.repliesCount--;
  }
};

const goToProfile = () => {
  router.push(`/profile/${props.post.user_id}`);
};
</script>

<style scoped>
.card {
  width: 100%;
  max-width: 500px;
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 10px;
  justify-content: flex-start;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  box-sizing: border-box;
  color: #000;
  height: 400px; /* 返信を閉じているときの高さ */
  transition: height 0.3s ease;
  overflow: hidden;
}
.card-expanded {
  height: 960px; /* 返信を開いたときの高さ */
}

.author-btn {
  background: none;
  border: none;
  font-weight: bold;
  cursor: pointer;
  padding: 0;
  margin-bottom: 0.5rem;
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
  justify-content: center;
  align-items: center;
  background-color: #fafafa;
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

/* いいね・返信ボタンは川柳の下に固定 */
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}

.reply-btn {
  background-color: #007bff;
  border: none;
  margin-top: 0.5rem;
  padding: 5px 10px;
  border-radius: 6px;
  border: none;
  color: white;
  cursor: pointer;
  transition: background-color 0.2s;
}
.reply-btn:hover {
  background-color: #0056b3;
}

.delete-btn {
  background-color: transparent;
  color: #dc3545;
  border: 1px solid #dc3545;
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.delete-btn:hover {
  background-color: #dc3545;
  color: white;
}

.replies {
  flex-grow: 1;
  margin-top: 0.5rem;
  border-top: 1px solid #ccc;
  padding-top: 0.5rem;
  overflow-y: auto;
}

.reply {
  margin-bottom: 0.3rem;
}

/* 3件ぶんだけ表示し、縦スクロールを許可 */
.reply-scroll-container {
  height: 360px; /* 1件=120px × 3件分など */
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  scroll-behavior: smooth;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
}

/* 各返信カードをスナップ対象に */
.reply-scroll-container > .reply {
  scroll-snap-align: start;
  flex-shrink: 0;
}

/* スクロールバー非表示（任意） */
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
</style>

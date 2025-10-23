<template>
  <div class="card">
    <!-- ユーザー情報（ボタン化） -->
    <button class="author-btn" @click="goToProfile">
      👤 {{ post.authorName || post.author }}
    </button>

    <!-- 川柳ボックス -->
    <div class="poem-wrapper">
      <div class="poem">
        <p v-for="(line, index) in lines" :key="index" class="post-line">
          {{ line }}
        </p>
      </div>
    </div>

    <!-- アクションボタン -->
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

    <!-- 返信欄 -->
    <div v-if="showReplies" class="replies">
      <div v-if="!replies.length" class="no-replies">返信はありません</div>
        <div v-else>
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

const lines = computed(() => props.post.content.split('　'));
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

// プロフィール画面に遷移
const goToProfile = () => {
  router.push(`/profile/${props.post.user_id}`);
};
</script>

<style scoped>
.card {
  border: 1px solid #ccc;
  border-radius: 10px;
  padding: 1rem;
  margin: 1rem auto;
  width: 80%;
  background-color: #fff;
  display: flex;
  flex-direction: column;
}

/* ユーザー情報ボタン */
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

/* 川柳ボックス */
.poem-wrapper {
  border: 1px solid #ccc;
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 0.5rem;
  width: 100%;
  min-height: 120px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #fafafa;
}

.poem {
  writing-mode: vertical-rl;
  text-orientation: upright;
  font-family: "Hiragino Mincho ProN", serif;
  font-size: 20px;
  line-height: 1.8;
  display: flex;
  flex-direction: column;
}

.post-line {
  margin: 0 0 0.5rem 0;
  text-align: center;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.reply-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: 1px solid #ddd;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.reply-btn:hover {
  background-color: #f8f9fa;
}

.delete-btn {
  background-color: transparent;
  color: #dc3545;
  border: 1px solid #dc3545;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.delete-btn:hover {
  background-color: #dc3545;
  color: white;
}

.replies {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.reply {
  margin-bottom: 1rem;
}

.no-replies {
  text-align: center;
  color: #666;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 1rem;
}
</style>

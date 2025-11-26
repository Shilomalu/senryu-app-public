<template>
  <div class="card" :class="{ 'card-expanded': showReplies }">
    <div class="card-header">
      <button class="author-btn" @click="goToProfile">
        👤 {{ post.authorName || post.author }}
      </button>

      <FollowButton
        v-if="currentUser && post.user_id !== currentUser.id"
        :targetUserId="post.user_id"
        :currentUserId="currentUser.id"
      />
    </div>

    <div class="poem-wrapper">
      <div class="poem">
        <template v-if="post.ruby_content && post.ruby_content.length > 0">
          <!-- 各句 (上・中・下) のループ -->
          <div v-for="(phrase, pIndex) in post.ruby_content" :key="pIndex" class="post-line">
             <!-- 単語ごとのループ -->
             <span v-for="(word, wIndex) in phrase" :key="wIndex" class="word-unit">
               <ruby v-if="word.ruby">
                 {{ word.text }}<rt>{{ word.ruby }}</rt>
               </ruby>
               <span v-else>{{ word.text }}</span>
             </span>
          </div>
        </template>

        <!-- パターンB: ルビデータがない場合 (旧データ互換) -->
        <template v-else>
          <p v-for="(line, index) in lines" :key="index" class="post-line">
            {{ line }}
          </p>
        </template>
      </div>
    </div>

    <div class="actions" v-if="!isPreview">
      <!-- LikeButton に初期いいね状態とカウントを渡し、toggle 時に post の likesCount を更新 -->
      <LikeButton
        :postId="post.id"
        :currentUserId="currentUser?.id || 0"
        :initialIsLiked="post.isLiked"
        :initialLikesCount="post.likesCount"
        @update-like="handleLikeUpdate"
      />
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


    <div v-if="!isPreview && showReplies" class="replies">
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
import FollowButton from './FollowButton.vue';
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
  },
    isPreview: {
    type: Boolean,
    default: false
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

const handleReplyPosted = () => {
  fetchReplies();
};

const handleReplyDeleted = (replyId) => {
  replies.value = replies.value.filter(reply => reply.id !== replyId);
  if (props.post.repliesCount) {
    props.post.repliesCount--;
  }
};

const goToProfile = () => {
  // プレビュー中は遷移させない
  if (!props.isPreview && props.post.user_id) {
      router.push(`/users/${props.post.user_id}`);
  }
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
  height: 400px;
  transition: height 0.3s ease;
  overflow: hidden;
}
.card-expanded {
  height: 960px;
}

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

.word-unit {
  display: inline-block; /* 単語ごとのまとまり */
}

/* ルビのスタイル */
ruby {
  ruby-position: over; /* 縦書きでは右側に表示 */
  display: inline-flex;
  flex-direction: column; /* 縦書き用 */
  align-items: center;
}

rt {
  font-size: 0.5em; /* ルビのサイズ */
  color: #555;
  text-align: center;
  margin-bottom: -0.4em; /* 文字との距離調整 */
}


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
  /* overflow-y: auto; */
}

/*
.reply {
  margin-bottom: 0.3rem;
}
*/

.reply-scroll-container {
  height: 360px;
  display: flex;               /* 横並びにする */
  flex-direction: row-reverse;
  overflow-x: auto;            /* 横スクロール有効 */
  scroll-snap-type: x mandatory; /* 横方向スナップ */
  scroll-behavior: smooth;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
}
.reply-scroll-container > .reply {
  scroll-snap-align: start;    /* スナップ基準は左端 */
  flex: 0 0 150px;             /* カード幅を固定（例: 300px） */
  margin-left: 10px;          /* カード間の隙間 */
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
</style>
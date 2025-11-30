<template>
  <div 
    class="card" 
    :class="[{ 'card-expanded': showReplies }, genreClass(post.genre_id)]"
  >
    <div class="card-header">
      <button class="author-btn" @click="goToProfile">
       👤{{ post.authorName || post.author }}
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
          <div v-for="(phrase, pIndex) in post.ruby_content" :key="pIndex" class="post-line">
            <span v-for="(rubydata, wIndex) in phrase" :key="wIndex" class="word-unit">
              <ruby>
                {{ rubydata.word }}<rt>{{ rubydata.ruby }}</rt>
              </ruby>
            </span>
          </div>
        </template>

        <template v-else>
          <p v-for="(line, index) in lines" :key="index" class="post-line">
            {{ line }}
          </p>
        </template>
      </div>
    </div>

    <div class="actions-container" v-if="!isPreview">
      <!-- 上段：いいねと返信 -->
      <div class="main-actions">
        <LikeButton
            :postId="post.id"
            :currentUserId="currentUser?.id || 0"
            :initialIsLiked="post.isLiked"
            :initialLikesCount="post.likesCount"
        />
        <button class="reply-btn" @click="toggleReplies">
            返信{{ post.repliesCount || 0 }}
        </button>
      </div>
      
      <!-- 下段：削除ボタン (少し下に配置) -->
      <div class="delete-action" v-if="currentUser && post.user_id === currentUser.id">
        <button 
            class="delete-btn" 
            @click="$emit('delete', post.id)"
        >
            削除
        </button>
      </div>
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
      replies: [],
      genre_id: 1
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
  if (props.post.repliesCount) props.post.repliesCount--;
};

const goToProfile = () => {
  if (!props.isPreview && props.post.user_id) {
      router.push(`/users/${props.post.user_id}`);
  }
};

// ジャンルIDごとにクラス名を返す
const genreClass = (genreId) => {
  switch (genreId) {
    case 1: return 'genre-spring';
    case 2: return 'genre-summer';
    case 3: return 'genre-autumn';
    case 4: return 'genre-winter';
    case 5: return 'genre-sports';
    case 6: return 'genre-food';
    case 7: return 'genre-school';
    case 8: return 'genre-travel';
    default: return '';
  }
};
</script>

<style scoped>
.card {
  width: 260px;
  max-width: none; 
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 10px;
  justify-content: flex-start;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  color: #000;
  height: 400px;
  transition: height 0.3s ease;
  overflow: hidden;
}
.card-expanded { height: 960px; }

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

.author-icon {
  width: 28px;
  height: 28px;
  border-radius: 6px; /* 角丸四角にする */
  object-fit: cover;
  margin-right: 6px;
  border: 1px solid #ccc; /* 枠 */
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

.post-line { margin: 0 0 0.5rem 0; text-align: center; color: #000; }
.word-unit { display: inline-block; }

ruby { ruby-position: over; display: inline-flex; flex-direction: column; align-items: center; }
rt { font-size: 0.5em; color: #555; text-align: center; margin-bottom: -0.4em; }

.actions-container {
  display: flex;
  flex-direction: column; /* 全体は「縦」に積む (上段と下段) */
  align-items: flex-end;  /* 全て右寄せにする */
  gap: 0.5rem;            /* 上段と下段の隙間 */
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}

/* 上段：いいねと返信ボタンを入れる箱 */
.main-actions {
  display: flex;          /* ★重要: これで中身を「横」に並べる */
  align-items: center;    /* 上下の位置を揃える */
  gap: 1rem;              /* ボタン同士の間隔 */
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
  align-items: center;
}
.actions button { height: 35px; line-height: 35px; padding: 0 12px; border-radius: 6px; cursor: pointer; font-size: 0.9rem; transition: all 0.2s ease; }
.like-button { height: 35px; }
.reply-btn { background-color: #007bff; color: #fff; border: none; height: 35px; line-height: 35px; padding: 0 10px; border-radius: 8px;}
.reply-btn:hover { background-color: #0056b3;}
.delete-btn { background-color: transparent; color: #dc3545; border: 1px solid #dc3545; padding: 0.4rem 0.8rem; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
.delete-btn:hover { background-color: #dc3545; color: white; }

.replies { flex-grow: 1; margin-top: 0.5rem; border-top: 1px solid #ccc; padding-top: 0.5rem; }
.reply-scroll-container { height: 360px; display: flex; flex-direction: row-reverse; overflow-x: auto; scroll-snap-type: x mandatory; scroll-behavior: smooth; border-top: 1px solid #eee; border-bottom: 1px solid #eee; }
.reply-scroll-container > .reply { scroll-snap-align: start; flex: 0 0 150px; margin-left: 10px; }
.reply-scroll-container::-webkit-scrollbar { display: none; }
.reply-scroll-container { scrollbar-width: none; }
.no-replies { color: #888; font-style: italic; margin-bottom: 0.3rem; }

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
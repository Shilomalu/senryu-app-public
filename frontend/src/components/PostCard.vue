<template>
  <div class="card">
    <!-- ユーザー情報（ボタン化） -->
    <button class="author-btn" @click="goToProfile">
      👤 {{ post.author }}
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
        返信{{ replies.length }}
      </button>
    </div>

    <!-- 返信欄 -->
    <div v-if="showReplies" class="replies">
      <div v-if="replies.length === 0" class="no-replies">返信はありません</div>
      <div v-for="(reply, idx) in replies" :key="idx" class="reply">
        👤 {{ reply.author }}: {{ reply.content }}
      </div>
      <button class="reply-button">返信する</button>
    </div>
  </div>
</template>

<script setup>
import { defineProps, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import LikeButton from './LikeButton.vue';

const props = defineProps({
  post: {
    type: Object,
    required: true,
    default: () => ({
      author: 'テストユーザー',
      content: '花散るや　風にまかせて　時は過ぐ',
      replies: []
    })
  }
});

const router = useRouter();

const lines = computed(() => props.post.content.split('　'));
const replies = computed(() => props.post.replies || []);
const showReplies = ref(false);

const toggleReplies = () => {
  showReplies.value = !showReplies.value;
};

// プロフィール画面に遷移
const goToProfile = () => {
  router.push(`/users/${props.post.author}`);
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
  background-color: #f4f4f4;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
}

.replies {
  margin-top: 0.5rem;
  border-top: 1px solid #ccc;
  padding-top: 0.5rem;
}

.reply {
  margin-bottom: 0.3rem;
}

.no-replies {
  color: #888;
  font-style: italic;
  margin-bottom: 0.3rem;
}

.reply-button {
  margin-top: 0.5rem;
  padding: 5px 10px;
  border-radius: 6px;
  border: none;
  background-color: #007bff;
  color: white;
  cursor: pointer;
}
</style>

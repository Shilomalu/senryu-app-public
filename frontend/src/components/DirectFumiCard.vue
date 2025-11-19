<template>
  <div  :class="[props.message.senderFlag ? 'sentCard' : 'receivedCard', 'dm-card']">
      <div class="dm-content">
        {{ props.message.content }}
      </div>
    <div class="dm-footer">
      <small class="timestamp">{{ formatDate(props.message.created_at) }}</small>
      <small class="isread" v-if="!props.message.is_read && props.message.senderFlag">未読</small>
    </div>
  </div>
</template>

<script setup>

    // --- 各投稿のデータを整形 ---{ "id", "senderFlag", "content", "created_at", "reply_77", "is_read" }
function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleString('ja-JP')
}

const props = defineProps({
  message: {
    type: Object,
    default: null
  }
});
</script>

<style scoped>
.dm-card {
  max-width: 60%;
  padding: 10px;
  margin: 6px 0;
  border-radius: 10px;
}

/* 送信メッセージ -> 右寄せ */
.sentCard {
  margin-left: auto;      /* これだけで右に寄る */
  background-color: #d1e8ff; /* 任意 */
}

/* 受信メッセージ -> 左寄せ */
.receivedCard {
  margin-right: auto;     /* これだけで左に寄る */
  background-color: #f1f1f1; /* 任意 */
}

.dm-footer {
  width: 100%;
  display: flex;
  justify-content: space-between; /* 左に名前、右に最新メッセージ */
}

.isread {
  font-weight: bold;
}
</style>
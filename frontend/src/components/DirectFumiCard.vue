<template>
  <div  :class="[props.message.senderFlag ? 'sentCard' : 'receivedCard', {'longCard': props.message.reply_77}, 'dm-card']">
      <div class="dm-content">
        {{ props.message.content }}
      </div>
    <div class="dm-footer">
      <small class="timestamp">{{ formatDate(props.message.created_at) }}</small>
      <div class="isread-wrapper"><small class="isread" v-if="!props.message.is_read && props.message.senderFlag">未読</small></div>
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
  max-height: 60%;
  max-width: 80px;
  padding: 10px;
  margin: 6px;
  border-radius: 10px;
}

/* 送信メッセージ -> 右寄せ */
.sentCard {
  margin-top: auto;      /* これだけで右に寄る */
  background-color: #d1e8ff; /* 任意 */
}

/* 受信メッセージ -> 左寄せ */
.receivedCard {
  margin-bottom: auto;     /* これだけで左に寄る */
  background-color: #f1f1f1; /* 任意 */
}

.longCard {
  margin-right: 12px;
  margin-left: 0;
}

.dm-content {
  writing-mode: vertical-rl; /* 縦書き（右→左） */
  text-orientation: upright; /* 文字の向きを正立に */
  margin: auto;
}

.dm-footer {
  width: 100%;
  display: flex;
  justify-content: space-between; /* 左に名前、右に最新メッセージ */
  display: block; /* small要素をブロックレベルに変更 */
}

.isread-wrapper {
  text-align: center;
}

.isread {
  font-weight: bold;
}
</style>
<template>
  <div class="notif-container">
    <h2 class="notif-title">お知らせ</h2>

    <ul class="notif-list">
      <li 
        v-for="n in notifications" 
        :key="n.id" 
        class="notif-item"
        @click="removeNotification(n.id)"
      >
        <div class="notif-message">{{ n.message }}</div>
        <div class="notif-time">{{ formatTime(n.created_at) }}</div>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  props: {
    notifications: Array
  },

  methods: {
    formatTime(time) {
      return new Date(time).toLocaleString("ja-JP");
    },

    async removeNotification(id) {
      if (!confirm("この通知を削除しますか？")) return;

      try {
        const token = localStorage.getItem("token");

        const res = await fetch(`/api/notifications/${id}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (!res.ok) {
          alert("削除に失敗しました");
          return;
        }

        // 親コンポーネントへ削除を通知
        this.$emit("remove", id);

      } catch (err) {
        console.error("削除エラー:", err);
      }
    }
  }
};
</script>

<style scoped>
/* 和紙風の背景 */
.notif-container {
  padding: 16px;
  background: #f7f4e9; /* 生成色(きなり) */
  min-height: 100vh;
}

/* 見出し（和風フォントを意識したデザイン） */
.notif-title {
  font-size: 22px;
  color: #2f4f4f; /* 深緑 */
  border-left: 6px solid #b7410e; /* 朱色アクセント */
  padding-left: 10px;
  margin-bottom: 16px;
}

/* 通知一覧 */
.notif-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

/* 通知カード（和紙 + 藍色） */
.notif-item {
  background: #faf8f2; /* 和紙っぽい色 */
  border: 1px solid #cfc9b6; /* 薄い茶色 */
  border-left: 6px solid #5c7b45;; /* 深緑アクセント */
  border-radius: 6px;
  padding: 12px;
  margin: 10px 0;
  box-shadow: 0px 2px 3px rgba(0, 0, 0, 0.08);
  cursor: pointer;
}

/* メッセージ */
.notif-message {
  font-size: 15px;
  color: #333;
  margin-bottom: 6px;
}

/* 時刻 */
.notif-time {
  font-size: 12px;
  color: #6c6c6c;
}
</style>

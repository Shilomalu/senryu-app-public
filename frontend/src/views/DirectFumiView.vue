<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

const token = ref(localStorage.getItem('token'));
const partners = ref([]);
const fetchPartners = async () => {
  try {
    // --- タブごとに取得先を切り替える ---
    let endpoint = `/api/users/following`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.value}`
      },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'ふみ相手の読み込みに失敗しました。');
    partners.value = data;
    console.log("partners are:\n", partners.value);

  } catch (err) {
    console.error(err);
    partners.value = err.message || 'データの取得中にエラーが発生しました。';
    partners.value = [];
  }
};

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleString('ja-JP')
}

onMounted(fetchPartners);
</script>

<!-- フォロー中のユーザ一覧からdirectfumi.vueにとべるように -->
<template>
  <div class="dfumi-wrapper">
  <h1>ダイレクトふみ</h1>
  <p>フォロー中の人にのみ送信できます。</p>
  <div>
    <ul>
      <li v-for="p in partners" :key="p.id" :class="{ 'partner-item': true, 'new-msg': !p.is_read && p.sender_id == p.id}">
        <router-link :to="{ name: 'DirectFumi', params: { partnerId: p.id } }" class="partner-link">
          <span class="partner-name">{{ p.username }}</span>
          <span v-if="!p.is_read && p.sender_id == p.id" class="new-msg-notice">新規メッセージあり</span>
          <span class="latest-msg">
            {{ p.content || '' }} 
            <small v-if="p.latest_dm">({{ formatDate(p.latest_dm) }})</small>
          </span>
        </router-link>
      </li>
    </ul>
  </div>
  </div>
</template>

<style scoped>
.dfumi-wrapper {
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  background-color: #fff;
  color: #000;
}

.partner-item {
  margin: 8px 0;
}

.partner-link {
  display: flex;
  justify-content: space-between; /* 左に名前、右に最新メッセージ */
  align-items: center;
  text-decoration: none;
  color: inherit;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.2s;
}

.partner-link:hover {
  background-color: #f0f0f0;
}

.partner-name {
  font-weight: bold;
}

.latest-msg {
  font-size: 0.85em;
  color: #888; /* 薄いグレー */
  text-align: right;
  max-width: 80%; /* 長文を切る場合 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.new-msg {
  border: 2px solid hsla(160, 100%, 37%, 1);
}

.new-msg-notice {
  font-size: 0.85em;
  color: hsla(160, 100%, 37%, 1);
  text-align: right;
  max-width: 60%; /* 長文を切る場合 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: bold;
}

</style>
<template>
  <h2>ふみ for {{ partnerName }}</h2>
  <div v-if="messages.length">
    <DirectFumiCard v-for="m in messages" :message="m" />
  </div>
  <div v-else>There is no direct message</div>
  <DirectFumiForm :latestMessage="latestMessage" :partnerId="partnerId" @message-sent="fetchDms"/>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import DirectFumiCard from './DirectFumiCard.vue';
import DirectFumiForm from './DirectFumiForm.vue';

const message = ref('');
const token = ref(localStorage.getItem('token'));
const messages = ref([]);
const partnerName = ref("");
const latestMessage = ref({});

const props = defineProps({
  partner: {
    type: Object,
    default: null
  },
  currentUser: {
    type: Object,
    default: null
  }
});
const partnerId = ref(props.partner.id);
console.log(partnerId.value);

const fetchDms = async () => {
  try {
    partnerName.value = props.partner.username;
    partnerId.value = props.partner.id;
    
    let endpoint = `/api/users/${partnerId.value}/dfumi/messages`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${token.value}` },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'ふみの読み込みに失敗しました。');
    messages.value = data;
    console.log("messages:\n", messages.value.at(-1));
    latestMessage.value  = messages.value.at(-1);
  } catch (err) {
    console.error(err);
    message.value = err.message || 'データの取得中にエラーが発生しました。';
    messages.value = [];
    latestMessage.value = "";
  }
};

onMounted(fetchDms);
</script>

<style scoped>
.page-container {
  width: 100%;
  margin: 0;
  padding: 0;
}

/* 固定ヘッダー */
.fixed-header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background-color: #fff;
  z-index: 1000;
  border-bottom: 2px solid #ccc;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}

.page-title {
  text-align: center;
  margin: 10px 0 5px;
  font-size: 1.8em;
  color: #333;
}

.tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border-top: 2px solid #ccc;
  border-bottom: 2px solid #ccc;
}

.tabs button {
  background: none;
  border: none;
  font-weight: bold;
  font-size: 1rem;
  color: #555;
  cursor: pointer;
  padding: 10px 0;
  position: relative;
}

.tabs button:not(:last-child)::after {
  content: "";
  position: absolute;
  right: 0;
  top: 25%;
  bottom: 25%;
  width: 1px;
  background-color: #ccc;
}

.tabs button.active {
  color: #007bff;
}

/* タイムライン */
.timeline-content {
  padding-top: 120px;
  width: 100%;
  padding-bottom: 80px;
  box-sizing: border-box;
  overflow-y: auto;
  max-height: 100vh;
}

.timeline {
  display: grid;
  gap: 1.5rem;
  justify-content: center;
}

@media (max-width: 999px) {
  .timeline {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 1000px) {
  .timeline {
    grid-template-columns: repeat(2, 500px);
  }
}

.timeline li {
  list-style: none;
}
.empty-message {
  text-align: center;
  margin-top: 2rem;
  color: #888;
}
</style>

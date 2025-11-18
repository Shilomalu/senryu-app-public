<script setup>
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import DirectFumi from '../components/DirectFumi.vue';

const route = useRoute();
const partnerId = route.params.partnerId;

const partner = ref(null);

const fetchPartner = async () => {
  try {
    const res = await fetch(`/api/users/${partnerId}`);
    partner.value = await res.json();
    if (!res.ok) throw new Error(data.message || '相手情報更新に失敗しました。');
  } catch (err) {
    console.error(err);
  }
}

onMounted(async () => {
  fetchPartner();
});
</script>

<template>
  <div class="fumi-wrapper">
  <router-link :to="{ name: 'dfumi', }" class="partner-link">ダイレクトふみ一覧</router-link>
  <div v-if="partner">
    <DirectFumi :partner="partner" />
  </div>
  <div v-else>Loading...</div>
  </div>
</template>

<style scoped>
.fumi-wrapper {
  margin: 2rem auto;
  padding: 2rem;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  background-color: #fff;
  color: #000;
}
</style>
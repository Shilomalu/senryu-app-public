<script setup>
import { useRouter } from 'vue-router';
const router = useRouter();

const returnPost = () => {
  router.push('/post');
};
</script>

<template>
  <p>・ひらがな<br>・全角カタカナ<br>・半角カタカナ<br>・漢字</p>
  <p>・記号　:　。、「」・！？</p>
  <button @click="returnPost">戻る</button>
</template>
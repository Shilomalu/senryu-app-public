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

<style>
button {
  width: 20%;
  padding: 10px;
  font-size: 1em;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
button:hover {
  background-color: #0056b3;
}
</style>
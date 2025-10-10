<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header>
    <div class="wrapper">
      <nav>
        <RouterLink to="/">タイムライン</RouterLink>
        <RouterLink to="/post">投稿する</RouterLink>
        <RouterLink to="/register">新規登録</RouterLink>
        <RouterLink to="/login">ログイン</RouterLink>
      </nav>
    </div>
  </header>
  <main>
    <RouterView />
  </main>
</template>

<style scoped>
/* ヘッダーのスタイル */
header { line-height: 1.5; }
nav { width: 100%; font-size: 1rem; text-align: center; margin-top: 2rem; }
nav a { display: inline-block; padding: 0 1rem; border-left: 1px solid var(--color-border); }
nav a:first-of-type { border: 0; }
main { padding-top: 2rem; }
</style>
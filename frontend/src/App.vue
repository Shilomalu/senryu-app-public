<script setup>
import { RouterView, RouterLink } from 'vue-router';
</script>

<template>
  <main class="content">
    <RouterView />
  </main>

  <footer class="tab-bar">
    <RouterLink to="/" class="tab-link">
      <span>ホーム</span>
    </RouterLink>
    <RouterLink to="/search" class="tab-link">
      <span>検索</span>
    </RouterLink>
    <RouterLink to="/post" class="tab-link">
      <span>投稿</span>
    </RouterLink>
    <RouterLink to="/profile" class="tab-link">
      <span>プロフィール</span>
    </RouterLink>
  </footer>
</template>

<style scoped>
/* メインコンテンツエリアのスタイル */
.content {
  /* 下のタブバーにコンテンツが隠れないように、底に余白を設ける */
  padding-bottom: 80px; 
}

/* タブバー全体のスタイル */
.tab-bar {
  position: fixed; /* 画面下部に固定 */
  bottom: 0;
  left: 0;
  right: 0;
  
  display: flex;
  justify-content: space-around; /* アイコンを等間隔に配置 */
  align-items: center;
  
  height: 60px;
  background-color: #ffffff;
  border-top: 1px solid #e0e0e0;
  box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.05);
}

/* 各タブリンクのスタイル */
.tab-link {
  display: flex;
  flex-direction: column; /* アイコンとテキストを縦に並べる */
  align-items: center;
  justify-content: center;
  
  flex-grow: 1; /* リンクが均等にスペースを分け合うように */
  
  color: #888;
  text-decoration: none;
  font-size: 12px;
}

/* 現在アクティブな（表示しているページの）タブリンクのスタイル */
.router-link-active {
  color: #007bff; /* アクティブなリンクの色を青にする */
}
</style>
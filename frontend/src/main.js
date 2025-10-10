import { createApp } from 'vue'
import App from './App.vue'
import router from './router' // ルーターを読み込む

import './assets/main.css' // 基本的なスタイルシート

const app = createApp(App)

app.use(router) // アプリにルーターを適用
app.mount('#app')
import { createRouter, createWebHistory } from 'vue-router'

import TimelineView from '../views/TimelineView.vue'
import RegisterView from '../views/RegisterView.vue'
import LoginView from '../views/LoginView.vue'
import CreatePostView from '../views/CreatePostView.vue'
import PostDetailView from '../views/PostDetailView.vue'
import ProfileView from '../views/ProfileView.vue'
import SearchView from '../views/SearchView.vue'
import NotFoundView from '../views/NotFoundView.vue'
import EditProfileView from '../views/EditProfileView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // 1. ホーム画面（タイムライン）
    {
      path: '/', 
      name: 'timeline',
      component: TimelineView
    },
    // 2. 検索ページ
    {
      path: '/search',
      name: 'search',
      component: SearchView
    },
    // 3. 新規投稿ページ
    {
      path: '/post',
      name: 'post',
      component: CreatePostView
    },
    // 4. 自分のプロフィールページ（タブバーから飛ぶ用）
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView
    },

    // 追加: プロフィール編集ページ
    {
      path: '/profile/edit',
      name: 'profile-edit',
      component: EditProfileView
    },

    // --- 以下はタブバー以外の場所から遷移するページ ---

    // 5. 新規登録ページ
    {
      path: '/register',
      name: 'register',
      component: RegisterView
    },
    // 6. ログインページ
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    // 7. 他のユーザーのプロフィールページ（動的ルート）
    // 例: /users/123 のようにアクセスする
    {
      path: '/users/:id', // ← :id はどのユーザーかを示すための変数
      name: 'user-profile',
      component: ProfileView
    },
    // 8. 投稿詳細ページ（動的ルート）
    // 例: /posts/456 のようにアクセスする
    {
      path: '/posts/:id', // ← :id はどの投稿かを示すための変数
      name: 'post-detail',
      component: PostDetailView
    },
    // 9. 404 Not Foundページ（キャッチオールルート）
    // どのURLにも一致しなかった場合に表示される
    { 
      path: '/:pathMatch(.*)*', 
      name: 'not-found', 
      component: NotFoundView 
    }
  ]
})

export default router
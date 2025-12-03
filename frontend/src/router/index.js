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
import UserProfile from '../views/UserProfileView.vue';
import PostDescriptionView from '../views/PostDescriptionView.vue'
import DirectFumiView from '@/views/DirectFumiView.vue'
import DirectFumiPage from '@/components/DirectFumiPage.vue'
import FollowersView from '../views/FollowersView.vue'

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
    // 追加: 投稿可能な文字の詳細説明ページ
    {
      path: '/post/description',
      name: 'post-description',
      component: PostDescriptionView
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

    // 追加: ダイレクトメッセージページ
    {
      path: '/dfumi',
      name: 'dfumi',
      component: DirectFumiView
    },
    // 追加: 各人のダイレクトメッセージページ
    {
      path: '/dfumi/:partnerId',
      name: 'DirectFumi',
      component: DirectFumiPage,
      props: true, // URL パラメータを props として渡す
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
    // 7. フォロワー一覧ページ
    {
      path: '/users/:id/followers', // 例: /users/123/followers
      name: 'followers',
      component: FollowersView
    },
    // 8. 他のユーザーのプロフィールページ（動的ルート）
    // 例: /users/123 のようにアクセスする
    {
      path: '/users/:id', // ← :id はどのユーザーかを示すための変数
      name: 'user-profile',
      component: ProfileView
    },
     { path: '/profile/:id', component: UserProfile },
    // 9. 投稿詳細ページ（動的ルート）
    // 例: /posts/456 のようにアクセスする
    {
      path: '/posts/:id', // ← :id はどの投稿かを示すための変数
      name: 'post-detail',
      component: PostDetailView
    },
    // 10. 404 Not Foundページ（キャッチオールルート）
    // どのURLにも一致しなかった場合に表示される
    { 
      path: '/:pathMatch(.*)*', 
      name: 'not-found', 
      component: NotFoundView 
    }
  ]
})

export default router
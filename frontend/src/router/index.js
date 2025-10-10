import { createRouter, createWebHistory } from 'vue-router'
import TimelineView from '../views/TimelineView.vue'
import RegisterView from '../views/RegisterView.vue'
import LoginView from '../views/LoginView.vue'
import CreatePostView from '../views/CreatePostView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/timeline',
      name: 'timeline',
      component: TimelineView
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/post',
      name: 'post',
      component: CreatePostView
    }
  ]
})

export default router
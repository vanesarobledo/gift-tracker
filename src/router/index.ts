import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: () => import('../views/HomeView.vue') },
    {
      path: '/occasions/:id',
      name: 'occasion',
      component: () => import('../views/OccasionView.vue'),
      props: true,
    },
    { path: '/people', name: 'people', component: () => import('../views/PeopleView.vue') },
    {
      path: '/people/:id',
      name: 'person',
      component: () => import('../views/PersonView.vue'),
      props: true,
    },
    { path: '/to-buy', name: 'to-buy', component: () => import('../views/ToBuyView.vue') },
    { path: '/settings', name: 'settings', component: () => import('../views/SettingsView.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

export default router

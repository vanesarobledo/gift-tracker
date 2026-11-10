import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView, meta: { title: 'Occasions' } },
    {
      path: '/occasions/:id',
      name: 'occasion',
      component: () => import('../views/OccasionView.vue'),
      props: true,
    },
    {
      path: '/people',
      name: 'people',
      component: () => import('../views/PeopleView.vue'),
      meta: { title: 'People' },
    },
    {
      path: '/people/:id',
      name: 'person',
      component: () => import('../views/PersonView.vue'),
      props: true,
    },
    {
      path: '/to-buy',
      name: 'to-buy',
      component: () => import('../views/ToBuyView.vue'),
      meta: { title: 'To Buy' },
    },
    {
      path: '/data',
      name: 'data',
      component: () => import('../views/DataView.vue'),
      meta: { title: 'Data' },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue'),
    },
  ],
  scrollBehavior: (_to, _from, saved) => saved ?? { top: 0 },
})

router.afterEach((to) => {
  const title = to.meta.title as string | undefined
  document.title = title ? `${title} · Gift Tracker` : 'Gift Tracker'
})

export default router

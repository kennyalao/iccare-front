import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import SignIn from '../components/auth/SignIn.vue';
import AdminDashboard from '../views/AdminDashboard.vue';

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/signin', name: 'SignIn', component: SignIn },
  { 
    path: '/admin', 
    name: 'AdminDashboard', 
    component: AdminDashboard, 
    meta: { requiresAuth: true, requiresAdmin: true } // Key protection flags
  }
  // Add other routes for /signup, /forgot-password, etc.
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('auth_token');

  if (to.meta.requiresAuth && !token) {
    // If route requires auth and no token is found, redirect to login
    next({ name: 'SignIn' });
  } else if (to.meta.requiresAdmin && token) {
    // If route requires admin, check role claims in token (requires token decoding logic)
    // For now, allow entry if token exists, but real app needs JWT role validation.
    next();
  } else {
    next();
  }
});

export default router;

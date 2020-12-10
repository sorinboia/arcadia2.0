import store from '@/state/store'


export default [
  {
    path: '/',
    name: 'default',
    meta: {
      authRequired: true,
    },
    component: () => import('./views/crypto/wallet'),
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('./views/account/login'),
    meta: {
      beforeResolve(routeTo, routeFrom, next) {
        // If the user is already logged in
        if (store.getters['auth/loggedIn']) {
          // Redirect to the home page instead
          next({ name: 'default' })
        } else {
          // Continue to the login page
          next()
        }
      },
    },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('./views/account/register'),
    meta: {
      beforeResolve(routeTo, routeFrom, next) {
        // If the user is already logged in
        if (store.getters['auth/loggedIn']) {
          // Redirect to the home page instead
          next({ name: 'default' })
        } else {
          // Continue to the login page
          next()
        }
      },
    },
  },
  {
    path: '/forgot-password',
    name: 'Forgot password',
    component: () => import('./views/account/forgot-password'),
    meta: {
      beforeResolve(routeTo, routeFrom, next) {
        // If the user is already logged in
        if (store.getters['auth/loggedIn']) {
          // Redirect to the home page instead
          next({ name: 'default' })
        } else {
          // Continue to the login page
          next()
        }
      },
    },
  },
  {
    path: '/404',
    name: '404',
    component: require('./views/utility/404').default,
  },
  // Redirect any unmatched routes to the 404 page. This may
  // require some server configuration to work in production:
  // https://router.vuejs.org/en/essentials/history-mode.html#example-server-configurations
  {
    path: '*',
    redirect: '404',
  },
  {
    path: '/crypto/wallet',
    name: 'Wallet',
    meta: { authRequired: true },
    component: () => import('./views/crypto/wallet/index')
  },
  {
    path: '/crypto/exchange',
    name: 'Exchange',
    meta: { authRequired: true },
    component: () => import('./views/crypto/exchange/index')
  },
  {
    path: '/crypto/kyc-application',
    name: 'kyc-application',
    meta: { authRequired: true },
    component: () => import('./views/crypto/kycapplication/index')
  },
  {
    path: '/crypto/ico-landing',
    name: 'Ico-landing',
    meta: { authRequired: true },
    component: () => import('./views/crypto/ico-landing')
  }
]

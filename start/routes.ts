/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import authMiddleWare from  '../app/middleware/auth_middleware.js'

let auth = new authMiddleWare();

const AuthController = () => import('#controllers/Auth/auth_controller')

router.group(() => {
  router.post('register', [AuthController, 'register']).as('register')
  router.get('verify-email/:code', [AuthController, 'verifyEmail']).as('verifyEmail')
  router.post('login', [AuthController, 'login'])
  router.post('forgot-password', [AuthController, 'forgotPassword'])
  router.post('reset-password', [AuthController, 'resetPassword'])
  router.post('logout', [AuthController, 'logout']).middleware([auth.handle])
}).prefix('api/v1/auth/')

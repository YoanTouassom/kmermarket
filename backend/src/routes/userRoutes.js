/**
 * Routes de l'espace client (authentification requise).
 * Préfixe monté dans app.js : /api
 */
import { Router } from 'express'

import * as user from '../controllers/userController.js'
import * as cart from '../controllers/cartController.js'
import * as order from '../controllers/orderController.js'
import { authenticate } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import {
  updateProfileSchema,
  changePasswordSchema,
  addressSchema,
  updateAddressSchema,
  idParam,
  productIdParam,
  cartItemSchema,
  cartQuantitySchema,
  mergeCartSchema,
  createOrderSchema,
} from '../validators/schemas.js'
import { changePassword } from '../controllers/authController.js'

const router = Router()

// Limité aux préfixes de l'espace client : une route /api inconnue doit
// tomber sur le 404, pas sur un 401.
router.use(['/me', '/cart', '/orders'], authenticate)

/* ------------------------------- Profil ------------------------------- */

router.get('/me', user.getProfile)
router.patch('/me', validate({ body: updateProfileSchema }), user.updateProfile)
router.post(
  '/me/change-password',
  validate({ body: changePasswordSchema }),
  changePassword
)

/* ------------------------------ Adresses ------------------------------ */

router.get('/me/addresses', user.listAddresses)
router.post('/me/addresses', validate({ body: addressSchema }), user.createAddress)
router.patch(
  '/me/addresses/:id',
  validate({ params: idParam, body: updateAddressSchema }),
  user.updateAddress
)
router.post(
  '/me/addresses/:id/default',
  validate({ params: idParam }),
  user.defaultAddress
)
router.delete(
  '/me/addresses/:id',
  validate({ params: idParam }),
  user.removeAddress
)

/* ------------------------------- Panier ------------------------------- */

router.get('/cart', cart.getCart)
router.post('/cart/items', validate({ body: cartItemSchema }), cart.addItem)
router.post('/cart/merge', validate({ body: mergeCartSchema }), cart.mergeCart)
router.get('/cart/quote', cart.quote)
router.patch(
  '/cart/items/:productId',
  validate({ params: productIdParam, body: cartQuantitySchema }),
  cart.setQuantity
)
router.delete(
  '/cart/items/:productId',
  validate({ params: productIdParam }),
  cart.removeItem
)
router.delete('/cart', cart.clearCart)

/* ------------------------------ Commandes ------------------------------ */

router.post('/orders', validate({ body: createOrderSchema }), order.createOrder)
router.get('/orders/mine', order.myOrders)
router.get('/orders/mine/:id', validate({ params: idParam }), order.myOrderById)

export default router

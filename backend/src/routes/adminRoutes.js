/**
 * Routes d'administration (JWT + rôle admin).
 * Préfixe monté dans app.js : /api/admin
 */
import { Router } from 'express'

import * as admin from '../controllers/adminController.js'
import * as order from '../controllers/orderController.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import {
  idParam,
  orderQuerySchema,
  orderStatusSchema,
  paidSchema,
  userQuerySchema,
  userStatusSchema,
  userRoleSchema,
  productSchema,
  productUpdateSchema,
  stockSchema,
  categorySchema,
  categoryUpdateSchema,
} from '../validators/schemas.js'

const router = Router()

router.use(authenticate, requireAdmin)

/* ---------------------------- Vue d'ensemble ---------------------------- */

router.get('/orders/stats', order.stats)

/* ------------------------------ Commandes ------------------------------ */

router.get('/orders', validate({ query: orderQuerySchema }), order.adminOrders)
router.get('/orders/:id', validate({ params: idParam }), order.adminOrderById)
router.patch(
  '/orders/:id/status',
  validate({ params: idParam, body: orderStatusSchema }),
  order.changeStatus
)
router.patch(
  '/orders/:id/paid',
  validate({ params: idParam, body: paidSchema }),
  order.markPaid
)

/* ------------------------------- Produits ------------------------------- */

router.get('/products', admin.adminProducts)
router.post('/products', validate({ body: productSchema }), admin.createProduct)
router.patch(
  '/products/:id',
  validate({ params: idParam, body: productUpdateSchema }),
  admin.updateProduct
)
router.patch(
  '/products/:id/stock',
  validate({ params: idParam, body: stockSchema }),
  admin.updateStock
)
router.delete('/products/:id', validate({ params: idParam }), admin.removeProduct)

/* ------------------------------ Catégories ------------------------------ */

router.post(
  '/categories',
  validate({ body: categorySchema }),
  admin.createCategory
)
router.patch(
  '/categories/:id',
  validate({ params: idParam, body: categoryUpdateSchema }),
  admin.updateCategory
)
router.delete(
  '/categories/:id',
  validate({ params: idParam }),
  admin.removeCategory
)

/* --------------------------- Utilisateurs --------------------------- */

router.get('/users', validate({ query: userQuerySchema }), admin.listUsers)
router.get('/users/:id', validate({ params: idParam }), admin.userDetail)
router.patch(
  '/users/:id/status',
  validate({ params: idParam, body: userStatusSchema }),
  admin.setStatus
)
router.patch(
  '/users/:id/role',
  validate({ params: idParam, body: userRoleSchema }),
  admin.setRole
)
router.delete('/users/:id', validate({ params: idParam }), admin.removeUser)

/* ------------------------ Contenu + paramètres ------------------------ */

router.get('/content', admin.getContent)
router.put('/content', admin.updateContent)
router.get('/settings', admin.getSettings)
router.put('/settings', admin.updateSettings)

export default router

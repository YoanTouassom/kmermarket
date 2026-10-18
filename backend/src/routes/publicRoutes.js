/**
 * Routes publiques.
 * -----------------
 * Catalogue, contenu éditorial, livraison et authentification.
 * Préfixe monté dans app.js : /api
 */
import { Router } from 'express'

import * as catalog from '../controllers/catalogController.js'
import * as auth from '../controllers/authController.js'
import * as reviews from '../controllers/reviewController.js'
import { authenticate, optionalAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  productQuerySchema,
  suggestQuerySchema,
  reviewSchema,
} from '../validators/schemas.js'

const router = Router()

/* ------------------------------ Catalogue ------------------------------ */

// Identifie l'admin éventuel : lui seul reçoit les quantités en stock.
router.use('/products', optionalAuth)
router.get('/products', validate({ query: productQuerySchema }), catalog.listProducts)
router.get('/products/featured', catalog.featuredProducts)
router.get('/products/on-sale', catalog.onSaleProducts)
router.get('/products/popular', catalog.popularProducts)
router.get('/products/new', catalog.newArrivals)
router.get('/products/suggest', validate({ query: suggestQuerySchema }), catalog.suggestProducts)
router.get('/products/:idOrSlug', catalog.getProduct)
router.get('/products/:idOrSlug/related', catalog.getRelatedProducts)

/* ------------------------------ Avis clients ------------------------------ */
router.get('/reviews/recent', reviews.recentReviews)
router.get('/products/:idOrSlug/reviews', reviews.productReviews)
router.post(
  '/products/:idOrSlug/reviews',
  authenticate,
  validate({ body: reviewSchema }),
  reviews.saveMyReview
)
router.delete('/products/:idOrSlug/reviews/mine', authenticate, reviews.deleteMyReview)

router.get('/categories', catalog.listCategories)
router.get('/categories/:id', catalog.getCategory)

/* ------------------------- Contenu & livraison ------------------------- */

router.get('/content', catalog.getContent)
router.get('/settings', catalog.getSettings)
router.get('/delivery/zones', catalog.listZones)
router.post('/delivery/quote', catalog.quoteDelivery)

/* --------------------------- Authentification --------------------------- */

router.post('/auth/register', validate({ body: registerSchema }), auth.register)
router.post('/auth/login', validate({ body: loginSchema }), auth.login)
router.post('/auth/logout', auth.logout)
router.get('/auth/me', optionalAuth, auth.me)
router.post(
  '/auth/forgot-password',
  validate({ body: forgotPasswordSchema }),
  auth.forgotPassword
)
router.post(
  '/auth/reset-password',
  validate({ body: resetPasswordSchema }),
  auth.resetPassword
)
router.get('/auth/dev-token-info', auth.devTokenInfo)

/* Authentification requise (profil géré dans userRoutes). */
router.get('/auth/check', authenticate, auth.me)

export default router

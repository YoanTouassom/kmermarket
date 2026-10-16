/**
 * Contrôleur panier.
 * ------------------
 * Chaque action est limitée à l'utilisateur connecté (req.user.id) :
 * le panier serveur remplace le panier localStorage après connexion.
 */
import { asyncHandler } from '../utils/asyncHandler.js'
import ApiError from '../utils/ApiError.js'
import * as cartService from '../services/cartService.js'

export const getCart = asyncHandler(async (req, res) => {
  const cart = await cartService.getCart(req.user.id)
  res.json(cart)
})

export const addItem = asyncHandler(async (req, res) => {
  const cart = await cartService.addItem(
    req.user.id,
    req.body.productId,
    req.body.quantity ?? 1
  )
  res.status(201).json(cart)
})

export const setQuantity = asyncHandler(async (req, res) => {
  const cart = await cartService.setQuantity(
    req.user.id,
    req.params.productId,
    req.body.quantity
  )
  res.json(cart)
})

export const removeItem = asyncHandler(async (req, res) => {
  const cart = await cartService.removeItem(req.user.id, req.params.productId)
  res.json(cart)
})

export const clearCart = asyncHandler(async (req, res) => {
  const cart = await cartService.clear(req.user.id)
  res.json(cart)
})

/** Fusionne le panier invité (localStorage) après connexion / inscription. */
export const mergeCart = asyncHandler(async (req, res) => {
  const cart = await cartService.mergeItems(req.user.id, req.body.items || [])
  res.json(cart)
})

/** Devis de livraison : sous-total du panier serveur + ville. */
export const quote = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentification requise.')
  const cart = await cartService.getCart(req.user.id)
  const subtotal = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const delivery = (await import('../config/delivery.js')).computeDelivery(
    subtotal,
    req.query.city || req.body.city || ''
  )
  res.json({ subtotal, ...delivery, total: subtotal + delivery.fee })
})

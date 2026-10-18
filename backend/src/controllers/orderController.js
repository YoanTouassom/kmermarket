/**
 * Contrôleur commandes.
 * ---------------------
 * Clients : création depuis le panier serveur, liste et détail.
 * Admin : liste globale, détail, changement de statut, stats.
 */
import { asyncHandler } from '../utils/asyncHandler.js'
import * as orderService from '../services/orderService.js'

const toId = (value) => {
  const n = Number.parseInt(value, 10)
  return Number.isFinite(n) ? n : value
}

export const createOrder = asyncHandler(async (req, res) => {
  const userId = req.user ? req.user.id : null
  const order = await orderService.createFromCart(userId, req.body)
  res.status(201).json(order)
})

export const myOrders = asyncHandler(async (req, res) => {
  const orders = await orderService.listByUser(req.user.id)
  res.json(orders)
})

export const myOrderById = asyncHandler(async (req, res) => {
  const order = await orderService.findById(toId(req.params.id), {
    id: req.user.id,
    role: req.user.role,
  })
  res.json(order)
})

export const adminOrders = asyncHandler(async (_req, res) => {
  const orders = await orderService.listAll(_req.query || {})
  res.json(orders)
})

export const newOrdersFeed = asyncHandler(async (req, res) => {
  const after = Math.max(0, Number.parseInt(req.query.after, 10) || 0)
  res.set('Cache-Control', 'no-store')
  res.json(await orderService.listNewSince(after))
})

export const adminOrderById = asyncHandler(async (req, res) => {
  const order = await orderService.findById(toId(req.params.id))
  res.json(order)
})

export const changeStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateStatus(toId(req.params.id), req.body.status)
  res.json(order)
})

export const markPaid = asyncHandler(async (req, res) => {
  const order = await orderService.markAsPaid(toId(req.params.id), req.body.paid !== false)
  res.json(order)
})

export const stats = asyncHandler(async (_req, res) => {
  res.json(await orderService.getStats())
})

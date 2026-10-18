/**
 * Avis clients (produits) : lecture publique, écriture par le client
 * connecté, modération par l'admin.
 */
import { asyncHandler } from '../utils/asyncHandler.js'
import * as reviewService from '../services/reviewService.js'

export const productReviews = asyncHandler(async (req, res) => {
  res.json(await reviewService.listForProduct(req.params.idOrSlug, req.user?.id ?? null))
})

export const saveMyReview = asyncHandler(async (req, res) => {
  const review = await reviewService.upsertMine(req.params.idOrSlug, req.user.id, req.body)
  res.status(201).json(review)
})

export const deleteMyReview = asyncHandler(async (req, res) => {
  await reviewService.deleteMine(req.params.idOrSlug, req.user.id)
  res.status(204).end()
})

export const recentReviews = asyncHandler(async (req, res) => {
  res.json(await reviewService.listRecent(req.query.limit))
})

export const adminReviews = asyncHandler(async (_req, res) => {
  res.json(await reviewService.listAll())
})

export const adminDeleteReview = asyncHandler(async (req, res) => {
  await reviewService.remove(req.params.id)
  res.status(204).end()
})

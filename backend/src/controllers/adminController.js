/**
 * Contrôleur administration.
 * -------------------------
 * Réservé aux comptes avec le rôle `admin` (garde `requireAdmin`).
 * Couvre : utilisateurs, produits, catégories, contenu + paramètres.
 */
import { asyncHandler } from '../utils/asyncHandler.js'
import * as userService from '../services/userService.js'
import * as productService from '../services/productService.js'
import * as categoryService from '../services/categoryService.js'
import * as contentService from '../services/contentService.js'

/* ------------------------- Utilisateurs ------------------------- */

export const listUsers = asyncHandler(async (req, res) => {
  res.json(await userService.listAllUsers(req.query || {}))
})

export const userDetail = asyncHandler(async (req, res) => {
  res.json(await userService.getUserDetail(req.params.id))
})

export const setStatus = asyncHandler(async (req, res) => {
  const user = await userService.setUserStatus(
    req.params.id,
    req.body.isActive,
    req.user.id
  )
  res.json(user)
})

export const setRole = asyncHandler(async (req, res) => {
  const user = await userService.setUserRole(req.params.id, req.body.role, req.user.id)
  res.json(user)
})

export const removeUser = asyncHandler(async (req, res) => {
  await userService.deleteUser(req.params.id, req.user.id)
  res.status(204).end()
})

/* ------------------------- Produits (admin) ------------------------- */

export const adminProducts = asyncHandler(async (_req, res) => {
  res.json(await productService.listAll())
})

export const createProduct = asyncHandler(async (req, res) => {
  const product = await productService.create(req.body)
  res.status(201).json(product)
})

export const updateProduct = asyncHandler(async (req, res) => {
  res.json(await productService.update(req.params.id, req.body))
})

export const updateStock = asyncHandler(async (req, res) => {
  res.json(await productService.updateStock(req.params.id, req.body.stock))
})

export const removeProduct = asyncHandler(async (req, res) => {
  await productService.remove(req.params.id)
  res.status(204).end()
})

/* ------------------------- Catégories (admin) ------------------------- */

export const createCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.create(req.body)
  res.status(201).json(category)
})

export const updateCategory = asyncHandler(async (req, res) => {
  res.json(await categoryService.update(req.params.id, req.body))
})

export const removeCategory = asyncHandler(async (req, res) => {
  await categoryService.remove(req.params.id)
  res.status(204).end()
})

/* ------------------------- Contenu + paramètres ------------------------- */

export const getContent = asyncHandler(async (_req, res) => {
  res.json(await contentService.getContent())
})

export const updateContent = asyncHandler(async (req, res) => {
  res.json(await contentService.updateContent(req.body))
})

export const getSettings = asyncHandler(async (_req, res) => {
  res.json(await contentService.getSettings())
})

export const updateSettings = asyncHandler(async (req, res) => {
  res.json(await contentService.updateSettings(req.body))
})

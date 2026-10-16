/**
 * Contrôleur espace client : profil + adresses.
 */
import { asyncHandler } from '../utils/asyncHandler.js'
import * as userService from '../services/userService.js'

export const getProfile = asyncHandler(async (req, res) => {
  res.json(await userService.getProfile(req.user.id))
})

export const updateProfile = asyncHandler(async (req, res) => {
  res.json(await userService.updateProfile(req.user.id, req.body))
})

export const listAddresses = asyncHandler(async (req, res) => {
  res.json(await userService.listAddresses(req.user.id))
})

export const createAddress = asyncHandler(async (req, res) => {
  const address = await userService.createAddress(req.user.id, req.body)
  res.status(201).json(address)
})

export const updateAddress = asyncHandler(async (req, res) => {
  res.json(await userService.updateAddress(req.user.id, req.params.id, req.body))
})

export const defaultAddress = asyncHandler(async (req, res) => {
  res.json(await userService.setDefaultAddress(req.user.id, req.params.id))
})

export const removeAddress = asyncHandler(async (req, res) => {
  await userService.removeAddress(req.user.id, req.params.id)
  res.status(204).end()
})

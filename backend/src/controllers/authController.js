/**
 * Contrôleur d'authentification.
 * ------------------------------
 * Le contrôleur ne fait que traduire HTTP ↔ service : il ne contient aucune
 * règle métier ni d'accès à la base.
 */
import { asyncHandler } from '../utils/asyncHandler.js'
import ApiError from '../utils/ApiError.js'
import { signToken, AUTH_COOKIE } from '../middleware/auth.js'
import * as authService from '../services/authService.js'
import * as userService from '../services/userService.js'
import { env, isProd } from '../config/env.js'

/** Cookie httpOnly + réponse JSON classique : le frontend choisit son camp. */
function respondWithToken(res, user, status = 200) {
  const token = signToken(user)

  // En production cross-domain (frontend Vercel ↔ API Render), le navigateur
  // n'accepte le cookie tiers que sous `SameSite=None; Secure` (HTTPS requis).
  // En local (même origine logique), on garde `lax` pour une sécurité maximale.
  res.cookie(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })

  res.status(status).json({ user, token })
}

export const register = asyncHandler(async (req, res) => {
  const { user } = await authService.register(req.body)
  respondWithToken(res, user, 201)
})

export const login = asyncHandler(async (req, res) => {
  const { user } = await authService.login(req.body)
  respondWithToken(res, user)
})

export const logout = asyncHandler(async (_req, res) => {
  res.clearCookie(AUTH_COOKIE, {
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd,
  })
  res.json({ ok: true })
})

export const me = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentification requise.')
  res.json({ user: req.user })
})

export const updateMe = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user.id, req.body)
  res.json({ user })
})

export const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.requestPasswordReset(req.body.email)
  res.json(result)
})

export const resetPassword = asyncHandler(async (req, res) => {
  const result = await authService.resetPassword(req.body)
  res.json(result)
})

export const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.user.id, req.body)
  res.json({ ok: true })
})

/** Jeton d'exemple pour les environnements sans service email (dev uniquement). */
export const devTokenInfo = asyncHandler(async (_req, res) => {
  if (isProd) throw ApiError.notFound()
  res.json({ jwtExpiresIn: env.jwt.expiresIn })
})

/**
 * Schémas de validation (Zod).
 * ----------------------------
 * Regroupés ici pour garder les routes lisibles et les règles cohérentes
 * entre l'inscription, la connexion et la mise à jour du profil.
 */
import { z } from 'zod'

/* ------------------------------------------------------------------ */
/*  Primitives                                                         */
/* ------------------------------------------------------------------ */

export const idParam = z.object({
  id: z.coerce.number().int().positive({ message: 'Identifiant invalide.' }),
})

/** Numéro camerounais : 6XXXXXXXX, +237 6XX XX XX XX, etc. */
const phoneSchema = z
  .string()
  .trim()
  .refine((v) => v === '' || v.replace(/\D/g, '').length >= 8, {
    message: 'Numéro de téléphone invalide.',
  })
  .refine((v) => v === '' || v.replace(/\D/g, '').length <= 15, {
    message: 'Numéro de téléphone trop long.',
  })

/**
 * URL d'image (produit, catégorie) : adresse web ou chemin du site.
 * Les images intégrées « data:… » sont refusées : elles pèsent des dizaines
 * de Ko et alourdiraient chaque liste de produits renvoyée par l'API.
 */
const imageUrlSchema = z
  .string()
  .trim()
  .refine((v) => !/^data:/i.test(v), {
    message:
      "Cette image est intégrée (data:…), pas une adresse. Ouvrez l'image en ligne puis clic droit → « Copier l'adresse de l'image ».",
  })
  .refine((v) => v === '' || /^(https?:\/\/|\/)/i.test(v), {
    message: "L'adresse de l'image doit commencer par https:// (ou http://).",
  })
  .refine((v) => v.length <= 2048, {
    message: "L'adresse de l'image est trop longue (2048 caractères maximum).",
  })
  .optional()
  .default('')

const optionalText = (max = 300) =>
  z
    .string()
    .trim()
    .max(max, { message: `Maximum ${max} caractères.` })
    .optional()

/* ------------------------------------------------------------------ */
/*  Authentification                                                   */
/* ------------------------------------------------------------------ */

export const registerSchema = z.object({
  firstName: z.string().trim().min(2, { message: 'Prénom trop court.' }).max(60),
  lastName: z.string().trim().min(2, { message: 'Nom trop court.' }).max(60),
  email: z.string().trim().toLowerCase().email({ message: 'Adresse email invalide.' }),
  phone: phoneSchema,
  password: z
    .string()
    .min(6, { message: 'Le mot de passe doit contenir au moins 6 caractères.' })
    .max(72, { message: 'Le mot de passe est trop long.' }),
})

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email({ message: 'Adresse email invalide.' }),
  password: z.string().min(1, { message: 'Mot de passe requis.' }),
})

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email({ message: 'Adresse email invalide.' }),
})

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(10, { message: 'Token invalide.' }),
  password: z.string().min(6, { message: 'Mot de passe trop court (6 caractères minimum).' }).max(72),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, { message: 'Mot de passe actuel requis.' }),
  newPassword: z.string().min(6, { message: 'Nouveau mot de passe trop court.' }).max(72),
})
/* ------------------------------------------------------------------ */
/*  Profil & adresses                                                  */
/* ------------------------------------------------------------------ */

export const updateProfileSchema = z.object({
  firstName: z.string().trim().min(2).max(60).optional(),
  lastName: z.string().trim().min(2).max(60).optional(),
  email: z.string().trim().toLowerCase().email({ message: 'Adresse email invalide.' }).optional(),
  phone: phoneSchema.optional(),
  city: optionalText(80),
  quartier: optionalText(80),
  address: optionalText(200),
  avatar: optionalText(500),
  preferences: z
    .object({
      newsletter: z.boolean().optional(),
      sms: z.boolean().optional(),
      promos: z.boolean().optional(),
    })
    .optional(),
})

export const addressSchema = z.object({
  city: z.string().trim().min(2, { message: 'La ville est requise.' }).max(80),
  quartier: z.string().trim().min(2, { message: 'Le quartier est requis.' }).max(80),
  address: z.string().trim().min(5, { message: 'L’adresse est trop courte.' }).max(200),
  additionalInfo: optionalText(200),
  isDefault: z.boolean().optional(),
})

export const updateAddressSchema = addressSchema.partial()

/* ------------------------------------------------------------------ */
/*  Catalogue                                                          */
/* ------------------------------------------------------------------ */

export const productQuerySchema = z.object({
  search: z.string().trim().max(80).optional().default(''),
  categoryId: z.string().trim().optional().default(''),
  sort: z
    .enum(['popular', 'price-asc', 'price-desc', 'rating', 'newest', 'name-asc'])
    .optional()
    .default('popular'),
  inStock: z.enum(['true', 'false', '1', '0']).optional(),
  onSale: z.enum(['true', 'false', '1', '0']).optional(),
  featured: z.enum(['true', 'false', '1', '0']).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
})

export const suggestQuerySchema = z.object({
  q: z.string().trim().optional().default(''),
  limit: z.coerce.number().int().min(1).max(10).optional().default(5),
})

export const productSchema = z.object({
  name: z.string().trim().min(3, { message: 'Le nom du produit est requis.' }).max(120),
  slug: z.string().trim().max(140).optional(),
  categoryId: z.union([z.coerce.number().int().positive(), z.string().trim()]).optional().nullable(),
  description: z.string().trim().max(2000).optional().default(''),
  tagline: z.string().trim().max(160).optional().default(''),
  price: z.coerce.number().min(0, { message: 'Le prix doit être positif.' }),
  oldPrice: z.coerce.number().min(0).optional().nullable(),
  unit: z.string().trim().max(40).optional().default('Unité'),
  stock: z.coerce.number().int().min(0).optional().default(0),
  image: imageUrlSchema,
  origin: z.string().trim().max(80).optional().default(''),
  rating: z.coerce.number().min(0).max(5).optional().default(0),
  reviews: z.coerce.number().int().min(0).optional().default(0),
  sold: z.coerce.number().int().min(0).optional().default(0),
  tags: z.array(z.string().trim().max(40)).max(12).optional().default([]),
  available: z.boolean().optional().default(true),
  featured: z.boolean().optional().default(false),
  isNew: z.boolean().optional().default(false),
})

/* ------------------------------------------------------------------ */
/*  Panier & commandes                                                 */
/* ------------------------------------------------------------------ */

export const cartItemSchema = z.object({
  productId: z.union([z.coerce.number().int().positive(), z.string().trim().min(1)]),
  quantity: z.coerce.number().int().min(1, { message: 'Quantité minimale : 1.' }).max(99).optional().default(1),
})

export const cartQuantitySchema = z.object({
  quantity: z.coerce.number().int().min(0, { message: 'Quantité invalide.' }).max(99),
})

export const productIdParam = z.object({
  productId: z.union([z.coerce.number().int().positive(), z.string().trim().min(1)]),
})

export const mergeCartSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.union([z.coerce.number().int().positive(), z.string().trim().min(1)]),
        quantity: z.coerce.number().int().min(1).max(99),
      })
    )
    .max(60)
    .default([]),
})

export const createOrderSchema = z.object({
  city: z.string().trim().min(2, { message: 'La ville de livraison est requise.' }).max(80),
  neighborhood: z.string().trim().min(2, { message: 'Le quartier est requis.' }).max(80),
  address: z.string().trim().min(5, { message: 'L’adresse détaillée est requise.' }).max(200),
  additionalInfo: optionalText(200),
  phone: phoneSchema.optional(),
  paymentMethod: z.enum(['cash', 'mtn_momo', 'orange_money']).optional().default('cash'),
  note: optionalText(500),
  saveAddress: z.boolean().optional().default(true),
})

export const quoteSchema = z.object({
  city: z.string().trim().min(2).max(80),
  subtotal: z.coerce.number().min(0),
})

export const orderQuerySchema = z.object({
  status: z.string().trim().optional().default('all'),
  search: z.string().trim().max(80).optional().default(''),
  // Commandes d'un client précis (fiche client de l'admin)
  userId: z.coerce.number().int().positive().optional(),
})

export const orderStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'preparing', 'shipping', 'delivered', 'cancelled']),
})

export const paidSchema = z.object({
  paid: z.boolean().optional().default(true),
})

/* ------------------------------------------------------------------ */
/*  Administration — utilisateurs                                      */
/* ------------------------------------------------------------------ */

export const userQuerySchema = z.object({
  search: z.string().trim().max(80).optional().default(''),
  role: z.enum(['all', 'customer', 'admin']).optional().default('all'),
  status: z.enum(['all', 'active', 'inactive']).optional().default('all'),
})

export const userStatusSchema = z.object({
  isActive: z.boolean(),
})

export const userRoleSchema = z.object({
  role: z.enum(['customer', 'admin']),
})

export const productUpdateSchema = productSchema.partial()

export const stockSchema = z.object({
  stock: z.coerce.number().int().min(0, { message: 'Le stock ne peut pas être négatif.' }),
})

export const categorySchema = z.object({
  name: z.string().trim().min(2, { message: 'Le nom de la catégorie est requis.' }).max(80),
  slug: z.string().trim().max(100).optional(),
  description: z.string().trim().max(600).optional().default(''),
  icon: z.string().trim().max(40).optional().default('Leaf'),
  color: z.string().trim().max(20).optional().default('#1b7f52'),
  image: imageUrlSchema,
})

export const categoryUpdateSchema = categorySchema.partial()
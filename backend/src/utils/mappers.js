/**
 * Mappers base de données → contrat frontend
 * ------------------------------------------
 * Le frontend React attend des identifiants sous forme de chaînes et du
 * camelCase. On centralise la conversion ici pour ne pas la disperser.
 */

/* ---------------- Utilisateurs ---------------- */

export function toUser(row) {
  if (!row) return null
  const firstName = row.first_name || ''
  const lastName = row.last_name || ''
  return {
    id: String(row.id),
    firstName,
    lastName,
    name: `${firstName} ${lastName}`.trim(),
    email: row.email,
    phone: row.phone || '',
    role: String(row.role || 'customer').toLowerCase(),
    status: row.is_active ? 'active' : 'inactive',
    city: row.city || '',
    quartier: row.neighborhood || '',
    address: row.address || '',
    avatar: row.avatar || '',
    preferences: row.preferences || { newsletter: true, sms: false, promos: true },
    createdAt: row.created_at,
  }
}

/* ---------------- Adresses ---------------- */

export function toAddress(row) {
  if (!row) return null
  return {
    id: String(row.id),
    userId: String(row.user_id),
    city: row.city || '',
    quartier: row.neighborhood || '',
    address: row.address || '',
    additionalInfo: row.additional_info || '',
    isDefault: !!row.is_default,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/* ---------------- Catégories ---------------- */

export function toCategory(row) {
  if (!row) return null
  const category = {
    id: String(row.id),
    name: row.name,
    slug: row.slug,
    description: row.description || '',
    icon: row.icon || 'Leaf',
    color: row.color || '#1b7f52',
    image: row.image || '',
  }
  if (row.product_count !== undefined) {
    category.productCount = Number(row.product_count)
  }
  return category
}

/* ---------------- Produits ---------------- */

export function toProduct(row) {
  if (!row) return null
  return {
    id: String(row.id),
    name: row.name,
    slug: row.slug,
    categoryId: row.category_id === null ? '' : String(row.category_id),
    categoryName: row.category_name || undefined,
    price: Number(row.price),
    oldPrice: row.old_price === null || row.old_price === undefined ? null : Number(row.old_price),
    unit: row.unit || 'Unité',
    stock: Number(row.stock || 0),
    available: !!row.is_active,
    rating: Number(row.rating || 0),
    reviews: Number(row.reviews || 0),
    sold: Number(row.sold || 0),
    origin: row.origin || '',
    tagline: row.tagline || '',
    description: row.description || '',
    tags: Array.isArray(row.tags) ? row.tags : [],
    image: row.image || '',
    featured: !!row.is_featured,
    isNew: !!row.is_new,
    onSale: !!row.is_on_sale,
    createdAt: row.created_at,
  }
}

/* ---------------- Commandes ---------------- */

export function toOrderItem(row) {
  return {
    productId: row.product_id === null ? null : String(row.product_id),
    name: row.product_name || '',
    unit: row.unit || '',
    price: Number(row.unit_price),
    quantity: Number(row.quantity),
    image: row.image || '',
    subtotal: Number(row.subtotal),
  }
}

export function toOrder(row, items = [], timeline = []) {
  if (!row) return null
  return {
    id: String(row.id),
    reference: row.order_number,
    userId: row.user_id === null ? null : String(row.user_id),
    customer: {
      firstName: row.customer_first_name || '',
      lastName: row.customer_last_name || '',
      email: row.customer_email || '',
      phone: row.customer_phone || '',
      city: row.city || '',
      quartier: row.neighborhood || '',
      address: row.address || '',
    },
    items,
    subtotal: Number(row.subtotal),
    deliveryFee: Number(row.delivery_fee),
    total: Number(row.total),
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    status: row.status,
    note: row.note || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    timeline: timeline.map((t) => ({ status: t.status, at: t.created_at })),
  }
}

export function toCartItem(row) {
  return {
    productId: String(row.product_id),
    name: row.name,
    slug: row.slug,
    unit: row.unit,
    price: Number(row.price),
    oldPrice: row.old_price === null ? null : Number(row.old_price),
    image: row.image,
    // Quantité en stock non exposée au client : seulement disponible ou non.
    inStock: Number(row.stock) > 0,
    quantity: Number(row.quantity),
    categoryId: row.category_id === null ? '' : String(row.category_id),
  }
}

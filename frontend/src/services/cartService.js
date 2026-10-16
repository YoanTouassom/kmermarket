import { api } from "./api";

/**
 * Panier serveur (API REST).
 * Le même format de ligne est conservé pour ne pas casser les pages.
 */

function unwrapCart(res) {
  if (Array.isArray(res)) return { items: res };
  if (Array.isArray(res?.items)) return res;
  return { items: [] };
}

export const cartService = {
  async get() {
    const res = await api.get("/cart");
    return unwrapCart(res);
  },

  async add(product, quantity = 1) {
    const id = product?.id ?? product?.productId ?? product;
    const res = await api.post("/cart/items", { productId: id, quantity });
    return unwrapCart(res);
  },

  async setQuantity(productId, quantity) {
    const res = await api.patch(
      `/cart/items/${encodeURIComponent(productId)}`,
      {
        quantity,
      },
    );
    return unwrapCart(res);
  },

  async remove(productId) {
    const res = await api.del(`/cart/items/${encodeURIComponent(productId)}`);
    return unwrapCart(res);
  },

  async clear() {
    const res = await api.del("/cart");
    return unwrapCart(res);
  },

  async merge(items = []) {
    const res = await api.post("/cart/merge", {
      items: (items || []).map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      })),
    });
    return unwrapCart(res);
  },
};

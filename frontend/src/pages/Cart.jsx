import { Link, useNavigate } from "react-router-dom";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  Truck,
  Tag,
} from "lucide-react";
import {
  useCartStore,
  useCartSubtotal,
  useCartCount,
} from "../store/cartStore";
import { useAuthStore } from "../store/authStore";
import { useUIStore } from "../store/uiStore";
import { orderService } from "../services/orderService";
import { Button, EmptyState, ConfirmDialog } from "../components/ui/primitives";
import { formatPrice } from "../utils/format";
import { FREE_DELIVERY_THRESHOLD } from "../utils/constants";
import { useState } from "react";
import { IMAGE_PLACEHOLDER, onImageError } from "../utils/images";

export default function Cart() {
  const items = useCartStore((s) => s.items);
  const increment = useCartStore((s) => s.increment);
  const decrement = useCartStore((s) => s.decrement);
  const removeItem = useCartStore((s) => s.removeItem);
  const clear = useCartStore((s) => s.clear);
  const subtotal = useCartSubtotal();
  const count = useCartCount();
  const user = useAuthStore((s) => s.user);
  const success = useUIStore((s) => s.success);
  const navigate = useNavigate();

  const [askClear, setAskClear] = useState(false);

  const city = user?.city || "Douala";
  const { fee, free, eta } = orderService.computeDelivery(subtotal, city);
  const total = subtotal + fee;
  const missing = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);

  if (!items.length) {
    return (
      <div className="container" style={{ paddingTop: 30, paddingBottom: 60 }}>
        <EmptyState
          icon={ShoppingBag}
          title="Votre panier est vide"
          text="Parcourez nos produits frais et ajoutez vos premières denrées au panier."
          action={
            <Button
              variant="primary"
              icon={ArrowRight}
              onClick={() => navigate("/shop")}
            >
              Découvrir la boutique
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: 26, paddingBottom: 50 }}>
      <div className="mf-sec-head">
        <div>
          <span className="mf-eyebrow">Panier</span>
          <h1 style={{ fontSize: 28 }}>Mon panier ({count})</h1>
        </div>
        <Button variant="ghost" icon={Trash2} onClick={() => setAskClear(true)}>
          Vider le panier
        </Button>
      </div>

      <div className="mf-cart-layout">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {items.map((item) => (
            <div key={item.productId} className="mf-cart-item">
              <Link to={`/product/${item.productId}`}>
                <img src={item.image || IMAGE_PLACEHOLDER} alt={item.name} onError={onImageError} />
              </Link>
              <div>
                <Link to={`/product/${item.productId}`} className="nm">
                  {item.name}
                </Link>
                <div className="un">{item.unit}</div>
                <div
                  style={{
                    marginTop: 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                  }}
                >
                  <div className="mf-qty">
                    <button
                      onClick={() => decrement(item.productId)}
                      aria-label="Diminuer"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="val">{item.quantity}</span>
                    <button
                      onClick={() => increment(item.productId)}
                      aria-label="Augmenter"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <button
                    className="mf-act-btn del"
                    onClick={() => {
                      removeItem(item.productId);
                      success(`${item.name} retiré du panier`);
                    }}
                    aria-label="Supprimer"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
              <div className="mf-cart-price">
                <div
                  className="price"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 800,
                    fontSize: 18,
                  }}
                >
                  {formatPrice(item.price * item.quantity)}
                </div>
                {item.quantity > 1 && (
                  <div style={{ fontSize: 12.5, color: "var(--ink-500)" }}>
                    {formatPrice(item.price)} × {item.quantity}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <aside className="mf-summary">
          <h3>Résumé de la commande</h3>

          {missing > 0 && (
            <div
              className="mf-promo orange"
              style={{ marginBottom: 16, padding: "12px 14px" }}
            >
              <span className="ic" style={{ width: 34, height: 34 }}>
                <Truck size={17} />
              </span>
              <div className="ds">
                Plus que <strong>{formatPrice(missing)}</strong> pour la
                livraison offerte.
              </div>
            </div>
          )}

          <div className="mf-summary-row">
            <span>Sous-total</span>
            <span style={{ fontWeight: 700, color: "var(--ink-900)" }}>
              {formatPrice(subtotal)}
            </span>
          </div>
          <div className="mf-summary-row">
            <span>
              Livraison <span style={{ color: "var(--ink-400)" }}>({eta})</span>
            </span>
            <span
              style={{
                fontWeight: 700,
                color: free ? "var(--green-600)" : "var(--ink-900)",
              }}
            >
              {free ? "Offerte" : formatPrice(fee)}
            </span>
          </div>
          <div className="mf-summary-row total">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>

          <Button
            variant="primary"
            size="lg"
            icon={ArrowRight}
            className="btn-block mt-16"
            onClick={() => navigate("/checkout")}
          >
            Passer la commande
          </Button>
          <Link
            to="/shop"
            className="btn btn-ghost btn-block mt-8"
            style={{ justifyContent: "center" }}
          >
            Continuer mes achats
          </Link>

          <div
            style={{
              marginTop: 16,
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12.5,
              color: "var(--ink-500)",
            }}
          >
            <Tag size={14} /> Paiement à la livraison ou Mobile Money
          </div>
        </aside>
      </div>

      <ConfirmDialog
        open={askClear}
        onClose={() => setAskClear(false)}
        onConfirm={() => {
          clear();
          setAskClear(false);
          success("Panier vidé");
        }}
        title="Vider le panier ?"
        message="Tous les articles seront retirés de votre panier. Cette action est irréversible."
        confirmLabel="Vider le panier"
      />
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  Truck,
  MapPin,
  Phone,
  CheckCircle2,
  Circle,
  XCircle,
} from "lucide-react";
import { orderService } from "../services/orderService";
import { useUIStore } from "../store/uiStore";
import {
  Button,
  EmptyState,
  Skeleton,
  ConfirmDialog,
} from "../components/ui/primitives";
import OrderStatusBadge from "../components/OrderStatusBadge";
import { formatPrice, formatDate } from "../utils/format";
import { IMAGE_PLACEHOLDER, onImageError } from "../utils/images";
import {
  ORDER_STATUS,
  ORDER_STATUS_LIST,
  PAYMENT_METHODS,
  formatMobileNumber,
} from "../utils/constants";

const FLOW = [
  ORDER_STATUS.PENDING,
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.PREPARING,
  ORDER_STATUS.SHIPPING,
  ORDER_STATUS.DELIVERED,
];

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const success = useUIStore((s) => s.success);
  const error = useUIStore((s) => s.error);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [askCancel, setAskCancel] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const o = await orderService.getById(id);
      if (active) {
        setOrder(o);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const cancel = async () => {
    try {
      const updated = await orderService.cancel(order.id);
      setOrder({ ...updated });
      success("Commande annulée");
    } catch (e) {
      error(e.message);
    } finally {
      setAskCancel(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Skeleton height={70} radius={14} />
        <Skeleton height={220} radius={14} />
      </div>
    );
  }

  if (!order) {
    return (
      <EmptyState
        icon={Package}
        title="Commande introuvable"
        text="Cette commande n’existe pas ou n’est plus disponible."
        action={
          <Button variant="primary" onClick={() => navigate("/orders")}>
            Retour à mes commandes
          </Button>
        }
      />
    );
  }

  const currentIdx = FLOW.indexOf(order.status);
  const cancelled = order.status === ORDER_STATUS.CANCELLED;
  const payment = PAYMENT_METHODS.find((p) => p.value === order.paymentMethod);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <Link
        to="/orders"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          color: "var(--green-700)",
          fontWeight: 600,
          fontSize: 14,
        }}
      >
        <ArrowLeft size={16} /> Retour à mes commandes
      </Link>

      <div className="mf-panel">
        <div className="mf-panel-head">
          <div>
            <h3>Commande {order.reference}</h3>
            <span style={{ fontSize: 13, color: "var(--ink-500)" }}>
              Passée le {formatDate(order.createdAt, true)}
            </span>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
        <div className="mf-panel-body">
          {cancelled ? (
            <div className="mf-cancelled-band">
              <XCircle size={20} /> Cette commande a été annulée.
            </div>
          ) : (
            <div className="mf-timeline">
              {FLOW.map((st, i) => {
                const meta = ORDER_STATUS_LIST.find((s) => s.value === st);
                const done = i <= currentIdx;
                const at = order.timeline?.find((t) => t.status === st)?.at;
                return (
                  <div
                    key={st}
                    className={`mf-tl-step ${done ? "done" : ""} ${i === currentIdx ? "current" : ""}`}
                  >
                    <span className="dot">
                      {done ? <CheckCircle2 size={18} /> : <Circle size={16} />}
                    </span>
                    <div>
                      <div className="lb">{meta?.label}</div>
                      {at && <div className="at">{formatDate(at, true)}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mf-order-grid2">
            <div className="mf-info-block">
              <div className="tt">
                <MapPin size={15} /> Livraison
              </div>
              <div className="ln">
                {order.customer.firstName} {order.customer.lastName}
              </div>
              <div className="ln">{order.customer.address}</div>
              <div className="ln">
                {order.customer.quartier}, {order.customer.city}
              </div>
            </div>
            <div className="mf-info-block">
              <div className="tt">
                <Phone size={15} /> Contact
              </div>
              <div className="ln">{order.customer.phone}</div>
              {order.customer.email && (
                <div className="ln">{order.customer.email}</div>
              )}
              <div
                className="ln"
                style={{
                  marginTop: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Truck size={14} /> {payment?.label}
              </div>
              {payment?.number && order.paymentStatus !== "paid" && (
                <div className="ln" style={{ marginTop: 6 }}>
                  Envoyez <strong>{formatPrice(order.total)}</strong> au{" "}
                  <strong>{formatMobileNumber(payment.number)}</strong> (référence{" "}
                  {order.reference}).
                </div>
              )}
            </div>
          </div>

          {order.note && (
            <div className="mf-info-block" style={{ marginTop: 14 }}>
              <div className="tt">Instructions de livraison</div>
              <div className="ln">{order.note}</div>
            </div>
          )}
        </div>
      </div>

      <div className="mf-panel">
        <div className="mf-panel-head">
          <h3>Articles commandés</h3>
        </div>
        <div
          className="mf-panel-body"
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          {order.items.map((it, i) => (
            <div
              key={i}
              style={{ display: "flex", gap: 14, alignItems: "center" }}
            >
              <img
                src={it.image || IMAGE_PLACEHOLDER}
                onError={onImageError}
                alt=""
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 10,
                  objectFit: "cover",
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{it.name}</div>
                <div style={{ fontSize: 13, color: "var(--ink-500)" }}>
                  {it.unit} · {it.quantity} × {formatPrice(it.price)}
                </div>
              </div>
              <div style={{ fontWeight: 700 }}>
                {formatPrice(it.price * it.quantity)}
              </div>
            </div>
          ))}
        </div>
        <div
          className="mf-panel-body"
          style={{ borderTop: "1px solid var(--ink-200)" }}
        >
          <div className="mf-summary-row">
            <span>Sous-total</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="mf-summary-row">
            <span>Livraison</span>
            <span>
              {order.deliveryFee ? formatPrice(order.deliveryFee) : "Offerte"}
            </span>
          </div>
          <div className="mf-summary-row total">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      {[ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED].includes(
        order.status,
      ) && (
        <div>
          <Button
            variant="danger"
            icon={XCircle}
            onClick={() => setAskCancel(true)}
          >
            Annuler la commande
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={askCancel}
        onClose={() => setAskCancel(false)}
        onConfirm={cancel}
        title="Annuler la commande ?"
        message="Votre commande sera annulée et ne pourra plus être livrée."
        confirmLabel="Oui, annuler"
      />
    </div>
  );
}

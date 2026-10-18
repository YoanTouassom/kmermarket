import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, ArrowRight, Eye } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { orderService } from "../services/orderService";
import { EmptyState, Button, Skeleton } from "../components/ui/primitives";
import OrderStatusBadge from "../components/OrderStatusBadge";
import { formatPrice, formatDate } from "../utils/format";
import { ORDER_STATUS_LIST } from "../utils/constants";
import { IMAGE_PLACEHOLDER, onImageError } from "../utils/images";

export default function Orders() {
  const user = useAuthStore((s) => s.user);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      const list = await orderService.listByUser(user?.id);
      if (active) {
        setOrders(list);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user?.id]);

  const filtered = filter ? orders.filter((o) => o.status === filter) : orders;

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} height={110} radius={14} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="mf-sec-head" style={{ marginBottom: 0 }}>
        <div>
          <span className="mf-eyebrow">Historique</span>
          <h1 style={{ fontSize: 24 }}>Mes commandes</h1>
        </div>
        <span style={{ color: "var(--ink-500)", fontSize: 14 }}>
          {orders.length} commande{orders.length > 1 ? "s" : ""}
        </span>
      </div>

      <div className="mf-chip-row">
        <button
          className={`mf-chip ${!filter ? "active" : ""}`}
          onClick={() => setFilter("")}
        >
          Toutes
        </button>
        {ORDER_STATUS_LIST.map((s) => (
          <button
            key={s.value}
            className={`mf-chip ${filter === s.value ? "active" : ""}`}
            onClick={() => setFilter(s.value)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title={
            orders.length
              ? "Aucune commande pour ce filtre"
              : "Aucune commande pour le moment"
          }
          text={
            orders.length
              ? "Essayez un autre statut pour retrouver vos commandes."
              : "Vos futures commandes apparaîtront ici avec leur suivi de livraison."
          }
          action={
            !orders.length ? (
              <Link to="/shop" className="btn btn-primary">
                Commencer mes achats <ArrowRight size={17} />
              </Link>
            ) : null
          }
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {filtered.map((o) => (
            <div key={o.id} className="mf-order-card">
              <div className="mf-order-thumbs">
                {o.items.slice(0, 3).map((it, i) => (
                  <img key={i} src={it.image || IMAGE_PLACEHOLDER} alt="" onError={onImageError} />
                ))}
                {o.items.length > 3 && (
                  <span className="more">+{o.items.length - 3}</span>
                )}
              </div>
              <div className="mf-order-meta">
                <div className="ref">{o.reference}</div>
                <div className="date">{formatDate(o.createdAt, true)}</div>
              </div>
              <div className="mf-order-status">
                <OrderStatusBadge status={o.status} />
              </div>
              <div className="mf-order-total">{formatPrice(o.total)}</div>
              <Link to={`/orders/${o.id}`} className="btn btn-outline btn-sm">
                <Eye size={15} /> Détails
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

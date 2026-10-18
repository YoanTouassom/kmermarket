import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useUIStore } from "../../store/uiStore";
import { productService } from "../../services/productService";
import { ProductGrid } from "../../components/shared";
import { Button, EmptyState } from "../../components/ui/primitives";

export default function Favorites() {
  const favorites = useUIStore((s) => s.favorites);
  const pruneFavorites = useUIStore((s) => s.pruneFavorites);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Recharge quand un favori est ajouté ; un retrait est filtré localement.
  const key = [...favorites].sort().join(",");
  useEffect(() => {
    let cancelled = false;
    if (!favorites.length) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.allSettled(favorites.map((id) => productService.getById(id))).then(
      (results) => {
        if (cancelled) return;
        const found = results
          .filter((r) => r.status === "fulfilled" && r.value)
          .map((r) => r.value);
        setProducts(found);
        setLoading(false);
        // Produit supprimé du catalogue (404) : on le retire des favoris.
        const missing = results.some(
          (r) => r.status === "rejected" && r.reason?.status === 404
        );
        if (missing) pruneFavorites(found.map((p) => p.id));
      }
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const visible = products.filter((p) => favorites.includes(p.id));

  return (
    <div className="mf-panel">
      <div className="mf-panel-head">
        <h3>Mes favoris</h3>
        {visible.length > 0 && (
          <span style={{ color: "var(--ink-600)", fontSize: 14 }}>
            {visible.length} produit{visible.length > 1 ? "s" : ""}
          </span>
        )}
      </div>
      <div className="mf-panel-body">
      <ProductGrid
        products={visible}
        loading={loading && !visible.length}
        skeletonCount={Math.min(favorites.length || 3, 6)}
        empty={
          <EmptyState
            icon={Heart}
            title="Aucun favori pour l'instant"
            text="Touchez le cœur d'un produit pour le retrouver ici."
            action={
              <Link to="/shop">
                <Button variant="primary">Découvrir la boutique</Button>
              </Link>
            }
          />
        }
      />
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Minus,
  Plus,
  ShoppingCart,
  Heart,
  MapPin,
  Package,
  ShieldCheck,
  Truck,
  ChevronRight,
  Star,
} from "lucide-react";
import { productService } from "../services/productService";
import { useCatalogStore } from "../store/catalogStore";
import { useCartStore } from "../store/cartStore";
import { useUIStore } from "../store/uiStore";
import ProductCard from "../components/ProductCard";
import ProductReviews from "../components/ProductReviews";
import {
  Button,
  Badge,
  StarRating,
  Spinner,
  EmptyState,
  Skeleton,
} from "../components/ui/primitives";
import { formatPrice, discountPercent } from "../utils/format";
import { IMAGE_PLACEHOLDER, onImageError } from "../utils/images";
import { isOutOfStock } from "../utils/stock";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);
  const success = useUIStore((s) => s.success);
  const categories = useCatalogStore((s) => s.categories);
  const favorites = useUIStore((s) => s.favorites);
  const toggleFavorite = useUIStore((s) => s.toggleFavorite);

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setQty(1);
    (async () => {
      const p = await productService.getById(id);
      if (!active) return;
      setProduct(p);
      if (p) {
        const r = await productService.related(p, 4);
        if (active) setRelated(r);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: 40, paddingBottom: 40 }}>
        <div className="mf-pdp">
          <Skeleton height={460} radius={20} />
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Skeleton height={26} width="60%" />
            <Skeleton height={18} width="35%" />
            <Skeleton height={40} width="45%" />
            <Skeleton height={90} />
            <Skeleton height={50} width="70%" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container">
        <EmptyState
          icon={Package}
          title="Produit introuvable"
          text="Ce produit n’existe plus ou a été retiré de la boutique."
          action={
            <Button variant="primary" onClick={() => navigate("/shop")}>
              Retour à la boutique
            </Button>
          }
        />
      </div>
    );
  }

  const category = categories.find((c) => c.id === product.categoryId);
  const discount = discountPercent(product.price, product.oldPrice);
  const out = isOutOfStock(product);
  const isFav = favorites.includes(product.id);

  const handleAdd = () => {
    addItem(product, qty);
    success(`${qty} × ${product.name} ajouté au panier`);
  };

  return (
    <div className="container" style={{ paddingBottom: 30 }}>
      <nav className="mf-breadcrumb">
        <Link to="/">Accueil</Link>
        <ChevronRight size={14} className="sep" />
        <Link to="/shop">Boutique</Link>
        <ChevronRight size={14} className="sep" />
        {category && (
          <>
            <Link to={`/shop?category=${category.id}`}>{category.name}</Link>
            <ChevronRight size={14} className="sep" />
          </>
        )}
        <span>{product.name}</span>
      </nav>

      <div className="mf-pdp">
        <div className="mf-pdp-media">
          <img src={product.image || IMAGE_PLACEHOLDER} alt={product.name} onError={onImageError} />
        </div>

        <div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {category && <Badge tone="green">{category.name}</Badge>}
            {discount > 0 && (
              <Badge tone="orange">Promotion -{discount}%</Badge>
            )}
            {product.isNew && <Badge tone="blue">Nouveau</Badge>}
          </div>

          <h1 className="mf-pdp-title">{product.name}</h1>
          <p style={{ color: "var(--ink-500)", fontSize: 15 }}>
            {product.tagline}
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginTop: 12,
            }}
          >
            {product.reviews > 0 ? (
              <a href="#avis" className="mf-pdp-rating-link">
                <StarRating value={product.rating} count={product.reviews} />
              </a>
            ) : (
              <a href="#avis" className="mf-pdp-rating-link none">
                Aucun avis — soyez le premier
              </a>
            )}
            <span style={{ color: "var(--ink-400)", fontSize: 13 }}>
              · {product.sold} vendus
            </span>
          </div>

          <div className="mf-pdp-price-row">
            <span className="price">{formatPrice(product.price)}</span>
            {product.oldPrice && (
              <span className="old">{formatPrice(product.oldPrice)}</span>
            )}
            <span style={{ fontSize: 14, color: "var(--ink-500)" }}>
              / {product.unit}
            </span>
          </div>

          <p style={{ color: "var(--ink-700)", lineHeight: 1.7 }}>
            {product.description}
          </p>

          <div className="mf-pdp-facts">
            <div className="mf-fact">
              <div className="l">
                <MapPin size={14} /> Origine
              </div>
              <div className="v">{product.origin || "Cameroun"}</div>
            </div>
            <div className="mf-fact">
              <div className="l">
                <Package size={14} /> Unité de vente
              </div>
              <div className="v">{product.unit}</div>
            </div>
            <div className="mf-fact">
              <div className="l">
                <ShieldCheck size={14} /> Disponibilité
              </div>
              <div
                className="v"
                style={{ color: out ? "var(--danger)" : "var(--green-700)" }}
              >
                {out ? "Rupture de stock" : "En stock"}
              </div>
            </div>
            <div className="mf-fact">
              <div className="l">
                <Truck size={14} /> Livraison
              </div>
              <div className="v">Sous 24 à 48h</div>
            </div>
          </div>

          <div className="mf-pdp-buy">
            <div className="mf-qty">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Diminuer"
              >
                <Minus size={17} />
              </button>
              <span className="val">{qty}</span>
              <button
                onClick={() => setQty((q) => q + 1)}
                aria-label="Augmenter"
              >
                <Plus size={17} />
              </button>
            </div>
            <Button
              variant="primary"
              size="lg"
              icon={ShoppingCart}
              onClick={handleAdd}
              disabled={out}
              style={{ flex: 1, minWidth: 200 }}
            >
              {out ? "Indisponible" : "Ajouter au panier"}
            </Button>
            <button
              className={`mf-fav ${isFav ? "on" : ""}`}
              style={{ position: "static", width: 50, height: 50 }}
              onClick={() => toggleFavorite(product.id)}
              aria-label="Favori"
            >
              <Heart size={20} fill={isFav ? "currentColor" : "none"} />
            </button>
          </div>

          {product.tags?.length > 0 && (
            <div className="mf-tags">
              {product.tags.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div id="avis">
        <ProductReviews
          productId={product.id}
          onStats={({ average, count }) =>
            setProduct((p) => (p && (p.rating !== average || p.reviews !== count) ? { ...p, rating: average, reviews: count } : p))
          }
        />
      </div>

      {related.length > 0 && (
        <section className="mf-section">
          <div className="mf-sec-head">
            <h2>Produits similaires</h2>
          </div>
          <div className="mf-grid-products">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

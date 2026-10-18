import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, Search, X } from "lucide-react";
import { productService } from "../services/productService";
import { useCatalogStore } from "../store/catalogStore";
import { useDebounce } from "../hooks/useDebounce";
import { ProductGrid } from "../components/shared";
import {
  Select,
  EmptyState,
  Pagination,
  Button,
} from "../components/ui/primitives";
import { formatPrice } from "../utils/format";

const SORTS = [
  { value: "popular", label: "Plus populaires" },
  { value: "price-asc", label: "Prix croissant" },
  { value: "price-desc", label: "Prix décroissant" },
  { value: "rating", label: "Mieux notés" },
  { value: "newest", label: "Nouveautés" },
  { value: "name-asc", label: "Nom (A-Z)" },
];

const PER_PAGE = 12;

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const { categories, load } = useCatalogStore();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState(params.get("q") || "");

  const search = params.get("q") || "";
  // ?category= accepte un id ("1") ou un slug ("fruits", "cat-fruits").
  // null = slug pas encore résolu (catégories en cours de chargement).
  const rawCategory = params.get("category") || "";
  const categoryId = useMemo(() => {
    if (!rawCategory || /^\d+$/.test(rawCategory)) return rawCategory;
    const slug = rawCategory.replace(/^cat-/, "");
    const match = categories.find((c) => c.slug === slug);
    if (match) return match.id;
    return categories.length ? "" : null;
  }, [rawCategory, categories]);
  const sort = params.get("sort") || "popular";
  const promoOnly = params.get("promo") === "1";
  const featuredOnly = params.get("featured") === "1";
  const maxPrice = Number(params.get("max") || 0);
  const page = Number(params.get("page") || 1);

  useEffect(() => {
    load();
  }, [load]);

  const update = useCallback(
    (patch) => {
      const next = new URLSearchParams(params);
      Object.entries(patch).forEach(([k, v]) => {
        if (v === "" || v == null || v === false || v === 0) next.delete(k);
        else next.set(k, String(v));
      });
      if (!("page" in patch)) next.delete("page");
      setParams(next, { replace: true });
    },
    [params, setParams],
  );

  /* Recherche : la saisie reste instantanée dans le champ, mais l'URL (et donc
     la requête catalogue) n'est mise à jour qu'une fois la frappe stabilisée. */
  const debouncedSearch = useDebounce(searchInput, 300);
  const pushedSearch = useRef(search);

  useEffect(() => {
    if (debouncedSearch === pushedSearch.current) return;
    pushedSearch.current = debouncedSearch;
    update({ q: debouncedSearch });
  }, [debouncedSearch, update]);

  // Si l'URL change ailleurs (recherche navbar, retour navigateur, reset),
  // on réaligne le champ de saisie.
  useEffect(() => {
    if (search === pushedSearch.current) return;
    pushedSearch.current = search;
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    if (categoryId === null) return;
    (async () => {
      // Tri + filtres gérés côté serveur (PostgreSQL).
      const res = await productService.list({
        search, categoryId, sort, onSale: promoOnly, featured: featuredOnly, maxPrice,
      });
      if (!active) return;
      setItems(res);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [search, categoryId, sort, promoOnly, featuredOnly, maxPrice]);

  const bounds = useMemo(() => {
    if (!items.length) return { max: 5000 };
    return {
      max: Math.ceil(Math.max(...items.map((p) => p.price)) / 500) * 500,
    };
  }, [items]);

  const totalPages = Math.max(1, Math.ceil(items.length / PER_PAGE));
  const current = Math.min(page, totalPages);
  const paginated = items.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  const activeFilters =
    (search ? 1 : 0) +
    (categoryId ? 1 : 0) +
    (promoOnly ? 1 : 0) +
    (featuredOnly ? 1 : 0) +
    (maxPrice ? 1 : 0);

  const resetAll = () => setParams(new URLSearchParams(), { replace: true });

  return (
    <>
      <div className="mf-page-head">
        <div
          className="container"
          style={{ paddingTop: 30, paddingBottom: 30 }}
        >
          <span className="mf-eyebrow">Boutique</span>
          <h1>Tous nos produits frais</h1>
          <p>
            {items.length} produits disponibles — filtrez par catégorie, prix et
            popularité.
          </p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 26, paddingBottom: 40 }}>
        <div className="mf-shop-layout">
          <aside className={`mf-filters ${showFilters ? "" : "collapsed"}`}>
            <div className="mf-filter-block">
              <h4>Recherche</h4>
              <div className="mf-search-inline">
                <Search size={16} />
                <input
                  className="input"
                  placeholder="Nom du produit…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
            </div>

            <div className="mf-filter-block">
              <h4>Catégories</h4>
              <div className="mf-filter-list">
                <button
                  className={!categoryId ? "active" : ""}
                  onClick={() => update({ category: "" })}
                >
                  Toutes les catégories
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    className={categoryId === c.id ? "active" : ""}
                    onClick={() => update({ category: c.id })}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="mf-filter-block">
              <h4>Prix maximum</h4>
              <div className="mf-price-range">
                <input
                  type="range"
                  min={500}
                  max={bounds.max}
                  step={500}
                  value={maxPrice || bounds.max}
                  onChange={(e) =>
                    update({
                      max:
                        Number(e.target.value) === bounds.max
                          ? ""
                          : e.target.value,
                    })
                  }
                />
              </div>
              <div
                style={{ fontSize: 13, color: "var(--ink-500)", marginTop: 6 }}
              >
                Jusqu’à {formatPrice(maxPrice || bounds.max)}
              </div>
            </div>

            <div className="mf-filter-block">
              <h4>Filtres</h4>
              <div className="mf-filter-list">
                <button
                  className={promoOnly ? "active" : ""}
                  onClick={() => update({ promo: promoOnly ? "" : "1" })}
                >
                  En promotion
                </button>
                <button
                  className={featuredOnly ? "active" : ""}
                  onClick={() => update({ featured: featuredOnly ? "" : "1" })}
                >
                  Produits vedettes
                </button>
              </div>
            </div>

            {activeFilters > 0 && (
              <Button
                variant="ghost"
                icon={X}
                onClick={resetAll}
                className="btn-block"
              >
                Réinitialiser ({activeFilters})
              </Button>
            )}
          </aside>

          <div>
            <div className="mf-toolbar">
              <Button
                variant="outline"
                icon={SlidersHorizontal}
                className="mf-mobile-filter-btn"
                onClick={() => setShowFilters((v) => !v)}
              >
                Filtres {activeFilters ? `(${activeFilters})` : ""}
              </Button>
              <span className="mf-results-count">{items.length} résultats</span>
              <span className="spacer" />
              <Select
                value={sort}
                onChange={(e) => update({ sort: e.target.value })}
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </div>

            <ProductGrid
              products={paginated}
              loading={loading}
              skeletonCount={9}
              empty={
                <EmptyState
                  icon={Search}
                  title="Aucun produit trouvé"
                  text="Essayez de modifier votre recherche ou vos filtres pour découvrir d’autres produits."
                  action={
                    <Button variant="primary" onClick={resetAll}>
                      Réinitialiser les filtres
                    </Button>
                  }
                />
              }
            />

            <Pagination
              page={current}
              totalPages={totalPages}
              onChange={(p) => {
                update({ page: p });
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}

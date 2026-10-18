import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as Icons from "lucide-react";
import { ArrowRight, Truck, Leaf, Sparkles } from "lucide-react";
import { productService } from "../services/productService";
import { useCatalogStore } from "../store/catalogStore";
import { siteContent } from "../data/content";
import { reviewService } from "../services/reviewService";
import {
  SectionHeading,
  CategoryGrid,
  ProductGrid,
} from "../components/shared";
import { Button } from "../components/ui/primitives";
import { StarRating } from "../components/ui/primitives";

function Icon({ name, ...rest }) {
  const Cmp = Icons[name] || Leaf;
  return <Cmp {...rest} />;
}

export default function Home() {
  const { products, categories, load, loaded } = useCatalogStore();
  const [featured, setFeatured] = useState([]);
  const [promos, setPromos] = useState([]);
  const [popular, setPopular] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    load();
  }, [load]);

  // Vrais avis clients (aucun avis inventé) ; la section est masquée s'il n'y en a pas.
  useEffect(() => {
    reviewService.recent(6).then(setReviews).catch(() => setReviews([]));
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const [f, p, pop] = await Promise.all([
        productService.featured(8),
        productService.onSale(8),
        productService.popular(4),
      ]);
      if (!active) return;
      setFeatured(f);
      setPromos(p);
      setPopular(pop);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      {/* HERO */}
      <section className="mf-hero">
        <div className="container">
          <div className="mf-hero-grid">
            <div>
              <span className="mf-eyebrow">{siteContent.hero.eyebrow}</span>
              <h1>
                Les produits frais du Cameroun, <em>livrés chez vous.</em>
              </h1>
              <p className="lead">{siteContent.hero.subtitle}</p>
              <div className="mf-hero-cta">
                <Link to="/shop" className="btn btn-primary btn-lg">
                  {siteContent.hero.primaryCta} <ArrowRight size={18} />
                </Link>
                <a href="#comment" className="btn btn-outline btn-lg">
                  {siteContent.hero.secondaryCta}
                </a>
              </div>
              <div className="mf-hero-stats">
                {siteContent.hero.stats.map((s) => (
                  <div key={s.label}>
                    <div className="v">{s.value}</div>
                    <div className="l">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mf-hero-media">
              <img
                src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1000&q=80"
                alt="Étal de produits frais camerounais"
              />
              <div className="mf-hero-float a">
                <span className="ic">
                  <Truck size={20} />
                </span>
                <div>
                  <div className="tt">Livraison du jour</div>
                  <div className="st">Douala · Yaoundé</div>
                </div>
              </div>
              <div className="mf-hero-float b">
                <span className="ic">
                  <Sparkles size={20} />
                </span>
                <div>
                  <div className="tt">Récolté ce matin</div>
                  <div className="st">Fraîcheur garantie</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROMO STRIP */}
      <section className="mf-section tight">
        <div className="container">
          <div className="mf-promo-strip">
            {siteContent.banners
              .filter((b) => b.enabled)
              .map((b) => (
                <div key={b.id} className={`mf-promo ${b.tone}`}>
                  <span className="ic">
                    <Icon
                      name={
                        b.tone === "green"
                          ? "Leaf"
                          : b.tone === "orange"
                            ? "Wallet"
                            : "MapPin"
                      }
                      size={20}
                    />
                  </span>
                  <div>
                    <div className="tt">{b.title}</div>
                    <div className="ds">{b.text}</div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="mf-section">
        <div className="container">
          <SectionHeading
            eyebrow="Nos rayons"
            title="Explorez nos catégories"
            text="Des produits du terroir camerounais triés et classés pour vous faciliter le quotidien."
            to="/shop"
          />
          {loaded ? (
            <CategoryGrid categories={categories} products={products} />
          ) : (
            <div className="mf-cat-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="mf-skeleton"
                  style={{ aspectRatio: "1/0.82", borderRadius: "var(--r-lg)" }}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* POPULAR */}
      <section className="mf-section alt">
        <div className="container">
          <SectionHeading
            eyebrow="Les plus demandés"
            title="Produits populaires"
            text="Ce que nos clients commandent le plus, semaine après semaine."
            to="/shop?sort=popular"
          />
          <ProductGrid products={popular} loading={loading} skeletonCount={4} />
        </div>
      </section>

      {/* WHY US */}
      <section className="mf-section">
        <div className="container">
          <SectionHeading
            eyebrow="Pourquoi KmerMarket"
            title="Le marché, sans les contraintes"
            text="Nous simplifions l’accès aux produits frais pour les familles et les restaurateurs."
          />
          <div className="mf-values">
            {siteContent.valueProps.map((v) => (
              <div key={v.title} className="mf-value">
                <span className="ic">
                  <Icon name={v.icon} size={22} />
                </span>
                <h3>{v.title}</h3>
                <p>{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section className="mf-section alt">
        <div className="container">
          <SectionHeading
            eyebrow="Sélection du jour"
            title="Nos produits vedettes"
            text="Sélectionnés avec soin par notre équipe de douala et yaoundé."
            to="/shop?featured=1"
          />
          <ProductGrid products={featured} loading={loading} />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mf-section" id="comment">
        <div className="container">
          <SectionHeading
            eyebrow="Simple et rapide"
            title="Comment ça marche ?"
            text="Quatre étapes pour recevoir vos produits frais à la maison."
          />
          <div className="mf-steps">
            {siteContent.howItWorks.map((s) => (
              <div key={s.step} className="mf-step">
                <div className="num">{s.step}</div>
                <span className="ic">
                  <Icon name={s.icon} size={20} />
                </span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROMOS */}
      <section className="mf-section alt">
        <div className="container">
          <SectionHeading
            eyebrow="Bons plans"
            title="Promotions en cours"
            text="Profitez de prix réduits sur une sélection de produits frais."
            to="/shop?promo=1"
          />
          <ProductGrid products={promos} loading={loading} />
        </div>
      </section>

      {/* DELIVERY BAND */}
      <section className="mf-section">
        <div className="container">
          <div className="mf-band">
            <div>
              <h2>Livraison rapide dans tout le Cameroun</h2>
              <p>
                Nous livrons en quelques heures dans les grandes villes et sous
                48h à l’intérieur du pays. Payez à la livraison ou par Mobile
                Money.
              </p>
              <Link
                to="/shop"
                className="btn btn-light btn-lg"
                style={{ marginTop: 22 }}
              >
                Commander maintenant <ArrowRight size={18} />
              </Link>
            </div>
            <div className="mf-band-list">
              <div className="mf-band-item">
                <Truck size={20} /> Douala & Yaoundé — livraison le jour même
              </div>
              <div className="mf-band-item">
                <Icons.MapPin size={20} /> 14 villes desservies à travers le
                pays
              </div>
              <div className="mf-band-item">
                <Icons.Wallet size={20} /> Paiement à la livraison ou Mobile
                Money
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AVIS CLIENTS (réels) */}
      {reviews.length > 0 && (
        <section className="mf-section alt">
          <div className="container">
            <SectionHeading
              eyebrow="Avis vérifiés"
              title="La parole à nos clients"
              text="Les derniers avis laissés par nos clients sur les produits."
            />
            <div className="mf-testi-grid">
              {reviews.map((r) => (
                <figure key={r.id} className="mf-testi">
                  <StarRating value={r.rating} />
                  <blockquote className="quote">“{r.comment}”</blockquote>
                  <figcaption className="mf-testi-author">
                    <span className="mf-testi-initial">{r.author.charAt(0)}</span>
                    <div>
                      <div className="nm">{r.author}</div>
                      <Link to={`/product/${r.productId}`} className="ro">
                        Avis sur : {r.productName}
                      </Link>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="mf-section">
        <div className="container">
          <div className="mf-cta">
            <h2>Recevez vos produits frais dès aujourd’hui</h2>
            <p>
              Créez votre compte, remplissez votre panier et choisissez votre
              mode de paiement. C’est tout.
            </p>
            <Link to="/shop" className="btn btn-light btn-lg">
              Découvrir la boutique <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

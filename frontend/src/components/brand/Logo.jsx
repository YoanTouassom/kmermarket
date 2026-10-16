import { Link } from "react-router-dom";

/**
 * Logo KmerMarket
 * Marque : pin de livraison + feuille, dégradé vert → orange.
 * Décliné en : marque seule (mark), lockup complet (avec texte), et variante claire.
 */
export function LogoMark({ size = 40 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-label="KmerMarket"
    >
      <defs>
        <linearGradient id="mfPin" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2E9E6B" />
          <stop offset="1" stopColor="#0F4D33" />
        </linearGradient>
      </defs>
      <path
        d="M24 3.5c-7.9 0-14.3 6.2-14.3 13.8 0 10 14.3 27.2 14.3 27.2s14.3-17.2 14.3-27.2C38.3 9.7 31.9 3.5 24 3.5z"
        fill="url(#mfPin)"
      />
      <circle cx="24" cy="17.4" r="8.4" fill="#ffffff" />
      <path
        d="M24 12.4c3.2 0 5.7 2.3 5.7 5.4-3.2 0-5.7-2.3-5.7-5.4z"
        fill="#2E9E6B"
      />
      <path
        d="M24 12.4c-3.2 0-5.7 2.3-5.7 5.4 3.2 0 5.7-2.3 5.7-5.4z"
        fill="#E8892F"
      />
      <rect x="23.2" y="17" width="1.6" height="5" rx="0.8" fill="#0F4D33" />
    </svg>
  );
}

/**
 * Lockup complet : marque + nom + baseline.
 * `variant="light"` pour les fonds sombres.
 */
export default function Logo({
  variant = "dark",
  showTagline = false,
  to = "/",
  size = 40,
}) {
  const isLight = variant === "light";
  return (
    <Link to={to} className="mf-logo" aria-label="KmerMarket — accueil">
      <LogoMark size={size} />
      <span className="mf-logo-text">
        <span
          className="mf-logo-name"
          style={{ color: isLight ? "#fff" : "var(--ink-900)" }}
        >
          Kmer
          <span
            style={{
              color: isLight ? "var(--orange-200)" : "var(--orange-500)",
            }}
          >
            Market
          </span>
        </span>
        {showTagline && (
          <span
            className="mf-logo-tag"
            style={{
              color: isLight ? "rgba(255,255,255,.7)" : "var(--ink-500)",
            }}
          >
            Produits frais du Cameroun
          </span>
        )}
      </span>
    </Link>
  );
}

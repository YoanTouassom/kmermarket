import { Link } from "react-router-dom";
import { Sprout, Home as HomeIcon, ShoppingBasket } from "lucide-react";

export default function NotFound() {
  return (
    <div
      className="container"
      style={{ paddingTop: 90, paddingBottom: 90, textAlign: "center" }}
    >
      <span
        style={{
          display: "inline-grid",
          placeItems: "center",
          width: 84,
          height: 84,
          borderRadius: 24,
          background: "var(--green-50)",
          color: "var(--green-600)",
          marginBottom: 20,
        }}
      >
        <Sprout size={40} />
      </span>
      <h1 style={{ fontSize: 40, fontFamily: "var(--font-display)" }}>
        Page introuvable
      </h1>
      <p
        style={{
          color: "var(--ink-500)",
          maxWidth: 460,
          margin: "12px auto 0",
        }}
      >
        Cette page n’existe pas ou a été déplacée. Retournez à l’accueil ou
        poursuivez vos achats de produits frais.
      </p>
      <div
        style={{
          display: "flex",
          gap: 12,
          justifyContent: "center",
          marginTop: 28,
          flexWrap: "wrap",
        }}
      >
        <Link to="/" className="btn btn-primary">
          <HomeIcon size={17} /> Retour à l’accueil
        </Link>
        <Link to="/shop" className="btn btn-outline">
          <ShoppingBasket size={17} /> Voir la boutique
        </Link>
      </div>
    </div>
  );
}

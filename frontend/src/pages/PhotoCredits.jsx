import { photoCredits } from "../data/photoCredits";

export default function PhotoCredits() {
  return (
    <div className="container" style={{ padding: "40px 0 60px", maxWidth: 820 }}>
      <h1 style={{ fontSize: 30, fontFamily: "var(--font-display)" }}>
        Crédits photos
      </h1>
      <p style={{ color: "var(--ink-500)", margin: "10px 0 24px" }}>
        Les photos des produits proviennent de Wikimedia Commons. Merci à leurs
        auteurs. Chaque photo est utilisée selon sa licence (cliquez pour voir
        la source).
      </p>
      <div style={{ display: "grid", gap: 10 }}>
        {photoCredits.map((c) => (
          <a
            key={c.image}
            href={c.source}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: 10,
              border: "1px solid var(--ink-200)",
              borderRadius: 12,
              background: "#fff",
              minWidth: 0,
            }}
          >
            <img
              src={c.image}
              alt=""
              loading="lazy"
              style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 8, flexShrink: 0 }}
            />
            <span style={{ minWidth: 0 }}>
              <strong style={{ display: "block" }}>{c.product}</strong>
              <span style={{ fontSize: 13, color: "var(--ink-500)", overflowWrap: "anywhere" }}>
                {c.author} · {c.license}
              </span>
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

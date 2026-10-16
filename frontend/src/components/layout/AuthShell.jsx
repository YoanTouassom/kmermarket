import { ShieldCheck } from 'lucide-react'
import Logo from '../brand/Logo'
import { Link } from 'react-router-dom'

/** Mise en page commune aux écrans d'authentification. */
export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="mf-auth-wrap">
      <aside className="mf-auth-aside">
        <Logo variant="light" size={42} />
        <div>
          <h2>Les produits frais du Cameroun, livrés chez vous.</h2>
          <p>
            Rejoignez des milliers de familles qui se réapprovisionnent chaque
            semaine auprès des producteurs de nos régions.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: 0.9 }}>
          <ShieldCheck size={18} /> Paiement à la livraison ou Mobile Money
        </div>
        <img
          className="mf-auth-img"
          src="https://images.unsplash.com/photo-1518843875459-f738682238a6?auto=format&fit=crop&w=600&q=80"
          alt=""
        />
      </aside>
      <main className="mf-auth-main">
        <div className="mf-auth-card">
          <Link to="/" style={{ display: 'inline-block', marginBottom: 24 }}>
            <Logo size={38} />
          </Link>
          <h1>{title}</h1>
          <p className="sub">{subtitle}</p>
          {children}
          {footer}
        </div>
      </main>
    </div>
  )
}
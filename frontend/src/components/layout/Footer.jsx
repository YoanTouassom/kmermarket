import { Link } from 'react-router-dom'
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Facebook,
  Instagram,
  Send,
  Youtube,
} from 'lucide-react'
import Logo from '../brand/Logo'
import { settings } from '../../data/content'

const CATEGORIES = [
  { to: '/shop?category=fruits', label: 'Fruits' },
  { to: '/shop?category=legumes', label: 'Légumes' },
  { to: '/shop?category=tubercules', label: 'Tubercules' },
  { to: '/shop?category=cereales', label: 'Céréales' },
  { to: '/shop?category=epices', label: 'Épices' },
  { to: '/shop?category=produits-vivriers', label: 'Produits vivriers' },
]

const HELP = [
  { to: '/shop', label: 'Tous les produits' },
  { to: '/orders', label: 'Suivre ma commande' },
  { to: '/account', label: 'Mon compte' },
  { to: '/login', label: 'Connexion' },
  { to: '/register', label: 'Créer un compte' },
]

export default function Footer() {
  return (
    <footer className="mf-footer">
      <div className="container">
        <div className="mf-footer-top">
          <div>
            <Logo variant="light" showTagline />
            <p style={{ marginTop: 16 }}>
              KmerMarket met en relation les producteurs camerounais et les
              familles urbaines : des denrées fraîches, tracées et livrées
              rapidement, à un prix juste.
            </p>
            <div className="mf-social">
              <a href={settings.social.facebook} aria-label="Facebook" target="_blank" rel="noreferrer">
                <Facebook size={17} />
              </a>
              <a href={settings.social.instagram} aria-label="Instagram" target="_blank" rel="noreferrer">
                <Instagram size={17} />
              </a>
              <a href={settings.social.x} aria-label="X" target="_blank" rel="noreferrer">
                <Send size={17} />
              </a>
              <a href={settings.social.tiktok} aria-label="TikTok" target="_blank" rel="noreferrer">
                <Youtube size={17} />
              </a>
            </div>
          </div>

          <div>
            <h4>Catégories</h4>
            <div className="mf-footer-links">
              {CATEGORIES.map((c) => (
                <Link key={c.to} to={c.to}>
                  {c.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4>Navigation</h4>
            <div className="mf-footer-links">
              {HELP.map((c) => (
                <Link key={c.to} to={c.to}>
                  {c.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4>Contact</h4>
            <div className="mf-footer-contact">
              <span className="row">
                <Phone size={17} /> {settings.phone}
              </span>
              <span className="row">
                <Mail size={17} /> {settings.email}
              </span>
              <span className="row">
                <MapPin size={17} /> {settings.address}
              </span>
              <span className="row">
                <Clock size={17} /> {settings.hours}
              </span>
            </div>
            <div className="mf-pay">
              <span>Espèces</span>
              <span>MTN MoMo</span>
              <span>Orange Money</span>
            </div>
          </div>
        </div>

        <div className="mf-footer-bottom">
          <span>
            © {new Date().getFullYear()} {settings.storeName}. Tous droits réservés.
          </span>
          <span>
            Produits frais du terroir camerounais · Douala · Yaoundé
          </span>
        </div>
      </div>
    </footer>
  )
}
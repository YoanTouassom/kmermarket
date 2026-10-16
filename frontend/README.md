# 🌿 KmerMarket

**KmerMarket** est une plateforme e-commerce de vente de denrées alimentaires fraîches au Cameroun.
Fruits, légumes, tubercules, féculents, céréales, épices et produits vivriers — livrés directement chez vous.

> « Les produits frais du Cameroun, directement chez vous. »

---

## 🏷️ Nom de marque

**KmerMarket** — « Kmer » (le Cameroun, comme on l'appelle affectueusement) + « Market ».
Court, bilingue FR/EN, immédiatement compréhensible de Douala à Yaoundé,
moderne et extensible vers une vraie entreprise (domaine, réseaux sociaux, mobile).

### Logo

Un logo vectoriel **fait main** (aucun générateur automatique) : un **pin de livraison**
dont le cœur contient une **feuille bicolore** (vert = agriculture, orange = chaleur du terroir).
Il existe en trois déclinaisons : marque seule, lockup complet (nom + baseline) et variante claire
pour fonds sombres. Il est présent dans la **navbar**, le **footer**, la **page de connexion**,
le **dashboard admin** et le **favicon** (`public/favicon.svg`).

---

## ✨ Fonctionnalités

### Côté client
- Page d'accueil premium (hero, catégories, produits populaires, promotions, témoignages…)
- Boutique complète : recherche, filtres (catégorie, prix), tri, pagination
- Fiche produit détaillée (unité de vente, disponibilité, produits similaires)
- Panier persistant (localStorage) : quantités, sous-total, frais de livraison, total
- Checkout multi-étapes : informations, livraison, paiement, confirmation
- Authentification simulée : connexion, inscription, mot de passe oublié
- Espace client : profil, commandes, suivi de statut, adresses, préférences
- Modes de paiement : paiement à la livraison, Mobile Money (architecture extensible MTN / Orange)

### Côté administrateur (`/admin`)
- Dashboard : CA, commandes, clients, produits, ruptures, commandes récentes
- Gestion des produits (CRUD complet, promotions, stock, activation/désactivation)
- Gestion des catégories (CRUD + comptage produits)
- Gestion des commandes (recherche, filtres par statut, détail, changement de statut, annulation)
- Gestion des utilisateurs (recherche, historique, activation/désactivation)
- Gestion du contenu (bannières, mise en avant, témoignages)
- Paramètres de la boutique

### Accès administrateur

Le compte administrateur donne accès au dashboard `/admin`. Les données clients
(comptes, commandes) se construisent au fil de l'utilisation : les visiteurs
créent leur compte via `/register`, puis leurs commandes depuis `/checkout`.

| Champ        | Valeur                |
|--------------|-----------------------|
| Email        | `admin@kmermarket.cm` |
| Mot de passe | voir `backend/.env` (`ADMIN_PASSWORD`) |

---

## 🚀 Démarrage (full-stack)

Terminal 1 — backend (API + PostgreSQL) :

```bash
cd backend
npm install
npm run db:setup   # crée la base, applique le schéma, charge le seed (1ère fois uniquement)
npm run dev        # → http://localhost:5000/api/health
```

Terminal 2 — frontend :

```bash
cd frontend
npm install
npm run dev        # → http://localhost:5173
```

> Le frontend communique avec l'API via `VITE_API_URL`
> (défaut : `http://localhost:5000/api`).

### Build de production

```bash
npm run build
npm run preview
```

---

## 🧱 Stack technique

- **React 18** + **Vite**
- **React Router** (navigation)
- **Zustand** (gestion d'état + persistance localStorage)
- **Lucide React** (icônes)
- **CSS moderne** (design system maison, variables CSS, mobile-first)

---

## 🏗️ Architecture

```
src/
├── assets/          # Images & ressources locales
├── components/
│   ├── ui/          # Primitives réutilisables (Button, Input, Modal…)
│   ├── layout/      # Navbar, Footer, Sidebar
│   └── ...          # ProductCard, CategoryCard, etc.
├── pages/           # Pages publiques / client
├── admin/
│   ├── pages/       # Pages du dashboard admin
│   └── components/  # Composants propres à l'admin
├── store/           # Stores Zustand (cart, auth, catalog, orders…)
├── services/        # Couche d'accès aux données (API-ready)
├── data/            # Jeu de données initial (catalogue, contenu)
├── utils/           # Helpers (format prix, dates, constantes)
└── hooks/           # Hooks personnalisés
```

### 🔌 Backend connecté

Toute la logique de données passe par la couche `src/services/` (`productService`,
`orderService`, `userService`, `authService`, `categoryService`, `cartService`,
`contentService`), branchée sur l'API REST du dossier `backend/`
(Express + PostgreSQL + JWT). Le panier est hybride : localStorage pour les
invités, PostgreSQL pour les connectés (fusion automatique à la connexion).

---

## 🎨 Identité visuelle

- **Logo** : pin de livraison + feuille (frais & local), dégradé vert → orange.
- **Couleurs** : vert agriculture, orange chaleureux, fond crème.
- **Typographie** : Plus Jakarta Sans (titres) + Inter (texte).

---

© KmerMarket — Plateforme e-commerce full-stack (React + Express + PostgreSQL).
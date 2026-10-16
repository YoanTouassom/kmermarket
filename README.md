# 🌿 KmerMarket — Plateforme e-commerce full-stack (Cameroun)

Fruits, légumes, tubercules, féculents, céréales, épices et produits vivriers —
livrés directement chez vous.

> « Les produits frais du Cameroun, directement chez vous. »

## 🧱 Stack

| Couche   | Techno                                          |
|----------|-------------------------------------------------|
| Frontend | React 18 + Vite 5, React Router 6, Zustand, Lucide |
| Backend  | Node.js + Express 4, JWT, bcryptjs, Zod, pg     |
| Base     | PostgreSQL 18 (locale)                          |

## 📁 Structure

```
.
├── backend/    # API REST (voir backend/README ou .env.example)
├── frontend/   # Application React (voir frontend/README.md)
└── tools/      # Scripts ponctuels (renommage, extraction seed)
```

## 🚀 Démarrage

**PostgreSQL** doit être lancé (service `postgresql-x64-18`, port 5432).

Terminal 1 — backend :

```bash
cd backend
npm install
npm run db:setup   # 1ère fois : crée la base + schéma + seed
npm run dev        # → http://localhost:5000/api/health
```

Terminal 2 — frontend :

```bash
cd frontend
npm install
npm run dev        # → http://localhost:5173
```

Configuration backend : copier `backend/.env.example` vers `backend/.env`
et renseigner `DB_PASSWORD`, `JWT_SECRET` et `ADMIN_PASSWORD`.

## 🔑 Compte admin de développement

Créé par `npm run db:seed` (mot de passe hashé bcrypt) :

| Champ        | Valeur                |
|--------------|-----------------------|
| Email        | `admin@kmermarket.cm` |
| Mot de passe | `ADMIN_PASSWORD` du `backend/.env` |

## 🧪 Scripts backend utiles

| Commande            | Effet                                              |
|---------------------|----------------------------------------------------|
| `npm run db:create` | Crée la base si absente                            |
| `npm run db:migrate` | Applique `schema.sql` (idempotent)                |
| `npm run db:seed`   | Charge catégories, produits, contenu, admin, démo  |
| `npm run db:setup`  | create + migrate + seed                            |
| `npm run db:reset`  | Vide le schéma public puis réapplique              |

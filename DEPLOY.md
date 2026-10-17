# 🚀 Mise en ligne de KmerMarket — Vercel + Render + Neon (100 % gratuit)

> **Architecture :** Frontend → **Vercel** · API → **Render** (Web Service Free) · PostgreSQL → **Neon**
> Coût : **0 FCFA**. Durée estimée : **30–45 minutes**.
>
> Pourquoi Neon et pas la base Render ? La base gratuite de Render **expire après 30 jours** ;
> celle de Neon n'expire pas.

## 0. Prérequis

- [ ] Code poussé sur **GitHub** : https://github.com/YoanTouassom/kmermarket
- [ ] Compte **Neon** : https://neon.tech — connexion via GitHub
- [ ] Compte **Render** : https://render.com — connexion via GitHub
- [ ] Compte **Vercel** : https://vercel.com — connexion via GitHub

## 1. Base de données Neon (5 min)

1. Sur https://neon.tech → **New Project** : nom `kmermarket`, Postgres 16, région **Frankfurt** (AWS eu-central-1).
2. Dashboard → **Connect** → copiez la **Connection String** (cochez *Pooled connection*) :
   `postgresql://user:pass@ep-xxx-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require`
3. Remplissez la base **une seule fois** depuis votre PC (schéma + catalogue + compte admin) :

```powershell
cd c:/Users/YOAN/Desktop/sophia/backend
$env:DATABASE_URL="postgresql://...copiee_depuis_neon..."
$env:ADMIN_EMAIL="admin@kmermarket.cm"
$env:ADMIN_PASSWORD="mot_de_passe_admin_solide"
npm run db:migrate
npm run db:seed
```

> Les variables `$env:` priment sur `backend/.env` : votre base locale n'est pas touchée.
> Fermez ensuite ce terminal pour ne pas viser Neon par erreur.

## 2. API sur Render (10 min)

1. Sur https://dashboard.render.com → **New → Blueprint** → connectez le dépôt `kmermarket`.
2. Render lit **`render.yaml`** (à la racine) et prépare le service `kmermarket-api` (plan Free, Frankfurt).
3. Il vous demande deux valeurs :
   - `DATABASE_URL` : la Connection String Neon de l'étape 1
   - `CORS_ORIGIN` : mettez provisoirement `https://kmer-market.vercel.app` (corrigé à l'étape 4)
4. **Apply** → build ~3 min. `JWT_SECRET` est généré automatiquement.
5. Ouvrez `https://kmermarket-api.onrender.com/api/health` → doit afficher `{"ok":true,...}` ✅
   (l'URL exacte est affichée en haut de la page du service).

> Instance gratuite : elle s'endort après **15 min** sans trafic ; la 1ʳᵉ requête suivante prend
> **~1 min**. 750 h/mois incluses, suffisant pour un service allumé en permanence.

## 3. Frontend sur Vercel (10 min)

1. Sur https://vercel.com → **Add New → Project** → importez `kmermarket`.
2. **Root Directory** : `frontend` (Vite détecté ; install, build et fallback SPA sont dans `frontend/vercel.json`).
3. **Environment Variables** :
   `VITE_API_URL=https://kmermarket-api.onrender.com/api` (votre URL Render + `/api`)
   (figée au build : si l'URL change, **Redeploy**).
4. **Deploy** → notez l'URL obtenue, par ex. `https://kmer-market.vercel.app`.

## 4. Relier frontend et backend (2 min)

Render → `kmermarket-api` → **Environment** →
`CORS_ORIGIN=https://<votre-projet>.vercel.app` (URL Vercel exacte, sans `/` final ;
plusieurs URL séparées par des virgules) → **Save Changes** (redéploiement auto).

## 5. Checklist finale

- [ ] `https://…onrender.com/api/health` répond `{"ok":true}`
- [ ] `https://…vercel.app` affiche la boutique et les produits
- [ ] Inscription + connexion OK (cookie `km_token`)
- [ ] Panier → commande sans erreur
- [ ] Connexion admin (identifiants de l'étape 1) → dashboard OK
- [ ] `CORS_ORIGIN` = URL Vercel exacte

## Dépannage

| Symptôme | Cause probable | Solution |
|---|---|---|
| Logs Render : `impossible de joindre PostgreSQL` | `DATABASE_URL` erronée | Recopiez-la depuis Neon (avec `?sslmode=require`) |
| Frontend : erreurs CORS dans la console | `CORS_ORIGIN` ≠ URL Vercel | Corrigez `CORS_ORIGIN` (sans `/` final) |
| Boutique lente au premier chargement | API endormie (plan Free) | Normal : ~1 min au réveil |
| Connexion OK puis déconnecté au rechargement | Cookie bloqué | Vérifiez `NODE_ENV=production` sur Render |
| Boutique vide | Seed non lancé | Refaites l'étape 1.3 |

## Fichiers liés au déploiement

| Fichier | Rôle |
|---|---|
| `render.yaml` | Blueprint Render de l'API |
| `frontend/vercel.json` | Install + build Vite + fallback SPA pour Vercel |
| `backend/Dockerfile` | Image Docker de l'API (pour un hébergeur Docker, optionnel) |
| `.env.production.example` | Liste des variables de production |
| `npm run verify` | Vérifie la cohérence du projet avant déploiement |

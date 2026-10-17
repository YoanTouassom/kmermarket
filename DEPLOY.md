# 🚀 Mise en ligne de KmerMarket — Vercel + Koyeb + Neon (100 % gratuit)

> **Architecture :** Frontend → **Vercel** · API → **Koyeb** · PostgreSQL → **Neon**
> Coût : **0 FCFA**, aucune carte bancaire exigée. Durée estimée : **30–45 minutes**.

## 0. Prérequis

- [ ] Code poussé sur **GitHub** : https://github.com/YoanTouassom/kmermarket
- [ ] Compte **Neon** (Postgres gratuit) : https://neon.tech — connexion via GitHub
- [ ] Compte **Koyeb** (API Node gratuite) : https://app.koyeb.com — connexion via GitHub
- [ ] Compte **Vercel** (frontend gratuit) : https://vercel.com — connexion via GitHub

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

## 2. API sur Koyeb (10 min)

1. Sur https://app.koyeb.com → **Create Service** → **Web Service** → **GitHub** → dépôt `kmermarket`, branche `main`.
2. **Builder** : choisissez **Dockerfile**, puis :
   - **Dockerfile location** : `Dockerfile`
   - **Work directory** : `backend` ⚠️ (indispensable : le Dockerfile copie `package.json` et `src/` depuis ce dossier)
3. **Instance** : **Free** · **Region** : **Frankfurt**.
4. **Ports** : `8000` → protocole HTTP, chemin `/` (Koyeb injecte `PORT=8000`, le code le lit).
5. **Health checks** : TCP par défaut, ou HTTP sur `/api/health`.
6. **Environment variables** :

```
NODE_ENV=production
DATABASE_URL=postgresql://...neon...?sslmode=require
JWT_SECRET=<64 caracteres aleatoires, voir commande ci-dessous>
JWT_EXPIRES_IN=7d
DB_AUTO_MIGRATE=true
CORS_ORIGIN=https://kmer-market.vercel.app
```

   Générer `JWT_SECRET` :
   `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

7. Nom du service : `kmermarket-api` → **Deploy** (~3 min).
8. Ouvrez `https://kmermarket-api-<vous>.koyeb.app/api/health` → doit afficher `{"ok":true,...}` ✅.

> Instance gratuite : elle se met en veille après ~1 h sans trafic ; la 1ʳᵉ requête suivante prend quelques secondes.

## 3. Frontend sur Vercel (10 min)

1. Sur https://vercel.com → **Add New → Project** → importez `kmermarket`.
2. **Root Directory** : `frontend` (Framework **Vite** détecté ; le fallback SPA est dans `frontend/vercel.json`).
3. **Environment Variables** :
   `VITE_API_URL=https://kmermarket-api-<vous>.koyeb.app/api`
   (figée au build : si l'URL change, **Redeploy**).
4. **Deploy** → notez l'URL obtenue, par ex. `https://kmer-market.vercel.app`.

## 4. Relier frontend et backend (2 min)

Si l'URL Vercel diffère de celle mise à l'étape 2 : Koyeb → `kmermarket-api` → **Settings → Environment variables** →
`CORS_ORIGIN=https://<votre-projet>.vercel.app` (sans `/` final, plusieurs URL séparées par des virgules) → **Save and deploy**.

## 5. Checklist finale

- [ ] `https://…koyeb.app/api/health` répond `{"ok":true}`
- [ ] `https://…vercel.app` affiche la boutique et les produits
- [ ] Inscription + connexion OK (cookie `km_token`)
- [ ] Panier → commande sans erreur
- [ ] Connexion admin (identifiants de l'étape 1) → dashboard OK
- [ ] `CORS_ORIGIN` = URL Vercel exacte
- [ ] `JWT_SECRET` de prod différent de celui du local

## Dépannage

| Symptôme | Cause probable | Solution |
|---|---|---|
| Build Koyeb : `package.json not found` / mauvais fichier | Work directory non défini | Koyeb → Settings → Builder → Work directory `backend` |
| Logs Koyeb : `impossible de joindre PostgreSQL` | `DATABASE_URL` erronée | Recopiez-la depuis Neon (avec `?sslmode=require`) |
| Logs : `Variable d'environnement manquante : JWT_SECRET` | Variable absente | Ajoutez `JWT_SECRET` dans Koyeb |
| Frontend : erreurs CORS dans la console | `CORS_ORIGIN` ≠ URL Vercel | Corrigez `CORS_ORIGIN` (sans `/` final) |
| Connexion OK puis déconnecté au rechargement | Cookie bloqué | Vérifiez `NODE_ENV=production` sur Koyeb |
| Boutique vide | Seed non lancé | Refaites l'étape 1.3 |

## Fichiers liés au déploiement

| Fichier | Rôle |
|---|---|
| `backend/Dockerfile` | Image de l'API pour Koyeb |
| `frontend/vercel.json` | Build Vite + fallback SPA pour Vercel |
| `.env.production.example` | Liste des variables de production |
| `npm run verify` | Vérifie la cohérence du projet avant déploiement |

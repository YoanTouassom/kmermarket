# 🚀 Mise en ligne de KmerMarket — Vercel + Neon (100 % gratuit)

> **Architecture :** un seul projet **Vercel** sert le frontend React **et** l'API Express
> (fonction serverless sous `/api`). La base PostgreSQL est sur **Neon**.
> Coût : **0 FCFA**. Durée estimée : **20–30 minutes**.
>
> Avantages : une seule adresse (pas de CORS, cookie de connexion accepté par tous les
> navigateurs), pas de mise en veille de 15 min comme sur les hébergeurs gratuits classiques.

## 0. Prérequis

- [ ] Code poussé sur **GitHub** : https://github.com/YoanTouassom/kmermarket
- [ ] Compte **Neon** : https://neon.tech — connexion via GitHub
- [ ] Compte **Vercel** : https://vercel.com — connexion via GitHub

## 1. Base de données Neon (5 min)

1. Sur https://neon.tech → **New Project** : nom `kmermarket`, Postgres 16, région **Frankfurt** (AWS eu-central-1).
2. Dashboard → **Connect** → copiez la **Connection String** (cochez *Pooled connection*) :
   `postgresql://user:pass@ep-xxx-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require`
3. Remplissez la base depuis votre PC (schéma + catalogue + compte admin) :

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
> À refaire (`npm run db:migrate` seulement) si `schema.sql` change un jour.

## 2. Projet Vercel (10 min)

1. Sur https://vercel.com → **Add New → Project** → importez `kmermarket`.
2. Vercel affiche « Multiple applications detected » avec `backend` (Express, `/api`) et
   `frontend` (Vite, `/`). **Ne cliquez pas** sur « Import single project » : choisissez de les
   **regrouper en un seul projet (Services)**. La configuration est lue depuis `vercel.json`.
3. **Environment Variables** :

```
NODE_ENV=production
DATABASE_URL=postgresql://...neon...?sslmode=require
JWT_SECRET=<64 caracteres aleatoires>
JWT_EXPIRES_IN=7d
```

   Générer `JWT_SECRET` :
   `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

4. **Deploy** (~2 min) → vous obtenez par ex. `https://kmermarket.vercel.app`.

> Si vous aviez déjà créé un projet Vercel pour `frontend` seul : supprimez-le
> (Settings → General → Delete Project) puis réimportez comme ci-dessus.

## 3. Checklist finale

- [ ] `https://…vercel.app/api/health` répond `{"ok":true}`
- [ ] `https://…vercel.app` affiche la boutique et les produits
- [ ] Inscription + connexion OK (cookie `km_token`)
- [ ] Panier → commande sans erreur
- [ ] Connexion admin (identifiants de l'étape 1) → dashboard OK

## Dépannage

| Symptôme | Cause probable | Solution |
|---|---|---|
| `/api/health` → 404 Vercel | Projet importé avec un seul dossier | Réimportez en regroupant les services |
| `/api/...` → 500 | Variable manquante ou `DATABASE_URL` erronée | Vercel → Deployments → (dernier) → **Logs** |
| Logs : `Variable d'environnement manquante : JWT_SECRET` | Variable absente | Ajoutez-la puis Redeploy |
| Boutique vide / erreur `relation ... does not exist` | Base non initialisée | Refaites l'étape 1.3 |
| Variable modifiée sans effet | Pas de redéploiement | Deployments → Redeploy |

## Fichiers liés au déploiement

| Fichier | Rôle |
|---|---|
| `vercel.json` | Services `backend` + `frontend`, région `fra1`, routes `/api` → API et reste → SPA |
| `backend/index.js` | Point d'entrée Express détecté par Vercel |
| `backend/Dockerfile` | Image Docker de l'API (hébergeur Docker, optionnel) |
| `.env.production.example` | Variables de production |
| `npm run verify` | Vérifie la cohérence du projet avant déploiement |

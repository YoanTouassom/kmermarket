# 🚀 Mise en ligne de KmerMarket (option 100 % gratuite)

> **Architecture cible :** Frontend → **Vercel** · API → **Render** · PostgreSQL → **Render**
> Coût : **0 FCFA**. Durée estimée : **45–60 minutes**.

---

## 0. Prérequis

- [ ] Un compte **GitHub** (gratuit) : https://github.com/signup
- [ ] Un compte **Render** (gratuit, connexion via GitHub) : https://render.com
- [ ] Un compte **Vercel** (gratuit, connexion via GitHub) : https://vercel.com
- [ ] Le projet qui fonctionne **en local** (`npm run dev` + `npm run dev`)

---

## 1. Pousser le code sur GitHub (10 min)

Le dossier racine `sophia/` contient déjà un `.gitignore` qui protège
`node_modules/`, `dist/` et **`.env`** (votre mot de passe Postgres ne partira
jamais sur GitHub ✅ — vérifié).

```powershell
cd c:/Users/YOAN/Desktop/sophia
git init
git add .
git status          # vérifiez qu'aucun .env n'apparaît !
git commit -m "KmerMarket : application full-stack prete pour la prod"
git branch -M main
git remote add origin https://github.com/VOTRE_PSEUDO/kmermarket.git
git push -u origin main
```

> Créez d'abord le dépôt vide `kmermarket` sur github.com (sans README).

---

## 2. Base de données + API sur Render (15 min)

### 2.1 Déployer avec le Blueprint (méthode automatique)

1. Sur https://dashboard.render.com → **New → Blueprint** → connectez le dépôt `kmermarket`.
2. Render détecte automatiquement le fichier **`render.yaml`** (à la racine) et crée :
   - la base **`kmermarket-db`** (PostgreSQL gratuit),
   - l'API **`kmermarket-api`** (Node.js).
3. Cliquez **Apply**. Attendez que les deux services passent au vert (~5 min).

### 2.2 Initialiser la base distante (une seule fois)

La base Render est **vide** : il faut y appliquer le schéma + les données.
Depuis votre PC, en pointant temporairement vers la base distante :

```powershell
cd c:/Users/YOAN/Desktop/sophia/backend
$env:DATABASE_URL="postgresql://...copiee_depuis_le_dashboard_render..."
npm run db:migrate
npm run db:seed
```

> Où trouver l'URL ? Dashboard Render → `kmermarket-db` → **Connections** →
> **External Database URL**. Remettez vos variables locales ensuite
> (ou rouvrez simplement un nouveau terminal).

### 2.3 Vérifier l'API

Ouvrez dans le navigateur :

```
https://kmermarket-api.onrender.com/api/health
```

Attendu : `{"ok":true,"service":"kmermarket-api",...}` ✅
(La première requête peut prendre ~60 s : l'offre gratuite « dort » après
inactivité — c'est normal, voir §5.)

---

## 3. Frontend sur Vercel (10 min)

### 3.1 Importer le projet

1. Sur https://vercel.com → **Add New → Project** → importez `kmermarket`.
2. **Root Directory** : `frontend` (⚠️ indispensable : le dépôt contient
   `backend/`, `frontend/`, `render.yaml` à la racine).
3. Framework détecté : **Vite** ; `vercel.json` force déjà le fallback SPA
   (`/admin`, `/orders/123`, … ne donneront pas de 404) ✅.

### 3.2 Variable d'environnement (avant de déployer !)

Onglet **Settings → Environment Variables** (ou directement à l'import) :

| Clé | Valeur |
|---|---|
| `VITE_API_URL` | `https://kmermarket-api.onrender.com/api` |

> ⚠️ Remplacez `kmermarket-api` par le vrai nom si Render l'a suffixé
> (ex. `kmermarket-api-xxxx`). Cette variable est **figée au build** :
> tout changement exige un **Redeploy**.

### 3.3 Déployer et tester

1. **Deploy** → URL du type `https://kmer-market.vercel.app`.
2. Testez : accueil → boutique → inscription → connexion → panier → commande
   → dashboard admin (`admin@kmermarket.cm` + le mot de passe généré par
   Render, onglet **Environment** de `kmermarket-api`).

---

## 4. Relier frontend ↔ backend (5 min, étape cruciale)

Le backend n'accepte que l'origine déclarée dans `CORS_ORIGIN`. Sans cela,
le navigateur bloque toutes les requêtes API.

1. Dashboard Render → service `kmermarket-api` → **Environment** :
   ```
   CORS_ORIGIN=https://kmer-market.vercel.app
   ```
   (votre vraie URL Vercel ; plusieurs origines possibles, séparées par des virgules)
2. Le service redéploie automatiquement (~2 min).
3. Rechargez le site Vercel (Ctrl+F5) et reconnectez-vous.

> 🔐 **Sessions en ligne** : le backend pose le cookie `km_token` en
> `SameSite=None; Secure` en production (voir `authController.js`),
> ce qui autorise le schéma cross-domain Vercel ↔ Render en HTTPS.
> Si un navigateur bloque quand même les cookies tiers, le token JWT est
> aussi renvoyé dans la réponse JSON `{ user, token }` : prévoyez alors
> l'en-tête `Authorization: Bearer` (déjà accepté par `middleware/auth.js`).

---

## 5. Limites de l'offre gratuite (à connaître)

| Service | Limite | Conséquence |
|---|---|---|
| Render Web (free) | Dort après 15 min d'inactivité, 750 h/mois | 1ʳᵉ requête lente (~60 s), puis fluide |
| Render Postgres (free) | 1 Go, expire après **90 jours** | Pensez à sauvegarder (`pg_dump`) |
| Vercel (hobby) | 100 Go de bande passante/mois | Largement suffisant pour démarrer |
| Neon (si utilisé) | 500 Mo, s'endort après inactivité | Réveil automatique en ~2 s |

**Quand passer au payant ?** Dès que vous avez des clients réguliers ou
Mobile Money réel : VPS (~5 €/mois) + `kmermarket.cm` (voir README § VPS).

---

## 6. Checklist finale ✅

- [ ] `https://…onrender.com/api/health` répond `{"ok":true}`
- [ ] `https://…vercel.app` affiche la boutique (30 produits)
- [ ] Inscription + connexion fonctionnent (cookie `km_token` posé)
- [ ] Panier → commande → confirmation, sans erreur 400
- [ ] Dashboard admin : stats, produits, commandes, utilisateurs
- [ ] `CORS_ORIGIN` = URL Vercel exacte (pas de `/` final)
- [ ] `ADMIN_PASSWORD` changé après la première connexion
- [ ] `JWT_SECRET` de prod différent du secret local

---

## 7. Fichiers de déploiement fournis

| Fichier | Rôle |
|---|---|
| `render.yaml` | Blueprint Render : DB + API d'un clic |
| `frontend/vercel.json` | Build Vite + fallback SPA |
| `.env.production.example` | Modèle des variables de prod (sans secrets) |
| `backend/.env.example` | Modèle des variables locales |

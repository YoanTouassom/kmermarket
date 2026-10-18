/**
 * Point d'entrée Vercel (service « backend », framework Express).
 * ---------------------------------------------------------------
 * Vercel détecte ce fichier et sert l'app exportée par défaut.
 * Les requêtes arrivent avec leur chemin complet (/api/...).
 * Le schéma de la base est appliqué à part (npm run db:migrate).
 * En local, utiliser `npm run dev` / `npm start` (src/server.js).
 */
import { createApp } from './src/app.js'

export default createApp()

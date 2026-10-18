/**
 * Point d'entrée serverless Vercel de l'API.
 * ------------------------------------------
 * vercel.json réécrit toutes les requêtes /api/* vers cette fonction ;
 * Express reçoit l'URL d'origine et applique ses routes habituelles.
 * Le schéma de la base est appliqué à part (npm run db:migrate), pas ici.
 */
import { createApp } from '../backend/src/app.js'

export default createApp()

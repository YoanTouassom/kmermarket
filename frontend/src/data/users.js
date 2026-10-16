/**
 * Comptes de la plateforme.
 *
 * Un seul compte est initialisé : le compte administrateur.
 * Les comptes clients sont créés par les visiteurs via la page /register,
 * puis conservés dans le stockage local de l'application.
 *
 * ⚠️ Les mots de passe ne sont stockés en clair que parce que la persistance
 *    est locale (localStorage). Ils ne sont jamais exposés à l'interface :
 *    `toPublicUser()` (src/services/authService.js) retire le champ avant
 *    tout renvoi vers les composants React.
 *    Lors du branchement d'une API, ce fichier est remplacé par une table
 *    utilisateurs côté serveur avec mots de passe hachés.
 */
export const users = [
  {
    id: 'u-admin',
    firstName: 'Admin',
    lastName: '',
    name: 'Admin',
    email: 'admin@kmermarket.cm',
    phone: '+237 6 99 12 34 56',
    password: 'KmerAdmin2026',
    role: 'admin',
    status: 'active',
    city: 'Douala',
    quartier: 'Bonapriso',
    address: '',
    avatar: '',
    addresses: [],
    preferences: { newsletter: true, sms: true, promos: true },
    createdAt: '2026-01-05',
  },
]

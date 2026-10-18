/**
 * Contenu éditorial de la page d'accueil + paramètres boutique.
 * Modifiable depuis le Dashboard Admin > Gestion du contenu / Paramètres.
 */

export const siteContent = {
  announcement:
    'Livraison offerte dès 25 000 FCFA à Douala et Yaoundé — payez à la livraison ou par Mobile Money.',
  hero: {
    eyebrow: 'Marché en ligne du terroir',
    title: 'Les produits frais du Cameroun, livrés chez vous.',
    subtitle:
      'Du champ à votre cuisine : fruits, légumes, tubercules et produits vivriers sélectionnés chaque matin dans nos régions, puis livrés en quelques heures.',
    primaryCta: 'Découvrir la boutique',
    secondaryCta: 'Comment ça marche',
    stats: [
      { value: '30+', label: 'Produits du terroir' },
      { value: '14', label: 'Villes desservies' },
    ],
  },
  banners: [
    {
      id: 'b-01',
      title: 'Fraîcheur garantie du jour',
      text: 'Récolté le matin, livré l’après-midi.',
      tone: 'green',
      enabled: true,
    },
    {
      id: 'b-02',
      title: 'Paiement à la livraison',
      text: 'Réglez seulement une fois vos produits reçus.',
      tone: 'orange',
      enabled: true,
    },
    {
      id: 'b-03',
      title: 'Produits du terroir',
      text: 'Directement des producteurs de nos régions.',
      tone: 'sand',
      enabled: true,
    },
  ],
  valueProps: [
    {
      icon: 'Leaf',
      title: 'Fraîcheur du jour',
      text: 'Nos produits sont récoltés et triés chaque matin, jamais stockés trop longtemps.',
    },
    {
      icon: 'Truck',
      title: 'Livraison rapide',
      text: 'Livraison en quelques heures dans les grandes villes, sous 48h à l’intérieur du pays.',
    },
    {
      icon: 'BadgeCheck',
      title: 'Qualité contrôlée',
      text: 'Chaque lot est vérifié par notre équipe avant d’être mis en vente.',
    },
    {
      icon: 'Wallet',
      title: 'Paiement flexible',
      text: 'Payez à la livraison ou par Mobile Money, en toute sécurité.',
    },
    {
      icon: 'MapPin',
      title: 'Origine tracée',
      text: 'Nous indiquons la provenance de chaque produit : région et localité.',
    },
    {
      icon: 'Headphones',
      title: 'Service client',
      text: 'Une équipe disponible tous les jours pour vous accompagner.',
    },
  ],
  howItWorks: [
    {
      step: '01',
      title: 'Choisissez vos produits',
      text: 'Parcourez nos catégories et ajoutez au panier vos denrées préférées.',
      icon: 'ShoppingBasket',
    },
    {
      step: '02',
      title: 'Renseignez votre livraison',
      text: 'Indiquez votre ville, quartier et vos préférences de livraison.',
      icon: 'MapPin',
    },
    {
      step: '03',
      title: 'Payez comme vous voulez',
      text: 'Paiement à la livraison ou Mobile Money, selon votre convenance.',
      icon: 'Wallet',
    },
    {
      step: '04',
      title: 'Recevez en un temps record',
      text: 'Nous livrons à votre porte et vous confirmez la réception.',
      icon: 'Truck',
    },
  ],
}

export const settings = {
  storeName: 'KmerMarket',
  email: 'contact@kmermarket.cm',
  phone: '+237 6 99 12 34 56',
  whatsapp: '+237 6 99 12 34 56',
  address: 'Bonapriso, Douala, Cameroun',
  hours: 'Lundi – Samedi : 7h – 20h • Dimanche : 8h – 14h',
  freeDeliveryThreshold: 25000,
  social: {
    facebook: 'https://facebook.com/kmermarket',
    instagram: 'https://instagram.com/kmermarket',
    x: 'https://x.com/kmermarket',
    tiktok: 'https://tiktok.com/@kmermarket',
  },
}
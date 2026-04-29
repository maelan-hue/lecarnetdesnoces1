// Définition des champs de specs par catégorie
// Tous les champs sont optionnels côté affichage : si la valeur est vide, on n'affiche pas la ligne

export type SpecField = {
  key:   string;
  label: string;
  placeholder?: string;
};

export const SPEC_FIELDS: Record<string, SpecField[]> = {
  LIEU: [
    { key: "capacity",       label: "Capacité",               placeholder: "ex : 150 assis / 200 debout" },
    { key: "accommodation",  label: "Hébergement sur place",  placeholder: "ex : 10 chambres, 20 lits" },
    { key: "traiteurs",      label: "Traiteurs imposés",      placeholder: "ex : Maison Cazals · Oui / Non / Liste" },
    { key: "indoorOutdoor",  label: "Intérieur / extérieur",  placeholder: "ex : Intérieur + extérieur" },
    { key: "endTime",        label: "Heure de fin musique",   placeholder: "ex : 3h du matin" },
    { key: "parking",        label: "Parking",                placeholder: "ex : 60 places, gratuit" },
  ],
  PHOTOGRAPHE: [
    { key: "style",          label: "Style photographique",   placeholder: "ex : Reportage / Posé / Éditorial" },
    { key: "duration",       label: "Durée standard",         placeholder: "ex : 10 à 12 heures" },
    { key: "photoCount",     label: "Nombre de photos",       placeholder: "ex : 600 à 800 retouchées" },
    { key: "delivery",       label: "Délai de livraison",     placeholder: "ex : 8 à 10 semaines" },
    { key: "photographers",  label: "Photographes présents",  placeholder: "ex : 1 ou 2 (duo)" },
    { key: "album",          label: "Album / tirages",        placeholder: "ex : Inclus / En option" },
  ],
  VIDEASTE: [
    { key: "style",          label: "Style",                  placeholder: "ex : Cinéma / Documentaire / Short reel" },
    { key: "filmDuration",   label: "Durée du film final",    placeholder: "ex : 5 à 8 minutes" },
    { key: "drone",          label: "Drone",                  placeholder: "ex : Inclus / En option / Non" },
    { key: "delivery",       label: "Délai de livraison",     placeholder: "ex : 3 à 4 mois" },
    { key: "cameras",        label: "Nombre de caméras",      placeholder: "ex : 2 caméras" },
    { key: "highlight",      label: "Film highlight",         placeholder: "ex : 90 secondes pour les réseaux" },
  ],
  TRAITEUR: [
    { key: "cuisine",        label: "Type de cuisine",        placeholder: "ex : Catalane / Méditerranéenne" },
    { key: "diets",          label: "Régimes spéciaux",       placeholder: "ex : Végétarien, Halal, Vegan, Sans gluten" },
    { key: "capacity",       label: "Capacité (min – max)",   placeholder: "ex : 30 à 300 invités" },
    { key: "service",        label: "Service en salle",       placeholder: "ex : Inclus (1 serveur / 15 invités)" },
    { key: "tableware",      label: "Vaisselle fournie",      placeholder: "ex : Oui / Non" },
    { key: "menuTest",       label: "Test de menu inclus",    placeholder: "ex : Oui, pour 4 personnes" },
  ],
  FLEURISTE: [
    { key: "style",          label: "Style",                  placeholder: "ex : Champêtre / Bohème / Classique" },
    { key: "prestations",    label: "Prestations couvertes",  placeholder: "ex : Bouquet, arche, centres de table" },
    { key: "local",          label: "Fleurs locales / saison",placeholder: "ex : Oui, producteurs locaux" },
    { key: "freshness",      label: "Délai de fraîcheur",     placeholder: "ex : Livraison le matin du mariage" },
    { key: "dismantling",    label: "Démontage lendemain",    placeholder: "ex : Inclus / Sur devis" },
    { key: "delivery",       label: "Livraison sur place",    placeholder: "ex : Incluse dans un rayon de 50 km" },
  ],
  DJ_MUSICIEN: [
    { key: "type",           label: "Type d'animation",       placeholder: "ex : DJ seul / DJ + live / Cérémonie acoustique" },
    { key: "equipment",      label: "Sono & lumières",        placeholder: "ex : Incluses (200 personnes)" },
    { key: "duration",       label: "Durée standard",         placeholder: "ex : 22h → 4h du matin" },
    { key: "playlist",       label: "Playlist personnalisable",placeholder: "ex : Oui, co-construite avec vous" },
    { key: "ceremony",       label: "Animation cérémonie",    placeholder: "ex : En option (acoustique)" },
    { key: "photobooth",     label: "Photobooth",             placeholder: "ex : En option (+250 €)" },
  ],
  OFFICIANT: [
    { key: "languages",      label: "Langue(s)",              placeholder: "ex : Français, Espagnol, Anglais" },
    { key: "meetings",       label: "Entretiens préalables",  placeholder: "ex : 2 entretiens inclus" },
    { key: "writing",        label: "Écriture personnalisée", placeholder: "ex : Oui, avec vous" },
    { key: "duration",       label: "Durée de cérémonie",     placeholder: "ex : 45 à 60 minutes" },
    { key: "area",           label: "Périmètre géographique", placeholder: "ex : Roussillon, Aude, Espagne" },
    { key: "rehearsal",      label: "Répétition incluse",     placeholder: "ex : Oui / Non" },
  ],
  COIFFURE_MAQUILLAGE: [
    { key: "onSite",         label: "Sur place ou en salon",  placeholder: "ex : Déplacement sur place" },
    { key: "trial",          label: "Essai inclus",           placeholder: "ex : Oui / En option" },
    { key: "witnesses",      label: "Témoins inclus",         placeholder: "ex : En option (forfait)" },
    { key: "organic",        label: "Options bio / véganes",  placeholder: "ex : Produits bio disponibles" },
    { key: "bridePackage",   label: "Forfait mariée+témoins", placeholder: "ex : Oui, devis personnalisé" },
    { key: "duration",       label: "Durée prestation",       placeholder: "ex : 1h30 pour la mariée" },
  ],
  DECORATION_PAPETERIE: [
    { key: "specialties",    label: "Spécialités",            placeholder: "ex : Faire-part, menus, signalétique" },
    { key: "custom",         label: "Création sur-mesure",    placeholder: "ex : Oui / Catalogue uniquement" },
    { key: "delivery",       label: "Délai de livraison",     placeholder: "ex : 4 à 6 semaines" },
    { key: "paper",          label: "Type de papier",         placeholder: "ex : Recyclé / Gravé / Calligraphié" },
    { key: "samples",        label: "Échantillons offerts",   placeholder: "ex : Oui, 3 options" },
    { key: "installation",   label: "Installation le jour J", placeholder: "ex : Incluse / En option" },
  ],
  WEDDING_PLANNER: [
    { key: "type",           label: "Type d'accompagnement",  placeholder: "ex : Intégral / Partiel / Jour J" },
    { key: "duration",       label: "Durée d'accompagnement", placeholder: "ex : De 12 à 18 mois" },
    { key: "area",           label: "Périmètre géographique", placeholder: "ex : Roussillon et alentours" },
    { key: "weddingsPerYear",label: "Mariages par an",        placeholder: "ex : 15 mariages maximum" },
    { key: "venueVisit",     label: "Visite des lieux",       placeholder: "ex : Incluse" },
    { key: "vendors",        label: "Réseau prestataires",    placeholder: "ex : +80 prestataires partenaires" },
  ],
  VINS_CHAMPAGNE: [
    { key: "type",           label: "Type",                   placeholder: "ex : Cave / Domaine viticole / Sommelier" },
    { key: "local",          label: "Vins locaux Roussillon", placeholder: "ex : Oui, AOP Côtes du Roussillon" },
    { key: "sommelier",      label: "Service sommelier",      placeholder: "ex : Inclus / En option" },
    { key: "glasses",        label: "Verres fournis",         placeholder: "ex : Oui / Non" },
    { key: "returnPolicy",   label: "Reprise bouteilles",     placeholder: "ex : Oui, bouteilles non ouvertes" },
    { key: "delivery",       label: "Livraison",              placeholder: "ex : Gratuite dès 12 bouteilles" },
  ],
  VOITURE_TRANSPORT: [
    { key: "vehicleType",    label: "Type de véhicule",       placeholder: "ex : Vintage / Cabriolet / Luxe" },
    { key: "capacity",       label: "Capacité passagers",     placeholder: "ex : 2 à 6 passagers" },
    { key: "driver",         label: "Avec chauffeur",         placeholder: "ex : Oui inclus / Sans chauffeur" },
    { key: "area",           label: "Périmètre kilométrique", placeholder: "ex : 80 km autour de Perpignan" },
    { key: "decoration",     label: "Décoration florale",     placeholder: "ex : Incluse / En option" },
    { key: "duration",       label: "Durée de mise à disposition", placeholder: "ex : 4h minimum" },
  ],
  ROBE_COSTUME: [
    { key: "type",           label: "Type",                   placeholder: "ex : Créateurs / Boutique / Sur-mesure" },
    { key: "fittings",       label: "Essayages inclus",       placeholder: "ex : 3 essayages inclus" },
    { key: "alterations",    label: "Retouches incluses",     placeholder: "ex : Oui / Forfait retouches" },
    { key: "leadTime",       label: "Délai de fabrication",   placeholder: "ex : 4 à 6 mois" },
    { key: "accessories",    label: "Accessoires",            placeholder: "ex : Voile, ceinture, bijoux" },
    { key: "rental",         label: "Location possible",      placeholder: "ex : Oui / Non" },
  ],
  PHOTOBOOTH: [
    { key: "type",           label: "Type",                   placeholder: "ex : Photo physique / Digital / Animation" },
    { key: "duration",       label: "Durée",                  placeholder: "ex : 4 heures" },
    { key: "printer",        label: "Imprimante incluse",     placeholder: "ex : Oui, impressions instantanées" },
    { key: "host",           label: "Animateur sur place",    placeholder: "ex : Oui / Non" },
    { key: "guestbook",      label: "Album souvenir",         placeholder: "ex : Inclus / En option" },
    { key: "props",          label: "Accessoires et décors",  placeholder: "ex : Inclus (thème sur mesure)" },
  ],
  ONGLES_MANUCURE: [
    { key: "onSite",         label: "Sur place ou en salon",  placeholder: "ex : Déplacement sur place" },
    { key: "witnesses",      label: "Témoins inclus",         placeholder: "ex : En option" },
    { key: "type",           label: "Type de pose",           placeholder: "ex : Semi-permanent / Classique / Gel" },
    { key: "nailArt",        label: "Nail art personnalisé",  placeholder: "ex : Oui, thème sur mesure" },
    { key: "trial",          label: "Essai inclus",           placeholder: "ex : Oui / Non" },
    { key: "duration",       label: "Durée prestation",       placeholder: "ex : 1h30 pour la mariée" },
  ],
  GOODIES_INVITES: [
    { key: "type",           label: "Type de goodies",        placeholder: "ex : Savons / Huile d'olive / Bougies" },
    { key: "personalization",label: "Personnalisation",       placeholder: "ex : Étiquette avec prénoms et date" },
    { key: "minQuantity",    label: "Quantité minimum",       placeholder: "ex : 50 pièces minimum" },
    { key: "leadTime",       label: "Délai de fabrication",   placeholder: "ex : 3 à 4 semaines" },
    { key: "unitPrice",      label: "Prix unitaire indicatif",placeholder: "ex : À partir de 4 € / pièce" },
    { key: "packaging",      label: "Packaging inclus",       placeholder: "ex : Sachet kraft ou boîte" },
  ],
  SOINS_PRE_MARIAGE: [
    { key: "type",           label: "Type de soins",          placeholder: "ex : Visage / Corps / Spa / Amincissement" },
    { key: "bridePackage",   label: "Forfait mariée multi-séances", placeholder: "ex : Oui, 3 séances" },
    { key: "witnesses",      label: "Témoins inclus",         placeholder: "ex : Possible sur demande" },
    { key: "onSite",         label: "À domicile ou en institut", placeholder: "ex : Institut / Déplacement possible" },
    { key: "organic",        label: "Bio / naturel",          placeholder: "ex : Produits certifiés bio" },
    { key: "duration",       label: "Durée d'une séance",     placeholder: "ex : 1h à 1h30" },
  ],
  AUTRE: [
    { key: "description",    label: "Description libre",      placeholder: "Décrivez votre prestation en quelques lignes" },
  ],
};

// Retourne les champs specs pour une catégorie donnée
export function getSpecFields(category: string): SpecField[] {
  return SPEC_FIELDS[category] ?? SPEC_FIELDS.AUTRE;
}

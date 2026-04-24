// Génère un slug à partir d'un nom
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Génère un mot de passe temporaire lisible
export function generatePassword(length = 10): string {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// Formate une date en français
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Calcule le nombre de jours entre aujourd'hui et une date
export function daysUntil(date: Date | string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export const PRO_CATEGORIES: Record<string, string> = {
  PHOTOGRAPHE: "Photographe",
  VIDEASTE: "Vidéaste",
  TRAITEUR: "Traiteur",
  LIEU: "Lieu de réception",
  FLEURISTE: "Fleuriste",
  DJ_MUSICIEN: "DJ / Musicien",
  OFFICIANT: "Officiant laïc",
  COIFFURE_MAQUILLAGE: "Coiffure & maquillage",
  DECORATION_PAPETERIE: "Décoration / Papeterie",
  WEDDING_PLANNER: "Wedding planner",
  AUTRE: "Autre",
};

export const AMBIANCES: Record<string, string> = {
  champetre: "Champêtre",
  classique: "Classique chic",
  boheme: "Bohème",
  moderne: "Moderne",
  intimiste: "Intimiste",
  mediterraneen: "Méditerranéen",
};

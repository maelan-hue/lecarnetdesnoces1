import { db } from "@/lib/db";

type TaskTemplate = {
  phase: number;
  position: number;
  category: string;
  title: string;
  description?: string;
  timingLabel: string;
  tipContext: string;
};

// Tâches universelles, toujours présentes
const BASE_TASKS: TaskTemplate[] = [
  // Phase 1 — Les grandes décisions (18-12 mois)
  { phase: 1, position: 1,  category: "lieu",         title: "Lieu de réception",        timingLabel: "18 – 12 mois avant", tipContext: "carnet_phase_1", description: "Le lieu définit tout le reste — capacité, traiteur agréé, ambiance." },
  { phase: 1, position: 2,  category: "traiteur",     title: "Traiteur",                 timingLabel: "18 – 12 mois avant", tipContext: "carnet_phase_1", description: "Souvent lié au lieu — vérifiez les traiteurs agréés." },
  { phase: 1, position: 3,  category: "robe",         title: "Robe de mariée",           timingLabel: "18 – 12 mois avant", tipContext: "carnet_phase_1", description: "Les délais de création peuvent dépasser 6 mois." },
  { phase: 1, position: 4,  category: "costume",      title: "Costume du marié",         timingLabel: "12 – 9 mois avant",  tipContext: "carnet_phase_1" },
  { phase: 1, position: 5,  category: "faire_part",   title: "Faire-part",               timingLabel: "12 – 9 mois avant",  tipContext: "carnet_phase_1", description: "À envoyer 3 à 4 mois avant le mariage." },

  // Phase 2 — Les prestataires clés (12-6 mois)
  { phase: 2, position: 1,  category: "photographe",  title: "Photographe",              timingLabel: "12 – 6 mois avant",  tipContext: "carnet_phase_2", description: "Les photographes de qualité se réservent très tôt." },
  { phase: 2, position: 2,  category: "videaste",     title: "Vidéaste",                 timingLabel: "12 – 6 mois avant",  tipContext: "carnet_phase_2" },
  { phase: 2, position: 3,  category: "dj_musicien",  title: "Musique & DJ",             timingLabel: "12 – 6 mois avant",  tipContext: "carnet_phase_2", description: "Les DJs sont complets tôt en haute saison." },
  { phase: 2, position: 4,  category: "fleuriste",    title: "Fleuriste",                timingLabel: "9 – 6 mois avant",   tipContext: "carnet_phase_2", description: "Bouquet, boutonnières, centres de table, arche." },

  // Phase 3 — Ambiance & beauté (6-3 mois)
  { phase: 3, position: 1,  category: "decoration",   title: "Décorateur & papeterie",   timingLabel: "6 – 3 mois avant",   tipContext: "carnet_phase_3" },
  { phase: 3, position: 2,  category: "maquillage",   title: "Maquillage mariée",        timingLabel: "6 – 3 mois avant",   tipContext: "carnet_phase_3", description: "Forfait mariée + témoins disponible chez la plupart." },
  { phase: 3, position: 3,  category: "coiffure",     title: "Coiffure mariée",          timingLabel: "6 – 3 mois avant",   tipContext: "carnet_phase_3" },
  { phase: 3, position: 4,  category: "voiture",      title: "Voiture de mariage",       timingLabel: "6 – 3 mois avant",   tipContext: "carnet_phase_3", description: "Cabriolet, vintage ou luxe." },
  { phase: 3, position: 5,  category: "boissons",     title: "Vins & champagne",         timingLabel: "6 – 3 mois avant",   tipContext: "carnet_phase_3", description: "Commandez à l'avance — cave locale, domaine viticole ou caviste. Comptez 1 bouteille / 3 invités pour le champagne." },

  // Phase 4 — Les dernières touches (3-1 mois)
  { phase: 4, position: 1,  category: "ongles",       title: "Ongles mariée",            timingLabel: "3 – 1 mois avant",   tipContext: "carnet_phase_4" },
  { phase: 4, position: 2,  category: "soins",        title: "Soins pré-mariage",        timingLabel: "3 – 1 mois avant",   tipContext: "carnet_phase_4", description: "Forfait spa 1 mois avant." },
  { phase: 4, position: 3,  category: "goodies",      title: "Goodies invités",          timingLabel: "3 – 1 mois avant",   tipContext: "carnet_phase_4", description: "Bougies, dragées, sachets de lavande, huile d'olive locale…" },
  { phase: 4, position: 4,  category: "photobooth",   title: "Photobooth",               timingLabel: "3 – 1 mois avant",   tipContext: "carnet_phase_4", description: "Animation invités." },

  // Phase 5 — Jour J
  { phase: 5, position: 1,  category: "recap",        title: "Récapitulatif prestataires automatique", timingLabel: "La semaine du mariage", tipContext: "carnet_phase_5", description: "Envoyé automatiquement par Le Carnet 7 jours avant." },
  { phase: 5, position: 2,  category: "planning",     title: "Planning horaire de la journée",         timingLabel: "La semaine du mariage", tipContext: "carnet_phase_5", description: "Livraisons, installations, timing." },
];

export async function generateWeddingTasks(
  coupleId: string,
  profile: {
    weddingDate:    Date | null | undefined;
    guestCount:     number | null | undefined;
    ambiances:      string[];
    planningStage:  string | null | undefined;
  }
) {
  const tasks = [...BASE_TASKS];

  // Officiant laïc si cérémonie non religieuse probable (toujours inclus en Roussillon)
  tasks.push({ phase: 2, position: 5, category: "officiant", title: "Officiant laïc", timingLabel: "9 – 6 mois avant", tipContext: "carnet_phase_2", description: "Pour une cérémonie personnalisée et laïque." });

  // Wedding planner si avancé ou grand mariage
  if (profile.planningStage === "just_engaged" || (profile.guestCount && profile.guestCount > 100)) {
    tasks.push({ phase: 1, position: 6, category: "wedding_planner", title: "Wedding planner", timingLabel: "18 – 12 mois avant", tipContext: "carnet_phase_1", description: "Coordination complète ou simple coordination jour J." });
  }

  await db.coupleTask.createMany({
    data: tasks.map((t) => ({ ...t, coupleId, status: "TODO" as const })),
  });
}

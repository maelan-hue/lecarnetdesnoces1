// Script de migration — ajoute les tâches manquantes aux carnets existants
// Usage : node scripts/migrate-tasks.mjs

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { readFileSync } from "fs";
import { resolve } from "path";

// Charger le .env manuellement
const envPath = resolve(process.cwd(), ".env");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const [key, ...rest] = line.split("=");
  if (key && rest.length) {
    process.env[key.trim()] = rest.join("=").trim().replace(/^"|"$/g, "");
  }
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db      = new PrismaClient({ adapter });

const MISSING_TASKS = [
  {
    phase: 3, position: 5, category: "boissons",
    title: "Vins & champagne",
    timingLabel: "6 – 3 mois avant",
    tipContext: "carnet_phase_3",
    description: "Commandez à l'avance — cave locale, domaine viticole ou caviste. Comptez 1 bouteille / 3 invités pour le champagne.",
  },
];

async function main() {
  const couples = await db.couple.findMany({ select: { id: true } });
  console.log(`${couples.length} couple(s) en base.`);

  let added = 0;
  for (const couple of couples) {
    for (const task of MISSING_TASKS) {
      const exists = await db.coupleTask.findFirst({
        where: { coupleId: couple.id, category: task.category, phase: task.phase },
      });
      if (!exists) {
        await db.coupleTask.create({ data: { coupleId: couple.id, status: "TODO", ...task } });
        added++;
        console.log(`  ✓ Ajouté "${task.title}" pour couple ${couple.id}`);
      } else {
        console.log(`  · Déjà présent pour couple ${couple.id}`);
      }
    }
  }

  console.log(`\nMigration terminée — ${added} tâche(s) ajoutée(s).`);
  await db.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });

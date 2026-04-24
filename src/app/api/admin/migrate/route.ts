import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

// Tâches à ajouter si absentes du carnet
const MISSING_TASKS = [
  { phase: 3, position: 5, category: "boissons", title: "Vins & champagne", timingLabel: "6 – 3 mois avant", tipContext: "carnet_phase_3", description: "Commandez à l'avance — cave locale, domaine viticole ou caviste. Comptez 1 bouteille / 3 invités pour le champagne." },
];

export async function POST() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const couples = await db.couple.findMany({ select: { id: true } });
  let added = 0;

  for (const couple of couples) {
    for (const task of MISSING_TASKS) {
      const exists = await db.coupleTask.findFirst({
        where: { coupleId: couple.id, category: task.category, phase: task.phase },
      });
      if (!exists) {
        await db.coupleTask.create({
          data: { coupleId: couple.id, status: "TODO", ...task },
        });
        added++;
      }
    }
  }

  return NextResponse.json({ ok: true, added, couples: couples.length });
}

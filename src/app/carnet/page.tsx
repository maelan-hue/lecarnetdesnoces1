import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { daysUntil, formatDate } from "@/lib/utils";
import CarnetClient from "./CarnetClient";

export default async function CarnetPage() {
  const session = await getSession();
  if (!session || session.role !== "couple") redirect("/connexion");

  const couple = await db.couple.findUnique({
    where: { id: session.sub },
    include: {
      tasks: {
        include: { payments: { where: { status: "PAID" } } },
        orderBy: [{ phase: "asc" }, { position: "asc" }],
      },
      guests: { select: { presence: true } },
    },
  });

  if (!couple) redirect("/connexion");

  // Calculs budget
  const budgetEngage = couple.tasks.reduce((sum, t) => {
    const paye = t.payments.reduce((s, p) => s + p.amount, 0);
    return sum + (paye > 0 ? paye : t.quoteTotal ?? 0) ;
  }, 0);

  // Invités
  const guestTotal    = couple.guests.length;
  const guestPresents = couple.guests.filter((g) => g.presence === "PRESENT").length;

  // Countdown
  const days   = couple.weddingDate ? daysUntil(couple.weddingDate) : null;
  const months = days !== null ? Math.round(days / 30) : null;

  // Grouper les tâches par phase
  const phases = [1, 2, 3, 4, 5].map((phaseNum) => {
    const phaseTasks = couple.tasks.filter((t) => t.phase === phaseNum);
    const done  = phaseTasks.filter((t) => t.status === "DONE").length;
    const total = phaseTasks.length;
    return { phaseNum, tasks: phaseTasks, done, total };
  });

  const PHASE_META: Record<number, { timing: string; name: string }> = {
    1: { timing: "18 – 12 mois avant",          name: "Les grandes décisions" },
    2: { timing: "12 – 6 mois avant · maintenant", name: "Les prestataires clés" },
    3: { timing: "6 – 3 mois avant",             name: "Ambiance & beauté" },
    4: { timing: "3 – 1 mois avant",             name: "Les dernières touches" },
    5: { timing: "La semaine du mariage",         name: "Jour J — tout est prêt ✦" },
  };

  // Sérialiser pour le client
  const data = {
    prenoms:      couple.prenoms,
    weddingDate:  couple.weddingDate?.toISOString() ?? null,
    weddingCity:  couple.weddingCity,
    weddingVenue: couple.weddingVenue,
    guestCount:   couple.guestCount,
    budgetEstimate: couple.budgetEstimate,
    budgetEngage,
    days,
    months,
    guestTotal,
    guestPresents,
    totalTasks:   couple.tasks.length,
    phases: phases.map((p) => ({
      ...p,
      meta: PHASE_META[p.phaseNum],
      tasks: p.tasks.map((t) => ({
        id:          t.id,
        title:       t.title,
        description: t.description,
        category:    t.category,
        status:      t.status,
        proName:     t.proName,
        quoteTotal:  t.quoteTotal,
        amountPaid:  t.payments.reduce((s, p) => s + p.amount, 0),
      })),
    })),
  };

  return <CarnetClient data={data} />;
}

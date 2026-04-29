import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { daysUntil } from "@/lib/utils";
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

  // Budget engagé = même calcul que BudgetSlot (centimes)
  // Cas A : PaymentLinks Stripe payés
  const stripeAgg = await db.paymentLink.aggregate({
    where: {
      status: "PAID",
      pro: { conversations: { some: { coupleId: session.sub } } },
    },
    _sum: { quoteTotal: true },
  });
  // Cas B & C : saisies manuelles
  const manualAgg = await db.manualVendorEntry.aggregate({
    where:  { coupleId: session.sub },
    _sum:   { totalAmount: true },
  });
  const budgetEngage = Math.round(
    ((stripeAgg._sum.quoteTotal ?? 0) + (manualAgg._sum.totalAmount ?? 0)) / 100
  );

  const guestTotal    = couple.guests.filter((g) => g.presence === "PRESENT").length;
  const days          = couple.weddingDate ? daysUntil(couple.weddingDate) : null;
  const months        = days !== null ? Math.round(days / 30) : null;

  const PHASE_META: Record<number, { timing: string; name: string }> = {
    1: { timing: "18 – 12 mois avant",             name: "Les grandes décisions" },
    2: { timing: "12 – 6 mois avant · maintenant", name: "Les prestataires clés" },
    3: { timing: "6 – 3 mois avant",               name: "Ambiance & beauté" },
    4: { timing: "3 – 1 mois avant",               name: "Les dernières touches" },
    5: { timing: "La semaine du mariage",           name: "Jour J — tout est prêt ✦" },
  };

  const phases = [1, 2, 3, 4, 5].map((phaseNum) => {
    const phaseTasks = couple.tasks.filter((t) => t.phase === phaseNum);
    return {
      phaseNum,
      done:  phaseTasks.filter((t) => t.status === "DONE").length,
      total: phaseTasks.length,
      meta:  PHASE_META[phaseNum],
      tasks: phaseTasks.map((t) => ({
        id:          t.id,
        title:       t.title,
        description: t.description,
        category:    t.category,
        status:      t.status,
        proName:     t.proName,
        quoteTotal:  t.quoteTotal,
        amountPaid:  t.payments.reduce((s, p) => s + p.amount, 0),
      })),
    };
  });

  return (
    <CarnetClient data={{
      prenoms:        couple.prenoms,
      weddingDate:    couple.weddingDate?.toISOString() ?? null,
      weddingCity:    couple.weddingCity,
      weddingVenue:   couple.weddingVenue,
      guestCount:     couple.guestCount,
      budgetEstimate: couple.budgetEstimate,
      budgetEngage,
      days,
      months,
      guestTotal,
      totalTasks:     couple.tasks.length,
      phases,
    }} />
  );
}

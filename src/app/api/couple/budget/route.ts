import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { ManualEntryStatus } from "@prisma/client";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "couple") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const couple = await db.couple.findUnique({
    where: { id: session.sub },
    select: { budgetEstimate: true },
  });

  // Cas A : paiements Stripe (PaymentLink payés, groupés par pro)
  const paidLinks = await db.paymentLink.findMany({
    where: { status: "PAID", pro: { conversations: { some: { coupleId: session.sub } } } },
    include: { pro: { select: { id: true, name: true, category: true, city: true } } },
  });

  // Cas B + C : entrées manuelles
  const manual = await db.manualVendorEntry.findMany({
    where: { coupleId: session.sub },
    include: { pro: { select: { id: true, name: true, slug: true, category: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ couple, paidLinks, manual });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "couple") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const { vendorName, vendorCategory, totalAmount, proId, isExternal,
          vendorCity, vendorEmail, vendorPhone, vendorWebsite,
          prestationDate, status, depositAmount, depositPaidAt,
          balanceDueDate, paymentMethod, notes } = body;

  if (!vendorName?.trim()) return NextResponse.json({ error: "Nom requis." }, { status: 400 });
  if (!vendorCategory)      return NextResponse.json({ error: "Catégorie requise." }, { status: 400 });
  if (!totalAmount || totalAmount <= 0) return NextResponse.json({ error: "Devis total requis (> 0)." }, { status: 400 });

  // Calculer le statut auto si non précisé
  let autoStatus: ManualEntryStatus = status ?? "QUOTED";
  if (!status) {
    const dep = Number(depositAmount ?? 0);
    if (dep === 0)              autoStatus = "QUOTED";
    else if (dep >= totalAmount) autoStatus = "FULLY_PAID";
    else                        autoStatus = "DEPOSIT_PAID";
  }

  const entry = await db.manualVendorEntry.create({
    data: {
      coupleId:      session.sub,
      proId:         proId || null,
      isExternal:    Boolean(isExternal),
      vendorName:    vendorName.trim(),
      vendorCategory,
      vendorCity:    vendorCity?.trim() || null,
      vendorEmail:   vendorEmail?.trim() || null,
      vendorPhone:   vendorPhone?.trim() || null,
      vendorWebsite: vendorWebsite?.trim() || null,
      totalAmount:   Math.round(Number(totalAmount)),
      prestationDate: prestationDate ? new Date(prestationDate) : null,
      status:        autoStatus,
      depositAmount: Math.round(Number(depositAmount ?? 0)),
      depositPaidAt: depositPaidAt ? new Date(depositPaidAt) : null,
      balanceDueDate: balanceDueDate ? new Date(balanceDueDate) : null,
      paymentMethod:  paymentMethod || null,
      notes:          notes?.trim() || null,
    },
  });

  // Mettre à jour la tâche correspondante via la correspondance inverse CATEGORY_TO_PRO
  const { CATEGORY_TO_PRO } = await import("@/lib/utils");
  const matchingTaskCats = Object.entries(CATEGORY_TO_PRO)
    .filter(([, v]) => v === vendorCategory)
    .map(([k]) => k);

  if (matchingTaskCats.length > 0) {
    // Mettre à jour les tâches existantes (sans filtre sur le statut)
    const updated = await db.coupleTask.updateMany({
      where: { coupleId: session.sub, category: { in: matchingTaskCats } },
      data: {
        proName:    vendorName.trim(),
        quoteTotal: Math.round(Number(totalAmount) / 100),
        status:     "IN_PROGRESS",
      },
    });

    // Si aucune tâche trouvée → en créer une dans le carnet
    if (updated.count === 0) {
      await db.coupleTask.create({
        data: {
          coupleId:    session.sub,
          phase:       2,
          position:    99,
          category:    matchingTaskCats[0],
          title:       vendorName.trim(),
          timingLabel: "À organiser",
          tipContext:  "carnet_phase_2",
          proName:     vendorName.trim(),
          quoteTotal:  Math.round(Number(totalAmount) / 100),
          status:      "IN_PROGRESS",
        },
      });
    }
  }

  // Si l'entrée vient d'une sélection (proId fourni), lier et confirmer
  if (proId) {
    await db.vendorSelection.upsert({
      where:  { coupleId_proId: { coupleId: session.sub, proId } },
      update: { status: "confirmed", confirmedAt: new Date(), budgetEntryId: entry.id },
      create: { coupleId: session.sub, proId, status: "confirmed", category: vendorCategory, confirmedAt: new Date(), budgetEntryId: entry.id },
    });
  }

  return NextResponse.json(entry, { status: 201 });
}

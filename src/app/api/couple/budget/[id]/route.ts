import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { ManualEntryStatus } from "@prisma/client";

type P = { params: Promise<{ id: string }> };

async function getEntry(coupleId: string, id: string) {
  return db.manualVendorEntry.findFirst({ where: { id, coupleId } });
}

export async function PATCH(req: NextRequest, { params }: P) {
  const session = await getSession();
  if (!session || session.role !== "couple") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const entry = await getEntry(session.sub, id);
  if (!entry) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const body = await req.json();
  const { totalAmount, depositAmount, status, ...rest } = body;

  // Recalculer le statut auto si les montants changent
  const newTotal   = totalAmount   !== undefined ? Math.round(Number(totalAmount))   : entry.totalAmount;
  const newDeposit = depositAmount !== undefined ? Math.round(Number(depositAmount)) : entry.depositAmount;

  let newStatus: ManualEntryStatus = status ?? entry.status;
  if (!status) {
    if (newDeposit === 0)              newStatus = "QUOTED";
    else if (newDeposit >= newTotal)   newStatus = "FULLY_PAID";
    else                               newStatus = "DEPOSIT_PAID";
  }

  const allowed = ["vendorName","vendorCategory","vendorCity","vendorEmail","vendorPhone","vendorWebsite","prestationDate","depositPaidAt","balanceDueDate","paymentMethod","proofUrl","notes"];
  const data: Record<string,unknown> = { totalAmount: newTotal, depositAmount: newDeposit, status: newStatus };
  for (const k of allowed) {
    if (k in rest) data[k] = rest[k] || null;
  }
  if (data.prestationDate) data.prestationDate = new Date(data.prestationDate as string);
  if (data.depositPaidAt)  data.depositPaidAt  = new Date(data.depositPaidAt as string);
  if (data.balanceDueDate) data.balanceDueDate  = new Date(data.balanceDueDate as string);

  const oldName = entry.vendorName;
  const updated = await db.manualVendorEntry.update({ where: { id }, data });

  // Effacer l'ancien proName sur TOUTES les tâches du couple qui portaient ce nom
  await db.coupleTask.updateMany({
    where: { coupleId: session.sub, proName: oldName },
    data:  { proName: null, quoteTotal: null, status: "TODO" },
  });

  // Mettre à jour la tâche correspondant à la NOUVELLE catégorie
  // Utilise la correspondance inverse : cherche la clé dans CATEGORY_TO_PRO qui pointe vers vendorCategory
  const { CATEGORY_TO_PRO } = await import("@/lib/utils");
  const matchingTaskCats = Object.entries(CATEGORY_TO_PRO)
    .filter(([, v]) => v === updated.vendorCategory)
    .map(([k]) => k);

  if (matchingTaskCats.length > 0) {
    await db.coupleTask.updateMany({
      where: { coupleId: session.sub, category: { in: matchingTaskCats } },
      data: {
        proName:    updated.vendorName,
        quoteTotal: Math.round(updated.totalAmount / 100),
        status:     "IN_PROGRESS",
      },
    });
  }

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: P) {
  const session = await getSession();
  if (!session || session.role !== "couple") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const entry = await getEntry(session.sub, id);
  if (!entry) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const nameToRemove = entry.vendorName;
  await db.manualVendorEntry.delete({ where: { id } });

  // Effacer le proName sur les tâches qui portaient ce nom
  await db.coupleTask.updateMany({
    where: { coupleId: session.sub, proName: nameToRemove },
    data:  { proName: null, quoteTotal: null, status: "TODO" },
  });

  return NextResponse.json({ ok: true });
}

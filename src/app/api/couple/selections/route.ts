import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

// GET — liste toutes les sélections du couple
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "couple") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const selections = await db.vendorSelection.findMany({
    where:   { coupleId: session.sub },
    include: {
      pro: {
        select: {
          id: true, name: true, slug: true, category: true,
          city: true, tagline: true,
          tarifs: { orderBy: { position: "asc" }, take: 1 },
        },
      },
      budgetEntry: { select: { id: true, totalAmount: true, status: true } },
    },
    orderBy: { addedAt: "desc" },
  });

  return NextResponse.json(selections);
}

// POST — ajouter, confirmer ou retirer un prestataire
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "couple") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { proId, action } = await req.json();
  // action: "add" | "remove" | "confirm" | "unconfirm"

  if (!proId || !action) return NextResponse.json({ error: "Données manquantes." }, { status: 400 });

  if (action === "add") {
    const pro = await db.pro.findUnique({ where: { id: proId }, select: { category: true } });
    if (!pro) return NextResponse.json({ error: "Prestataire introuvable." }, { status: 404 });

    const sel = await db.vendorSelection.upsert({
      where:  { coupleId_proId: { coupleId: session.sub, proId } },
      update: {},
      create: { coupleId: session.sub, proId, status: "selection", category: pro.category },
    });
    return NextResponse.json({ ok: true, selection: sel });
  }

  if (action === "remove") {
    const existing = await db.vendorSelection.findUnique({
      where: { coupleId_proId: { coupleId: session.sub, proId } },
    });
    if (!existing) return NextResponse.json({ ok: true });

    // Supprimer aussi le budget lié si existant
    if (existing.budgetEntryId) {
      await db.manualVendorEntry.delete({ where: { id: existing.budgetEntryId } }).catch(() => {});
    }
    await db.vendorSelection.delete({ where: { coupleId_proId: { coupleId: session.sub, proId } } });
    return NextResponse.json({ ok: true });
  }

  if (action === "confirm") {
    await db.vendorSelection.update({
      where: { coupleId_proId: { coupleId: session.sub, proId } },
      data:  { status: "confirmed", confirmedAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "unconfirm") {
    const existing = await db.vendorSelection.findUnique({
      where: { coupleId_proId: { coupleId: session.sub, proId } },
    });
    if (existing?.budgetEntryId) {
      await db.manualVendorEntry.delete({ where: { id: existing.budgetEntryId } }).catch(() => {});
    }
    await db.vendorSelection.update({
      where: { coupleId_proId: { coupleId: session.sub, proId } },
      data:  { status: "selection", confirmedAt: null, budgetEntryId: null },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
}

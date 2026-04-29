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
  return NextResponse.json(entry, { status: 201 });
}

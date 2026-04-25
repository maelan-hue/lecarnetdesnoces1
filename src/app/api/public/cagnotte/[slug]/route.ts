import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

type P = { params: Promise<{ slug: string }> };

export async function GET(_req: NextRequest, { params }: P) {
  const { slug } = await params;

  const cagnotte = await db.cagnotte.findUnique({
    where:   { slug },
    include: {
      dreams:  { orderBy: { sortOrder: "asc" } },
      program: { orderBy: { sortOrder: "asc" } },
      donations: {
        where:  { status: "PAID" },
        select: {
          id: true, donorName: true, isAnonymous: true,
          message: true, amountNet: true, paidAt: true,
          dream: { select: { title: true } },
        },
        orderBy: { paidAt: "desc" },
      },
    },
  });

  if (!cagnotte) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  if (cagnotte.status !== "ACTIVE") return NextResponse.json({ error: "Cette cagnotte n'est pas disponible." }, { status: 403 });

  // Stats
  const totalCollected   = cagnotte.donations.reduce((s, d) => s + d.amountNet, 0);
  const totalParticipants = cagnotte.donations.length;

  // Compter dons par rêve
  const dreamCounts: Record<string, number> = {};
  for (const d of cagnotte.donations) {
    const key = d.dream?.title ?? "Peu importe";
    dreamCounts[key] = (dreamCounts[key] ?? 0) + 1;
  }

  return NextResponse.json({
    ...cagnotte,
    totalCollected,
    totalParticipants,
    dreamCounts,
    // Ne pas exposer l'IBAN ni le coupleId
    ibanStored: undefined,
    coupleId:   undefined,
  });
}

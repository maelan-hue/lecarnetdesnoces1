import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "couple") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const category  = searchParams.get("category") ?? undefined;
  const ambiance  = searchParams.get("ambiance") ?? undefined;
  const date      = searchParams.get("date") ?? undefined;

  // Trouver les pros indisponibles à la date demandée
  let unavailableIds: string[] = [];
  if (date) {
    const day = new Date(date);
    const unavail = await db.proAvailability.findMany({
      where: { date: day, status: "UNAVAILABLE" },
      select: { proId: true },
    });
    unavailableIds = unavail.map((u) => u.proId);
  }

  const pros = await db.pro.findMany({
    where: {
      status: "ACTIVE",
      ...(category ? { category: category as never } : {}),
      ...(ambiance  ? { ambiances: { has: ambiance } } : {}),
      ...(unavailableIds.length > 0 ? { id: { notIn: unavailableIds } } : {}),
    },
    select: {
      id: true, slug: true, name: true, tagline: true,
      category: true, ambiances: true, city: true,
      department: true, portfolioPhotos: true,
      tarifs: { orderBy: { position: "asc" }, take: 1, select: { priceFrom: true } },
      availability: date
        ? { where: { date: new Date(date) }, select: { status: true } }
        : false,
    },
    orderBy: { name: "asc" },
  });

  // Incrémenter vues de fiche (comptage global)
  const ids = pros.map((p) => p.id);
  if (ids.length > 0) {
    await db.proStats.updateMany({
      where: { proId: { in: ids } },
      data:  { profileViews: { increment: 1 } },
    });
  }

  return NextResponse.json(pros);
}

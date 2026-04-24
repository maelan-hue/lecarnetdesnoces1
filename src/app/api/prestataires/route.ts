import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "couple") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const category = searchParams.get("category") ?? undefined;
  const ambiance = searchParams.get("ambiance") ?? undefined;
  const date     = searchParams.get("date") ?? undefined;

  const pros = await db.pro.findMany({
    where: {
      status: "ACTIVE",
      ...(category ? { category: category as never } : {}),
      ...(ambiance  ? { ambiances: { has: ambiance } } : {}),
    },
    select: {
      id: true, slug: true, name: true, tagline: true,
      category: true, ambiances: true, city: true,
      department: true, portfolioPhotos: true, profilePhoto: true,
      calendarActive: true,
      tarifs: { orderBy: { position: "asc" }, take: 1, select: { priceFrom: true } },
      availability: date
        ? { where: { date: new Date(date) }, select: { status: true } }
        : false,
    },
    orderBy: { name: "asc" },
  });

  // Trier : disponibles en tête, indisponibles en fin
  const sorted = [...pros].sort((a, b) => {
    const statusScore = (p: typeof pros[0]) => {
      if (!p.calendarActive) return 1; // À contacter
      const s = (p.availability as { status: string }[] | false);
      if (!s || !Array.isArray(s) || s.length === 0) return 1;
      if (s[0].status === "AVAILABLE")   return 0;
      if (s[0].status === "UNAVAILABLE") return 2;
      return 1;
    };
    return statusScore(a) - statusScore(b);
  });

  // Incrémenter vues de fiche (silencieux)
  const ids = pros.map((p) => p.id);
  if (ids.length > 0) {
    db.proStats.updateMany({
      where: { proId: { in: ids } },
      data:  { profileViews: { increment: 1 } },
    }).catch(() => {});
  }

  return NextResponse.json(sorted);
}

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { AvailabilityStatus } from "@prisma/client";

// GET — disponibilités + statut du calendrier
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "pro") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const pro    = await db.pro.findUnique({ where: { id: session.sub }, select: { calendarActive: true } });
  const avails = await db.proAvailability.findMany({ where: { proId: session.sub }, orderBy: { date: "asc" } });

  return NextResponse.json({ calendarActive: pro?.calendarActive ?? false, avails });
}

// POST — upsert un jour ou toggle le calendrier
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "pro") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();

  // Toggle activation du calendrier
  if ("calendarActive" in body) {
    const pro = await db.pro.update({
      where: { id: session.sub },
      data:  { calendarActive: Boolean(body.calendarActive) },
      select: { calendarActive: true },
    });
    return NextResponse.json(pro);
  }

  // Upsert statut d'un jour
  const { date, status } = body;
  if (!date) return NextResponse.json({ error: "Date requise." }, { status: 400 });

  if (!status) {
    // Supprimer le statut (→ "À contacter")
    await db.proAvailability.deleteMany({
      where: { proId: session.sub, date: new Date(date) },
    });
    return NextResponse.json({ deleted: true });
  }

  const avail = await db.proAvailability.upsert({
    where:  { proId_date: { proId: session.sub, date: new Date(date) } },
    update: { status: status as AvailabilityStatus },
    create: { proId: session.sub, date: new Date(date), status: status as AvailabilityStatus },
  });
  return NextResponse.json(avail);
}

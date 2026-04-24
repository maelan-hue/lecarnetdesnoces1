import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { AvailabilityStatus } from "@prisma/client";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "pro") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const avails = await db.proAvailability.findMany({ where: { proId: session.sub }, orderBy: { date: "asc" } });
  return NextResponse.json(avails);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "pro") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { date, status } = await req.json();
  if (!date || !status) return NextResponse.json({ error: "Date et statut requis." }, { status: 400 });

  const avail = await db.proAvailability.upsert({
    where: { proId_date: { proId: session.sub, date: new Date(date) } },
    update: { status: status as AvailabilityStatus },
    create: { proId: session.sub, date: new Date(date), status: status as AvailabilityStatus },
  });
  return NextResponse.json(avail);
}

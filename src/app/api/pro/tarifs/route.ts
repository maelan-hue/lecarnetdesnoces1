import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "pro") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const tarifs = await db.proTarif.findMany({
    where:   { proId: session.sub },
    orderBy: { position: "asc" },
  });
  return NextResponse.json(tarifs);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "pro") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { name, description, priceFrom } = await req.json();
  if (!name?.trim() || !priceFrom) return NextResponse.json({ error: "Nom et prix requis." }, { status: 400 });

  const count  = await db.proTarif.count({ where: { proId: session.sub } });
  const tarif  = await db.proTarif.create({
    data: { proId: session.sub, name: name.trim(), description: description?.trim() || null, priceFrom: Number(priceFrom), position: count },
  });
  return NextResponse.json(tarif, { status: 201 });
}

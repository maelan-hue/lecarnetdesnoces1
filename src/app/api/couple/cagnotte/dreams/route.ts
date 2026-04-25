import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

async function getCagnotte(coupleId: string) {
  return db.cagnotte.findUnique({ where: { coupleId } });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "couple") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const cagnotte = await getCagnotte(session.sub);
  if (!cagnotte) return NextResponse.json({ error: "Cagnotte introuvable" }, { status: 404 });

  const count = await db.cagnotteDream.count({ where: { cagnotteId: cagnotte.id } });
  if (count >= 5) return NextResponse.json({ error: "Maximum 5 rêves." }, { status: 400 });

  const body  = await req.json().catch(() => ({}));
  const dream = await db.cagnotteDream.create({
    data: { cagnotteId: cagnotte.id, title: body.title?.trim() || "Nouveau rêve", description: body.description?.trim() || null, sortOrder: count },
  });
  return NextResponse.json(dream, { status: 201 });
}

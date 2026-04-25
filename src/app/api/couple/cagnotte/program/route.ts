import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "couple") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const cagnotte = await db.cagnotte.findUnique({ where: { coupleId: session.sub } });
  if (!cagnotte) return NextResponse.json({ error: "Cagnotte introuvable" }, { status: 404 });

  const count = await db.cagnotteProgram.count({ where: { cagnotteId: cagnotte.id } });
  const body  = await req.json().catch(() => ({}));

  const row = await db.cagnotteProgram.create({
    data: {
      cagnotteId:  cagnotte.id,
      timeLabel:   body.timeLabel?.trim()   ?? "",
      description: body.description?.trim() ?? "",
      sortOrder:   count,
    },
  });
  return NextResponse.json(row, { status: 201 });
}

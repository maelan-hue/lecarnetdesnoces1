import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

type P = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: P) {
  const session = await getSession();
  if (!session || session.role !== "couple") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  const cagnotte = await db.cagnotte.findUnique({ where: { coupleId: session.sub } });
  const row = cagnotte ? await db.cagnotteProgram.findFirst({ where: { id, cagnotteId: cagnotte.id } }) : null;
  if (!row) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  const { timeLabel, description } = await req.json();
  return NextResponse.json(await db.cagnotteProgram.update({ where: { id }, data: { timeLabel: timeLabel?.trim(), description: description?.trim() } }));
}

export async function DELETE(_req: NextRequest, { params }: P) {
  const session = await getSession();
  if (!session || session.role !== "couple") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  const cagnotte = await db.cagnotte.findUnique({ where: { coupleId: session.sub } });
  const row = cagnotte ? await db.cagnotteProgram.findFirst({ where: { id, cagnotteId: cagnotte.id } }) : null;
  if (!row) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  await db.cagnotteProgram.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

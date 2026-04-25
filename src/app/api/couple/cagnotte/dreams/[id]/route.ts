import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

type P = { params: Promise<{ id: string }> };

async function checkOwnership(coupleId: string, dreamId: string) {
  const cagnotte = await db.cagnotte.findUnique({ where: { coupleId } });
  if (!cagnotte) return null;
  return db.cagnotteDream.findFirst({ where: { id: dreamId, cagnotteId: cagnotte.id } });
}

export async function PATCH(req: NextRequest, { params }: P) {
  const session = await getSession();
  if (!session || session.role !== "couple") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  const dream = await checkOwnership(session.sub, id);
  if (!dream) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  const { title, description } = await req.json();
  const updated = await db.cagnotteDream.update({ where: { id }, data: { title: title?.trim(), description: description?.trim() || null } });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: P) {
  const session = await getSession();
  if (!session || session.role !== "couple") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  const dream = await checkOwnership(session.sub, id);
  if (!dream) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  await db.cagnotteDream.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

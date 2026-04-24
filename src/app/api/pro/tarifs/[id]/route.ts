import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

type P = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: P) {
  const session = await getSession();
  if (!session || session.role !== "pro") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id }  = await params;
  const tarif   = await db.proTarif.findUnique({ where: { id } });
  if (!tarif || tarif.proId !== session.sub) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const { name, description, priceFrom } = await req.json();
  const updated = await db.proTarif.update({
    where: { id },
    data:  { name: name?.trim(), description: description?.trim() || null, priceFrom: priceFrom ? Number(priceFrom) : undefined },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: P) {
  const session = await getSession();
  if (!session || session.role !== "pro") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id }  = await params;
  const tarif   = await db.proTarif.findUnique({ where: { id } });
  if (!tarif || tarif.proId !== session.sub) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  await db.proTarif.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

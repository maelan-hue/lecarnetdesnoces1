import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "couple") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const guest = await db.guest.findUnique({ where: { id } });
  if (!guest || guest.coupleId !== session.sub) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  await db.guest.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "couple") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const guest = await db.guest.findUnique({ where: { id } });
  if (!guest || guest.coupleId !== session.sub) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const data = await req.json();
  const updated = await db.guest.update({ where: { id }, data });
  return NextResponse.json(updated);
}

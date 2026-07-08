import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

type P = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: P) {
  const session = await getSession();
  if (!session || session.role !== "couple") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const task = await db.coupleTask.findFirst({ where: { id, coupleId: session.sub } });
  if (!task) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const { done } = await req.json();
  const updated = await db.coupleTask.update({
    where: { id },
    data: { status: done ? "DONE" : "TODO" },
  });

  return NextResponse.json(updated);
}

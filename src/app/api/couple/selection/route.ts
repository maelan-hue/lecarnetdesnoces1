import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "couple") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const selections = await db.coupleProSelection.findMany({
    where:   { coupleId: session.sub },
    include: {
      pro: {
        select: {
          id: true, name: true, slug: true, category: true,
          tagline: true, city: true, profilePhoto: true,
          tarifs: { orderBy: { position: "asc" }, take: 1, select: { priceFrom: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(selections);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "couple") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { proId } = await req.json();
  if (!proId) return NextResponse.json({ error: "proId requis." }, { status: 400 });

  const sel = await db.coupleProSelection.upsert({
    where:  { coupleId_proId: { coupleId: session.sub, proId } },
    update: {},
    create: { coupleId: session.sub, proId },
  });
  return NextResponse.json(sel, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "couple") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { proId } = await req.json();
  await db.coupleProSelection.deleteMany({
    where: { coupleId: session.sub, proId },
  });
  return NextResponse.json({ ok: true });
}

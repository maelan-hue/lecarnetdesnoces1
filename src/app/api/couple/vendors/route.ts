import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { VendorRelationStatus } from "@prisma/client";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "couple") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const relations = await db.vendorRelation.findMany({
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
  return NextResponse.json(relations);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "couple") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { proId, category, action } = await req.json();
  if (!proId || !category || !action) return NextResponse.json({ error: "Paramètres manquants." }, { status: 400 });

  if (action === "remove") {
    await db.vendorRelation.deleteMany({ where: { coupleId: session.sub, proId } });
    return NextResponse.json({ ok: true, action: "removed" });
  }

  if (action === "favorite") {
    // Vérifier la limite de 5 favoris (status FAVORITE) par catégorie
    const existing = await db.vendorRelation.findUnique({ where: { coupleId_proId: { coupleId: session.sub, proId } } });
    if (!existing) {
      const count = await db.vendorRelation.count({
        where: { coupleId: session.sub, category, status: "FAVORITE" },
      });
      if (count >= 5) {
        return NextResponse.json({ error: "Maximum 5 favoris par catégorie atteint." }, { status: 400 });
      }
    }
    const rel = await db.vendorRelation.upsert({
      where:  { coupleId_proId: { coupleId: session.sub, proId } },
      update: { status: "FAVORITE", category },
      create: { coupleId: session.sub, proId, status: "FAVORITE", category },
    });
    return NextResponse.json({ ok: true, action: "favorited", relation: rel });
  }

  if (action === "retain") {
    // Repasser l'éventuel retenu existant en favori
    const previousRetained = await db.vendorRelation.findFirst({
      where: { coupleId: session.sub, category, status: "RETAINED" },
    });
    await db.$transaction(async (tx) => {
      if (previousRetained && previousRetained.proId !== proId) {
        await tx.vendorRelation.update({
          where: { id: previousRetained.id },
          data:  { status: "FAVORITE" },
        });
      }
      await tx.vendorRelation.upsert({
        where:  { coupleId_proId: { coupleId: session.sub, proId } },
        update: { status: "RETAINED", category },
        create: { coupleId: session.sub, proId, status: "RETAINED", category },
      });
    });
    return NextResponse.json({ ok: true, action: "retained" });
  }

  return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
}

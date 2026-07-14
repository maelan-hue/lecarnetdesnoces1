import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProCategory } from "@prisma/client";

type P = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: P) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const pro = await db.pro.findUnique({
    where: { id },
    select: {
      id: true, name: true, email: true, phone: true, category: true,
      city: true, department: true, tagline: true, bio: true, status: true,
      tarifs: { select: { id: true, priceFrom: true }, orderBy: { position: "asc" } },
    },
  });
  if (!pro) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json(pro);
}

export async function PATCH(req: NextRequest, { params }: P) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const pro = await db.pro.findUnique({ where: { id }, select: { id: true, tarifs: { select: { id: true } } } });
  if (!pro) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const body = await req.json();
  const { name, email, phone, category, city, department, tagline, bio, priceFrom } = body;

  if (!name?.trim() || !email?.trim() || !category) {
    return NextResponse.json({ error: "Nom, email et catégorie obligatoires." }, { status: 400 });
  }
  if (!Object.values(ProCategory).includes(category as ProCategory)) {
    return NextResponse.json({ error: "Catégorie invalide." }, { status: 400 });
  }

  const emailLower = email.trim().toLowerCase();
  const emailOwner = await db.pro.findUnique({ where: { email: emailLower }, select: { id: true } });
  if (emailOwner && emailOwner.id !== id) {
    return NextResponse.json({ error: "Un autre compte utilise déjà cet email." }, { status: 409 });
  }

  const updated = await db.pro.update({
    where: { id },
    data: {
      name: name.trim(),
      email: emailLower,
      phone: phone?.trim() || null,
      category: category as ProCategory,
      city: city?.trim() || null,
      department: department?.trim() || null,
      tagline: tagline?.trim() || null,
      bio: bio?.trim() || null,
    },
  });

  // Tarif de base : uniquement géré ici quand le prestataire a 0 ou 1 tarif
  // (au-delà, la tarification détaillée se gère depuis l'espace prestataire)
  if (pro.tarifs.length <= 1 && priceFrom !== undefined) {
    const price = Number(priceFrom);
    if (pro.tarifs.length === 1) {
      if (price > 0) {
        await db.proTarif.update({ where: { id: pro.tarifs[0].id }, data: { priceFrom: Math.round(price) } });
      } else {
        await db.proTarif.delete({ where: { id: pro.tarifs[0].id } });
      }
    } else if (price > 0) {
      await db.proTarif.create({ data: { proId: id, name: "Tarif de base", priceFrom: Math.round(price) } });
    }
  }

  return NextResponse.json(updated);
}

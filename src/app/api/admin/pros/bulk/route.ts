import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { slugify, generatePassword } from "@/lib/utils";
import { ProCategory } from "@prisma/client";

type BulkProInput = {
  name: string; city?: string; department?: string;
  phone?: string; email?: string; tagline?: string; bio?: string; priceFrom?: number;
};

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { pros, category } = await req.json() as { pros: BulkProInput[]; category: string };
  if (!Array.isArray(pros) || pros.length === 0) {
    return NextResponse.json({ error: "Aucun prestataire à importer." }, { status: 400 });
  }
  if (!category || !Object.values(ProCategory).includes(category as ProCategory)) {
    return NextResponse.json({ error: "Catégorie invalide." }, { status: 400 });
  }

  const valid = pros.filter((p) => p.name?.trim());
  if (valid.length === 0) {
    return NextResponse.json({ error: "Aucun prestataire valide (nom requis)." }, { status: 400 });
  }

  const usedSlugs  = new Set<string>();
  const usedEmails = new Set<string>();
  let count = 0;

  for (let i = 0; i < valid.length; i++) {
    const p = valid[i];

    const base = slugify(p.name) || `prestataire-${i}`;
    let slug = base;
    if (usedSlugs.has(slug) || await db.pro.findUnique({ where: { slug }, select: { id: true } })) {
      slug = `${base}-${Date.now()}-${i}`;
    }
    usedSlugs.add(slug);

    let email = p.email?.trim().toLowerCase();
    if (!email) email = `${slug}@sans-email.lecarnetdesnoces.fr`;
    if (usedEmails.has(email) || await db.pro.findUnique({ where: { email }, select: { id: true } })) {
      continue; // doublon d'email : on saute cette ligne plutôt que de faire échouer tout le lot
    }
    usedEmails.add(email);

    const hashed = await bcrypt.hash(generatePassword(), 12);

    const pro = await db.pro.create({
      data: {
        email, password: hashed,
        phone:      p.phone?.trim() || null,
        name:       p.name.trim(),
        slug,
        category:   category as ProCategory,
        city:       p.city?.trim() || null,
        department: p.department?.trim() || null,
        tagline:    p.tagline?.trim() || null,
        bio:        p.bio?.trim() || null,
        status:     "ACTIVE",
        validatedAt: new Date(),
        ambiances: [], styleKeywords: [], portfolioPhotos: [],
      },
    });

    await db.proStats.create({ data: { proId: pro.id } });

    if (p.priceFrom && p.priceFrom > 0) {
      await db.proTarif.create({ data: { proId: pro.id, name: "Tarif de base", priceFrom: Math.round(p.priceFrom) } });
    }

    count++;
  }

  return NextResponse.json({ count }, { status: 201 });
}

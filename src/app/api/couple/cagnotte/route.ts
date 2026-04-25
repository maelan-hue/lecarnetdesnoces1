import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "couple") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const cagnotte = await db.cagnotte.findUnique({
    where:   { coupleId: session.sub },
    include: {
      dreams:  { orderBy: { sortOrder: "asc" } },
      program: { orderBy: { sortOrder: "asc" } },
    },
  });
  return NextResponse.json(cagnotte);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "couple") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const existing = await db.cagnotte.findUnique({ where: { coupleId: session.sub } });
  if (existing) return NextResponse.json(existing);

  const couple = await db.couple.findUnique({ where: { id: session.sub }, select: { prenoms: true, weddingDate: true } });
  if (!couple) return NextResponse.json({ error: "Couple introuvable" }, { status: 404 });

  // Slug auto depuis les prénoms + année
  const year     = couple.weddingDate ? new Date(couple.weddingDate).getFullYear() : new Date().getFullYear();
  const baseSlug = slugify(`${couple.prenoms} ${year}`);
  let slug       = baseSlug;
  let i          = 1;
  while (await db.cagnotte.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${i++}`;
  }

  const cagnotte = await db.cagnotte.create({
    data: { coupleId: session.sub, slug, title: "", status: "DRAFT" },
    include: { dreams: true, program: true },
  });
  return NextResponse.json(cagnotte, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "couple") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const allowed = ["title","subtitle","story","photoUrl","slug","showGuestbook","allowAnonymous","emailOnDonation","emailWeeklyRecap","ibanStored"];
  const body    = await req.json();
  const data    = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)));

  // Vérifier unicité du slug si changé
  if (data.slug) {
    const slugStr = slugify(data.slug as string);
    const conflict = await db.cagnotte.findFirst({ where: { slug: slugStr, coupleId: { not: session.sub } } });
    if (conflict) return NextResponse.json({ error: "Cette URL est déjà utilisée." }, { status: 409 });
    data.slug = slugStr;
  }

  const cagnotte = await db.cagnotte.update({ where: { coupleId: session.sub }, data });
  return NextResponse.json(cagnotte);
}

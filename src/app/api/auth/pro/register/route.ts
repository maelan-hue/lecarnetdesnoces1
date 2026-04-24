import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { slugify, generatePassword } from "@/lib/utils";
import { ProCategory } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const { name, category, email, password, phone, department } = await req.json();
    if (!name?.trim() || !category || !email?.trim() || !password) {
      return NextResponse.json({ error: "Champs obligatoires manquants." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Mot de passe trop court (8 caractères min)." }, { status: 400 });
    }

    const existing = await db.pro.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) return NextResponse.json({ error: "Un compte existe déjà avec cet email." }, { status: 409 });

    // Générer un slug unique
    let slug = slugify(name);
    const slugExists = await db.pro.findUnique({ where: { slug } });
    if (slugExists) slug = `${slug}-${Date.now()}`;

    const hashed = await bcrypt.hash(password, 12);

    await db.pro.create({
      data: {
        email:      email.toLowerCase().trim(),
        password:   hashed,
        phone:      phone?.trim() || null,
        name:       name.trim(),
        slug,
        category:   category as ProCategory,
        department: department?.trim() || null,
        status:     "PENDING",
        ambiances:  [],
        styleKeywords: [],
        portfolioPhotos: [],
      },
    });

    return NextResponse.json({ ok: true, message: "Votre demande d'inscription a bien été reçue. Vous recevrez vos accès par email après validation." });
  } catch (err) {
    console.error("[register/pro]", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

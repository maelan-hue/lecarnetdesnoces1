import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signToken, setSessionCookie } from "@/lib/auth";
import { generateWeddingTasks } from "@/lib/tasks";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prenoms, email, password, weddingDate, weddingSeason, weddingCity,
            guestCount, ambiances, budgetEstimate, planningStage } = body;

    if (!email || !password || !prenoms) {
      return NextResponse.json({ error: "Champs obligatoires manquants." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Le mot de passe doit faire au moins 8 caractères." }, { status: 400 });
    }

    const existing = await db.couple.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: "Un compte existe déjà avec cet email." }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);

    const couple = await db.couple.create({
      data: {
        email: email.toLowerCase().trim(),
        password: hashed,
        prenoms: prenoms.trim(),
        weddingDate: weddingDate ? new Date(weddingDate) : null,
        weddingCity: weddingCity?.trim() || null,
        guestCount: guestCount ? Number(guestCount) : null,
        ambiances: ambiances ?? [],
        budgetEstimate: budgetEstimate ? Number(budgetEstimate) : null,
        planningStage: planningStage || null,
        onboardingDone: true,
      },
    });

    // Générer les tâches du carnet selon le profil
    await generateWeddingTasks(couple.id, {
      weddingDate: couple.weddingDate,
      guestCount: couple.guestCount,
      ambiances: couple.ambiances,
      planningStage: couple.planningStage,
    });

    const token = await signToken({ sub: couple.id, role: "couple", email: couple.email });
    const cookie = setSessionCookie(token);

    const res = NextResponse.json({ ok: true });
    res.cookies.set(cookie);
    return res;
  } catch (err) {
    console.error("[register/couple]", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signToken, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ error: "Champs requis." }, { status: 400 });

    const pro = await db.pro.findUnique({ where: { email: email.toLowerCase() } });
    if (!pro) return NextResponse.json({ error: "Email ou mot de passe incorrect." }, { status: 401 });
    if (pro.status === "PENDING") return NextResponse.json({ error: "Votre compte est en attente de validation. Vous recevrez un email dès qu'il sera activé." }, { status: 403 });
    if (pro.status === "SUSPENDED") return NextResponse.json({ error: "Votre compte est suspendu. Contactez-nous." }, { status: 403 });

    const valid = await bcrypt.compare(password, pro.password);
    if (!valid) return NextResponse.json({ error: "Email ou mot de passe incorrect." }, { status: 401 });

    const token = await signToken({ sub: pro.id, role: "pro", email: pro.email });
    const res   = NextResponse.json({ ok: true });
    res.cookies.set(setSessionCookie(token));
    return res;
  } catch (err) {
    console.error("[login/pro]", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

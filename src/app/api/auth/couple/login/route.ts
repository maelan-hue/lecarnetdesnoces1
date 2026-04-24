import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signToken, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email et mot de passe requis." }, { status: 400 });
    }

    const couple = await db.couple.findUnique({ where: { email: email.toLowerCase() } });
    if (!couple) {
      return NextResponse.json({ error: "Email ou mot de passe incorrect." }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, couple.password);
    if (!valid) {
      return NextResponse.json({ error: "Email ou mot de passe incorrect." }, { status: 401 });
    }

    const token = await signToken({ sub: couple.id, role: "couple", email: couple.email });
    const cookie = setSessionCookie(token);

    const res = NextResponse.json({ ok: true });
    res.cookies.set(cookie);
    return res;
  } catch (err) {
    console.error("[login/couple]", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

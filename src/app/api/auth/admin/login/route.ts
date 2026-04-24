import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signToken, setSessionCookie } from "@/lib/auth";

// Accès admin unique — identifiants définis dans les variables d'env
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    ?? "admin@lecarnetdesnoces.fr";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "changeme";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Identifiants incorrects." }, { status: 401 });
  }

  // Si un vrai hash existe en base, on compare — sinon comparaison directe pour le démarrage
  let admin = await db.admin.findUnique({ where: { email } });
  if (!admin) {
    // Créer l'admin au premier login
    const hashed = await bcrypt.hash(ADMIN_PASSWORD, 12);
    admin = await db.admin.create({ data: { email, password: hashed } });
  }

  const valid = await bcrypt.compare(password, admin.password);
  if (!valid) return NextResponse.json({ error: "Identifiants incorrects." }, { status: 401 });

  const token = await signToken({ sub: admin.id, role: "admin", email: admin.email });
  const res   = NextResponse.json({ ok: true });
  res.cookies.set(setSessionCookie(token));
  return res;
}

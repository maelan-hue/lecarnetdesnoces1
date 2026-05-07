import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 heure

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email requis." }, { status: 400 });
  }

  const normalized = email.trim().toLowerCase();

  const couple = await db.couple.findUnique({ where: { email: normalized }, select: { id: true } });
  const pro    = !couple ? await db.pro.findUnique({ where: { email: normalized }, select: { id: true } }) : null;

  // Réponse identique que le compte existe ou non (sécurité — pas d'énumération)
  if (!couple && !pro) {
    return NextResponse.json({ ok: true });
  }

  const role = couple ? "couple" : "pro";

  // Invalider les tokens précédents pour cet email
  await db.passwordResetToken.deleteMany({ where: { email: normalized } });

  const token = crypto.randomBytes(32).toString("hex");
  await db.passwordResetToken.create({
    data: {
      token,
      email: normalized,
      role,
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });

  const resetUrl = `${APP_URL}/reinitialiser-mot-de-passe?token=${token}`;
  await sendPasswordResetEmail({ to: normalized, resetUrl });

  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { token, password } = await req.json();

  if (!token || !password || password.length < 8) {
    return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  }

  const record = await db.passwordResetToken.findUnique({ where: { token } });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return NextResponse.json({ error: "Ce lien est invalide ou expiré." }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 12);

  if (record.role === "couple") {
    await db.couple.update({ where: { email: record.email }, data: { password: hashed } });
  } else {
    await db.pro.update({ where: { email: record.email }, data: { password: hashed } });
  }

  await db.passwordResetToken.update({ where: { token }, data: { usedAt: new Date() } });

  return NextResponse.json({ ok: true });
}

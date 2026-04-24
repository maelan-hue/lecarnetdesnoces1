import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "pro") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const pro = await db.pro.findUnique({
    where:  { id: session.sub },
    select: { name: true, email: true, phone: true },
  });
  return NextResponse.json(pro);
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "pro") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { name, email, phone, currentPassword, newPassword } = await req.json();
  const pro = await db.pro.findUnique({ where: { id: session.sub } });
  if (!pro) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const data: Record<string, unknown> = {};

  if (name?.trim()) data.name = name.trim();
  if (phone !== undefined) data.phone = phone?.trim() || null;

  if (email?.trim() && email.toLowerCase() !== pro.email) {
    const exists = await db.pro.findUnique({ where: { email: email.toLowerCase() } });
    if (exists) return NextResponse.json({ error: "Cet email est déjà utilisé." }, { status: 409 });
    data.email = email.toLowerCase().trim();
  }

  if (newPassword) {
    if (!currentPassword) return NextResponse.json({ error: "Mot de passe actuel requis." }, { status: 400 });
    const valid = await bcrypt.compare(currentPassword, pro.password);
    if (!valid) return NextResponse.json({ error: "Mot de passe actuel incorrect." }, { status: 401 });
    if (newPassword.length < 8) return NextResponse.json({ error: "Le nouveau mot de passe doit faire au moins 8 caractères." }, { status: 400 });
    data.password = await bcrypt.hash(newPassword, 12);
  }

  if (Object.keys(data).length === 0) return NextResponse.json({ error: "Aucune modification." }, { status: 400 });

  await db.pro.update({ where: { id: session.sub }, data });
  return NextResponse.json({ ok: true });
}

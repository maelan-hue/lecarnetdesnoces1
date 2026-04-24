import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { generatePassword } from "@/lib/utils";
import { sendCredentialsEmail } from "@/lib/email";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const pros = await db.pro.findMany({
    orderBy: { createdAt: "desc" },
    select: { id:true, name:true, email:true, category:true, department:true, status:true, createdAt:true },
  });
  return NextResponse.json(pros);
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id, action } = await req.json();
  if (!id || !action) return NextResponse.json({ error: "Paramètres manquants." }, { status: 400 });

  if (action === "validate") {
    const tmpPassword = generatePassword();
    const hashed      = await bcrypt.hash(tmpPassword, 12);

    const pro = await db.pro.update({
      where: { id },
      data: { status: "ACTIVE", password: hashed, validatedAt: new Date() },
    });

    await db.proStats.upsert({
      where:  { proId: id },
      update: {},
      create: { proId: id },
    });

    // Tentative d'envoi email — peut échouer en dev
    let emailSent = false;
    try {
      await sendCredentialsEmail({ to: pro.email, name: pro.name, password: tmpPassword });
      emailSent = true;
    } catch (e) {
      console.error("Email credentials failed:", e);
    }

    // Le mot de passe temporaire est toujours retourné pour affichage admin
    return NextResponse.json({
      ok: true,
      proName:   pro.name,
      proEmail:  pro.email,
      tmpPassword,
      emailSent,
    });
  }

  if (action === "suspend") {
    await db.pro.update({ where: { id }, data: { status: "SUSPENDED" } });
    return NextResponse.json({ ok: true });
  }

  if (action === "delete") {
    await db.pro.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
}

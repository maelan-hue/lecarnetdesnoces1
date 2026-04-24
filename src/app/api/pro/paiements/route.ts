import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { computeAmounts } from "@/lib/stripe";
import { sendPaymentLinkEmail } from "@/lib/email";
import { PaymentLinkType } from "@prisma/client";
import { randomBytes } from "crypto";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "pro") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const links = await db.paymentLink.findMany({
    where:   { proId: session.sub },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(links);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "pro") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const pro = await db.pro.findUnique({ where: { id: session.sub } });
  if (!pro) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  if (!pro.stripeOnboarded) return NextResponse.json({ error: "Complétez d'abord votre configuration Stripe dans Compte bancaire." }, { status: 400 });

  const { coupleEmail, coupleName, label, type, quoteTotal, depositPct, message } = await req.json();

  if (!coupleEmail || !coupleName || !label || !type || !quoteTotal) {
    return NextResponse.json({ error: "Champs obligatoires manquants." }, { status: 400 });
  }

  // Calcul des montants (en centimes)
  const quoteCents   = Math.round(Number(quoteTotal) * 100);
  const pct          = type === "SOLDE" ? 100 : type === "UNIQUE" ? 100 : Number(depositPct ?? 30);
  const amountCents  = Math.round(quoteCents * pct / 100);
  const { commission, amountTotal, amountNet } = computeAmounts(amountCents);

  const id        = randomBytes(6).toString("hex"); // 12 caractères hex
  const expiresAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000); // 15 jours

  const link = await db.paymentLink.create({
    data: {
      id,
      proId:       session.sub,
      coupleEmail: coupleEmail.toLowerCase().trim(),
      coupleName:  coupleName.trim(),
      label:       label.trim(),
      type:        type as PaymentLinkType,
      quoteTotal:  quoteCents,
      amount:      amountCents,
      amountTotal,
      message:     message?.trim() || null,
      expiresAt,
    },
  });

  const paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payer/${id}`;

  // Email au couple
  try {
    await sendPaymentLinkEmail({
      to:         coupleEmail,
      coupleName: coupleName,
      proName:    pro.name,
      label,
      amount:     (amountTotal / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " €",
      paymentUrl,
      message:    message?.trim(),
    });
  } catch (e) {
    console.error("Email payment link failed:", e);
  }

  return NextResponse.json({ ok: true, id, paymentUrl }, { status: 201 });
}

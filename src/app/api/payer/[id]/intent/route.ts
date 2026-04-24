import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";

type P = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: P) {
  const { id } = await params;

  const link = await db.paymentLink.findUnique({
    where:   { id },
    include: { pro: { select: { stripeAccountId: true, name: true } } },
  });

  if (!link) return NextResponse.json({ error: "Lien introuvable." }, { status: 404 });
  if (link.status !== "PENDING") return NextResponse.json({ error: "Ce lien a déjà été utilisé ou a expiré." }, { status: 400 });
  if (new Date() > link.expiresAt) {
    await db.paymentLink.update({ where: { id }, data: { status: "EXPIRED" } });
    return NextResponse.json({ error: "Ce lien de paiement a expiré." }, { status: 400 });
  }
  if (!link.pro.stripeAccountId) {
    return NextResponse.json({ error: "Configuration prestataire incomplète." }, { status: 400 });
  }

  // Réutiliser un intent existant ou en créer un nouveau
  if (link.stripePaymentIntentId) {
    const existing = await stripe.paymentIntents.retrieve(link.stripePaymentIntentId);
    if (existing.status === "requires_payment_method" || existing.status === "requires_confirmation") {
      return NextResponse.json({ clientSecret: existing.client_secret });
    }
  }

  const intent = await stripe.paymentIntents.create({
    amount:   link.amountTotal,
    currency: "eur",
    application_fee_amount: link.amountTotal - link.amount, // commission 3%
    transfer_data: { destination: link.pro.stripeAccountId },
    metadata: { paymentLinkId: id, coupleName: link.coupleName, proName: link.pro.name },
    description: link.label,
  });

  await db.paymentLink.update({
    where: { id },
    data:  { stripePaymentIntentId: intent.id },
  });

  return NextResponse.json({ clientSecret: intent.client_secret });
}

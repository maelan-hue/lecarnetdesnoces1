import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { sendPaymentReceiptEmail } from "@/lib/email";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body      = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) return NextResponse.json({ error: "Signature manquante" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Webhook invalide" }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as Stripe.PaymentIntent;
    const linkId  = intent.metadata?.paymentLinkId;
    if (!linkId) return NextResponse.json({ ok: true });

    const link = await db.paymentLink.findUnique({
      where:   { id: linkId },
      include: { pro: { select: { id: true, name: true } } },
    });
    if (!link || link.status === "PAID") return NextResponse.json({ ok: true });

    const stripeFee   = Math.round(intent.amount * 0.014) + 25;
    const commission  = link.amountTotal - link.amount;
    const amountNet   = link.amount - stripeFee;

    await db.$transaction([
      db.paymentLink.update({
        where: { id: linkId },
        data:  { status: "PAID", paidAt: new Date(), stripePaymentIntentId: intent.id },
      }),
      db.payment.create({
        data: {
          paymentLinkId:        linkId,
          proId:                link.proId,
          amount:               link.amountTotal,
          amountNet,
          commission,
          stripeFee,
          currency:             "eur",
          type:                 "PLATFORM",
          status:               "PAID",
          label:                link.label,
          stripePaymentIntentId: intent.id,
        },
      }),
    ]);

    // Email reçu au couple
    try {
      await sendPaymentReceiptEmail({
        to:          link.coupleEmail,
        coupleName:  link.coupleName,
        proName:     link.pro.name,
        label:       link.label,
        amount:      (link.amountTotal / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " €",
        reference:   intent.id.slice(-8).toUpperCase(),
        dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/carnet`,
      });
    } catch (e) {
      console.error("Receipt email failed:", e);
    }
  }

  return NextResponse.json({ ok: true });
}

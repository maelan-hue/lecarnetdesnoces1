import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";

type P = { params: Promise<{ slug: string }> };

const MIN_DONATION = 1000;  // 10 € en centimes
const MAX_DONATION = 50000; // 500 € en centimes

function computeStripeFees(amountNet: number): number {
  // Frais Stripe : 1.5% + 0.25€ (arrondi au centime supérieur)
  return Math.ceil(amountNet * 0.015) + 25;
}

export async function POST(req: NextRequest, { params }: P) {
  const { slug } = await params;

  const cagnotte = await db.cagnotte.findUnique({
    where: { slug },
    select: { id: true, status: true, title: true },
  });
  if (!cagnotte || cagnotte.status !== "ACTIVE") {
    return NextResponse.json({ error: "Cagnotte indisponible." }, { status: 400 });
  }

  const { amountNet, dreamId, donorName, donorEmail, isAnonymous, message, wantsReceipt } = await req.json();

  if (!amountNet || amountNet < MIN_DONATION) return NextResponse.json({ error: `Minimum ${MIN_DONATION / 100} €.` }, { status: 400 });
  if (amountNet > MAX_DONATION) return NextResponse.json({ error: `Maximum ${MAX_DONATION / 100} €.` }, { status: 400 });
  if (!donorEmail?.includes("@")) return NextResponse.json({ error: "Email invalide." }, { status: 400 });

  const amountStripeFees = computeStripeFees(amountNet);
  const amountTotalPaid  = amountNet + amountStripeFees;

  // Créer le don en base (status PENDING)
  const donation = await db.cagnotteDonation.create({
    data: {
      cagnotteId:      cagnotte.id,
      dreamId:         dreamId || null,
      donorName:       isAnonymous ? null : (donorName?.trim() || null),
      donorEmail:      donorEmail.toLowerCase().trim(),
      isAnonymous:     Boolean(isAnonymous),
      message:         message?.trim() || null,
      amountNet,
      amountStripeFees,
      amountTotalPaid,
      status:          "PENDING",
    },
  });

  // Créer le Payment Intent Stripe
  const intent = await stripe.paymentIntents.create({
    amount:      amountTotalPaid,
    currency:    "eur",
    description: `Don cagnotte ${cagnotte.title}`,
    receipt_email: wantsReceipt ? donorEmail : undefined,
    metadata:    { donationId: donation.id, cagnotteId: cagnotte.id, amountNet: String(amountNet) },
  });

  await db.cagnotteDonation.update({
    where: { id: donation.id },
    data:  { stripePaymentIntentId: intent.id },
  });

  return NextResponse.json({ clientSecret: intent.client_secret, donationId: donation.id });
}

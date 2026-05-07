// =====================================================
// ROUTE DÉSACTIVÉE POUR LE MVP — réactivation prévue en V2
// Voir PROMPT-DESACTIVATION-PAIEMENT.md
// Ne pas supprimer ce fichier.
// =====================================================
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

export async function POST() {
  const session = await getSession();
  if (!session || session.role !== "pro") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const pro = await db.pro.findUnique({ where: { id: session.sub } });
  if (!pro) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  // Créer le compte Connect si inexistant
  let accountId = pro.stripeAccountId;
  if (!accountId) {
    const account = await stripe.accounts.create({
      type:  "express",
      email: pro.email,
      capabilities: { transfers: { requested: true } },
      business_type: "individual",
      settings: { payouts: { schedule: { interval: "manual" } } },
    });
    accountId = account.id;
    await db.pro.update({ where: { id: session.sub }, data: { stripeAccountId: accountId } });
  }

  // Créer le lien d'onboarding
  const accountLink = await stripe.accountLinks.create({
    account:     accountId,
    refresh_url: `${APP_URL}/dashboard/banque?setup=refresh`,
    return_url:  `${APP_URL}/dashboard/banque?setup=complete`,
    type:        "account_onboarding",
  });

  return NextResponse.json({ url: accountLink.url });
}

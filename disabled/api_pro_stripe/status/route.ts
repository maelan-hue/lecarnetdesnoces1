// =====================================================
// ROUTE DÉSACTIVÉE POUR LE MVP — réactivation prévue en V2
// Voir PROMPT-DESACTIVATION-PAIEMENT.md
// Ne pas supprimer ce fichier.
// =====================================================
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "pro") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const pro = await db.pro.findUnique({ where: { id: session.sub } });
  if (!pro) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  if (!pro.stripeAccountId) {
    return NextResponse.json({ status: "none" });
  }

  const account = await stripe.accounts.retrieve(pro.stripeAccountId);
  const active  = account.charges_enabled && account.payouts_enabled;

  if (active && !pro.stripeOnboarded) {
    await db.pro.update({ where: { id: session.sub }, data: { stripeOnboarded: true } });
  }

  return NextResponse.json({
    status:          active ? "active" : "pending",
    chargesEnabled:  account.charges_enabled,
    payoutsEnabled:  account.payouts_enabled,
    requiresAction:  account.requirements?.currently_due?.length ?? 0,
    email:           account.email,
  });
}

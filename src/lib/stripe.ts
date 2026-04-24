import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia",
});

export const COMMISSION_PCT = Number(process.env.NEXT_PUBLIC_COMMISSION_PCT ?? 3);
export const STRIPE_FEE_PCT = 1.4;
export const STRIPE_FEE_FIXED = 25; // 0,25 € en centimes

// Calcule les montants d'un paiement
// amount : ce que le prestataire demande (en centimes)
export function computeAmounts(amount: number) {
  const commission = Math.round(amount * (COMMISSION_PCT / 100));
  const amountTotal = amount + commission; // ce que paie le couple
  const stripeFee = Math.round(amountTotal * (STRIPE_FEE_PCT / 100)) + STRIPE_FEE_FIXED;
  const amountNet = amountTotal - commission - stripeFee; // ce que reçoit le pro
  return { commission, amountTotal, stripeFee, amountNet };
}

// Formate un montant en centimes → "741,60 €"
export function formatAmount(cents: number): string {
  return (cents / 100).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " €";
}

// Utilitaires de calcul Stripe — importables côté client (pas de SDK serveur)

export const COMMISSION_PCT  = Number(process.env.NEXT_PUBLIC_COMMISSION_PCT ?? 3);
export const STRIPE_FEE_PCT  = 1.4;
export const STRIPE_FEE_FIXED = 25; // 0,25 € en centimes

export function computeAmounts(amount: number) {
  const commission  = Math.round(amount * (COMMISSION_PCT / 100));
  const amountTotal = amount + commission;
  const stripeFee   = Math.round(amountTotal * (STRIPE_FEE_PCT / 100)) + STRIPE_FEE_FIXED;
  const amountNet   = amountTotal - commission - stripeFee;
  return { commission, amountTotal, stripeFee, amountNet };
}

export function formatAmount(cents: number): string {
  return (cents / 100).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " €";
}

// SDK Stripe — serveur uniquement, ne pas importer dans des composants client
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia",
});

// Ré-exporte les utilitaires pour la compatibilité avec les imports existants côté serveur
export { computeAmounts, formatAmount, COMMISSION_PCT, STRIPE_FEE_PCT, STRIPE_FEE_FIXED } from "./stripe-utils";

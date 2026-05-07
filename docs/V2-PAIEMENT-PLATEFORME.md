# Paiement plateforme — désactivé pour le MVP

**Date de désactivation :** 2026-05-04  
**Décision :** Le paiement Stripe Connect entre couples et prestataires est retiré du MVP. Réactivation prévue en V2 après validation de l'adoption produit.

La cagnotte (Stripe Checkout simple) reste active et indépendante.

---

## Fichiers désactivés (renommés `_disabled`)

### Pages frontend

| Chemin | Description |
|---|---|
| `src/app/dashboard/_disabled_paiements/` | Historique des paiements pro + création de lien |
| `src/app/dashboard/_disabled_banque/` | Onboarding Stripe Connect pro |
| `src/app/_disabled_payer/` | Page de paiement publique couple (`/payer/[id]`) + succès |

### Routes API

| Chemin | Description |
|---|---|
| `src/app/api/pro/_disabled_stripe/` | Création compte Connect + vérification statut |
| `src/app/api/pro/_disabled_paiements/` | CRUD liens de paiement |
| `src/app/api/_disabled_payer/` | Création du PaymentIntent Stripe |

---

## Fichiers modifiés (annotés, pas supprimés)

- `src/app/api/webhooks/stripe/route.ts` — branche "paiement prestataire" commentée (dormante, ne sera plus déclenchée)
- `prisma/schema.prisma` — commentaire sur les tables `payments` et `payment_links`

---

## Navigation retirée

- **Pro sidebar** : "Mes paiements" et "Compte bancaire" retirés du menu

---

## Copies mises à jour

- `src/app/page.tsx` (landing) : suppression de la section 6 étapes pro, des mentions "3 %", "acomptes", "médiation", "Stripe Connect"
- `src/app/inscription-pro/page.tsx` : suppression du bullet "Paiements en un clic" et de la mention "3 % sur l'acompte" dans les CGV

---

## Ce qui reste actif

- Tout le module cagnotte (Stripe Checkout simple, indépendant)
- `src/lib/stripe.ts` et `src/lib/stripe-utils.ts` (partagés)
- `src/lib/email.ts` — fonctions `sendPaymentLinkEmail` et `sendPaymentReceiptEmail` conservées dans le code pour la V2
- Tables DB `payments` et `payment_links` conservées intactes

---

## Pour réactiver en V2

1. Renommer les dossiers `_disabled_xxx` vers leurs noms d'origine
2. Remettre les liens de nav dans `ProSidebar.tsx`
3. Restaurer les copies marketing dans la landing et l'inscription
4. Relire `PROMPT-PAIEMENT-RATTACHEMENT.md` pour le flow complet

# Le Carnet des noces — Mise en pause du paiement plateforme

## Décision produit

J'ai décidé de **retirer le paiement plateforme entre couples et prestataires du MVP**. Cette fonctionnalité (Stripe Connect, flow Cas A, rattachement paiement/carnet) reviendra en V2, après validation de l'adoption produit.

**La cagnotte reste active dans le MVP** — c'est un module indépendant qui a sa propre valeur d'usage et son propre flow Stripe (Stripe Checkout simple, pas Connect).

## Ce que tu dois faire — vue d'ensemble

L'objectif n'est **pas de supprimer le code** que tu as déjà écrit (ou que tu écriras) sur le paiement plateforme. Tout doit être **conservé, isolé, désactivé**, prêt à être réactivé en V2 sans avoir à tout réécrire.

Trois actions à mener :

1. **Conserver tout le code existant** lié au paiement entre couple et prestataire, mais le mettre en pause (feature flag, dossier `_disabled/`, ou commentaires de désactivation explicites).
2. **Retirer toutes les références visuelles** au paiement plateforme dans l'UI (boutons "Payer", écrans de paiement, mentions "réglez sur la plateforme", etc.).
3. **Retirer toutes les règles métier et phrases marketing** liées au paiement (commission 3 %, Stripe Connect, médiation en cas de litige, etc.) **sauf celles qui concernent la cagnotte** qui restent valides.

## Détails par zone du code

### 1. Côté base de données

**Ne supprime aucune table ni colonne.** Les tables `payments`, `vendor_relations`, et tous les champs Stripe Connect dans `vendors` restent telles quelles. Elles ne seront simplement plus alimentées par l'UI.

**Ajoute une note de désactivation dans le schéma** (commentaire SQL ou fichier README dans le dossier des migrations) :

```sql
-- =====================================================
-- TABLES DÉSACTIVÉES POUR LE MVP — réactivation prévue en V2
-- 
-- Les tables suivantes sont conservées dans le schéma mais ne sont
-- plus alimentées par l'UI :
--   - payments (paiements Stripe Connect entre couple et prestataire)
--   - vendor_relations (favoris/retenus prestataires)
--
-- Si tu travailles sur ce code en V2, lis :
--   prompts/06-PROMPT-PAIEMENT-RATTACHEMENT.md
-- =====================================================
```

### 2. Côté backend / API routes

**Désactive sans supprimer** les routes et webhooks liés au paiement plateforme :

```
app/api/stripe/connect/         → renomme en app/api/_disabled/stripe/connect/
app/api/payments/               → renomme en app/api/_disabled/payments/
app/api/webhooks/stripe-connect/ → renomme en app/api/_disabled/webhooks/stripe-connect/
```

**À garder actif** : tout ce qui concerne la cagnotte
```
app/api/cagnotte/donations/     → reste actif
app/api/webhooks/stripe-cagnotte/ → reste actif (webhook Stripe Checkout pour la cagnotte)
```

Sur chaque route désactivée, ajoute en première ligne du fichier un commentaire :

```ts
// =====================================================
// ROUTE DÉSACTIVÉE POUR LE MVP — réactivation prévue en V2
// Voir prompts/06-PROMPT-PAIEMENT-RATTACHEMENT.md
// Ne pas supprimer ce fichier.
// =====================================================
```

### 3. Côté frontend / écrans

**Écrans à désactiver (renommer en `_disabled` mais ne pas supprimer)** :
- `/pro/nouveau-lien` — création d'un lien de paiement par le pro
- `/pro/nouveau-lien/[id]` — affichage du lien généré
- `/pro/paiements` — historique des paiements reçus
- `/pro/banque` — onboarding Stripe Connect
- `/paiement/[token]` — page de paiement publique (côté couple)
- `/paiement/[token]/succes` — page de succès post-paiement
- `/paiement/[token]/choix` — bifurcation plateforme/direct

**Écrans à garder actifs** :
- Tous les écrans de la cagnotte (`/carnet/cagnotte/*`, `/cagnotte/[slug]/*`)
- Tous les écrans du carnet, des invités, du budget global, des fiches prestataires

### 4. Navigation et menus

**Dans la navigation pro**, retire les liens vers :
- "Paiements"
- "Banque"
- "Nouveau lien de paiement"

**Dans la navigation couple**, retire les liens vers :
- "Mes paiements"
- Toute mention "Choix de paiement"

**À garder dans la nav couple** :
- "Cagnotte" (reste actif)
- "Budget global" (reste actif, alimenté par la saisie manuelle uniquement)

### 5. Fiche prestataire publique

Sur la fiche publique d'un prestataire, le bouton **"Demander un devis"** reste, mais le bouton **"Payer un acompte"** ou **"Régler sur la plateforme"** doit être retiré.

À la place, tu peux ajouter une mention discrète en bas de la fiche :

> *Les paiements se font directement entre vous et le prestataire (chèque, virement, espèces). Vous pouvez ensuite enregistrer le devis dans votre carnet pour suivre votre budget.*

### 6. Onboarding prestataire

L'inscription pro **ne demande plus** :
- L'IBAN
- Les informations Stripe Connect
- L'acceptation des CGV de paiement

L'inscription pro **demande toujours** :
- Email + mot de passe
- Nom de l'atelier, catégorie, ville
- Bio, photo, portfolio

Le formulaire est donc **plus court**. C'est volontaire — tu réduis la friction d'inscription.

### 7. Saisie manuelle de prestataires (cas B et C)

**Le flow Cas A est désactivé**, donc dans la maquette `saisie-manuelle-budget-maquette.html`, l'écran de bifurcation ("plateforme" vs "direct") est simplifié.

Désormais, **toute prestation est saisie manuellement**. Le flow devient :

1. Le couple retient un prestataire (favori → retenu)
2. Quand il a son devis, il clique sur "Saisir le devis"
3. Il arrive sur le formulaire de saisie manuelle (cas B simplifié ou cas C selon que le prestataire soit ou non sur la plateforme)
4. Le devis alimente le budget global

**La distinction Cas B vs Cas C reste pertinente** :
- Cas B : prestataire de la plateforme → l'identité (nom, catégorie) est pré-remplie
- Cas C : prestataire externe → l'identité est saisie manuellement

### 8. Cagnotte

**Aucune modification** du module cagnotte. Il reste tel que spécifié dans `prompts/04-PROMPT-CAGNOTTE.md` :
- Page publique avec présentation du couple
- Formulaire de don avec Stripe Checkout
- Espace couple de gestion
- Commission 3 % au retrait

**Important** : la cagnotte utilise **Stripe Checkout simple** (pas Stripe Connect). Aucun lien avec le paiement plateforme désactivé. Garde bien les deux flux Stripe séparés.

## Phrases et règles à retirer

### Mentions à supprimer dans les copies UI

Dans tous les écrans et tous les emails :

- ❌ "Paiement sécurisé via Stripe entre vous et votre prestataire"
- ❌ "Commission de 3 % à la charge du couple"
- ❌ "Médiation gratuite en cas de litige"
- ❌ "Versement automatique à votre prestataire sous 2 à 7 jours"
- ❌ "Stripe Connect", "3D Secure obligatoire" (sauf dans le contexte cagnotte)
- ❌ "Réglez l'acompte de votre prestataire en ligne"
- ❌ "Le Carnet sécurise vos paiements"

### Mentions à garder (cagnotte uniquement)

- ✅ "Paiement sécurisé par Stripe" — uniquement sur la page de don de la cagnotte
- ✅ "Commission Le Carnet (3 %)" — uniquement sur l'écran de retrait de la cagnotte
- ✅ "3D Secure" — uniquement sur le formulaire de don

### Landing page

Sur la landing, retire :

- La section "Pour les artisans du mariage" qui décrit le workflow de paiement en 6 étapes (contrat signé → demande paiement → lien généré → couple paie → vous êtes crédité)
- Toute mention de "3 % de commission"
- Toute mention "vous êtes crédité sous 2-7 jours"

Remplace-la par une section plus simple :

> **Pour les prestataires du mariage**
> 
> Rejoignez un annuaire éditorial sélectionné, recevez des demandes qualifiées de couples du Roussillon, et présentez votre travail dans un cadre élégant. Inscription gratuite, aucun engagement.
> 
> [Bouton : Rejoindre Le Carnet]

### Prompt principal

Dans `prompts/00-CLAUDE-CODE-PROMPT.md`, la section "Garde-fous factuels à respecter dès le départ" contenait :

- Commission 3 % à la charge du couple
- Paiement uniquement par carte bancaire via Stripe Connect
- Pas de remboursement automatique, médiation gratuite

**Ces règles sont mises en pause pour le MVP**. Elles seront réactivées en V2 quand le paiement plateforme reviendra.

**Garde dans le MVP** :
- Les wedding planners s'inscrivent comme prestataires classiques
- Pas d'outil collaboratif WP

## Vue d'ensemble du MVP allégé

Voici ce que ton MVP propose maintenant, fonctionnellement :

**Côté couple :**
- Inscription via quiz Q1-Q6
- Carnet de préparation (5 phases, 22 tâches templates)
- Gestion des invités complète
- Annuaire de prestataires (filtré par catégorie, ville, ambiance, disponibilité)
- Favoris et niveaux Inconnu / Favori / Retenu
- Messagerie couple ↔ prestataire (groupée si plusieurs prestataires)
- Saisie manuelle des devis et paiements (cas B + cas C)
- Budget global avec récap (prévisionnel / engagé / versé / restant)
- Cagnotte en ligne (page publique + admin)

**Côté prestataire :**
- Inscription simplifiée (sans IBAN/Stripe)
- Fiche publique modulaire (5-6 caractéristiques selon catégorie)
- Portfolio (6 photos minimum)
- Tarifs indicatifs
- Disponibilités (calendrier toggle)
- Messagerie avec les couples
- Statistiques basiques (vues fiche, demandes reçues)

**Ce qui n'est PAS dans le MVP :**
- Paiement Stripe Connect entre couple et prestataire
- Création de lien de paiement par le prestataire
- Rattachement automatique paiement/carnet
- Page de paiement publique
- Banque / IBAN du prestataire

## Plan d'exécution

**Étape 1 — Audit du code existant**
- Liste tous les fichiers, routes, composants, tables liés au paiement plateforme
- Identifie ce qui est partagé avec la cagnotte (à conserver actif) et ce qui est exclusivement paiement plateforme (à désactiver)

**Étape 2 — Désactivation progressive**
- Renomme les dossiers et fichiers en `_disabled/`
- Ajoute les commentaires de désactivation
- Retire les liens de navigation
- Retire les CTAs des écrans publics

**Étape 3 — Nettoyage des copies**
- Audit complet des phrases marketing
- Mise à jour de la landing
- Mise à jour des emails transactionnels
- Mise à jour des tooltips et notifications

**Étape 4 — Tests de régression**
- Vérifier que la cagnotte fonctionne toujours
- Vérifier que la saisie manuelle suffit à alimenter le budget
- Vérifier qu'aucun lien ne mène à une page 404 ou désactivée
- Vérifier qu'aucune mention paiement plateforme ne traîne dans l'UI

**Étape 5 — Documentation**
- Crée un fichier `docs/V2-PAIEMENT-PLATEFORME.md` qui liste tout ce qui est désactivé
- Référence les prompts d'origine (`prompts/06-PROMPT-PAIEMENT-RATTACHEMENT.md`)
- Note la date de désactivation et la décision produit

## Erreurs à NE PAS faire

- ❌ **Supprimer du code**. Tout doit être conservé, juste désactivé.
- ❌ **Casser la cagnotte** en désactivant trop largement Stripe. La cagnotte utilise Stripe Checkout simple, indépendant de Stripe Connect.
- ❌ **Laisser des liens morts** dans la nav vers des pages désactivées.
- ❌ **Oublier de retirer les emails transactionnels** liés au paiement (confirmation paiement, notification prestataire, etc.).
- ❌ **Toucher au schéma DB des paiements**. Tables conservées, pas de migration de suppression.
- ❌ **Modifier le module cagnotte**. Il reste actif et inchangé.

## Ce que tu dois faire (Claude Code)

1. **Ne touche à rien tout de suite.** Lis ce document en entier.
2. **Restitue-moi en 10-15 lignes** ta compréhension :
   - Ce qui est désactivé
   - Ce qui reste actif
   - La frontière entre paiement plateforme (désactivé) et cagnotte (active)
3. **Liste tout ce que tu vas modifier** : fichiers à renommer, copies à mettre à jour, liens de nav à retirer. Je veux voir la liste avant que tu touches au code.
4. **Pose tes questions** sur les zones d'ombre, notamment :
   - Y a-t-il des cas où le code paiement plateforme et le code cagnotte partagent des utilitaires ? (Helpers Stripe, types TypeScript, etc.)
   - Comment gérer les fichiers de migration SQL existants (les laisser, les commenter, les renommer) ?
   - Que faire des tests automatisés liés au paiement plateforme (les skip, les supprimer, les laisser) ?
5. **Propose un plan d'exécution** ordonné.
6. **Attends mon feu vert** avant tout changement.

Une fois validé, j'attendrai un récap précis de ce que tu as fait, avec :
- La liste des fichiers renommés (chemins avant/après)
- La liste des copies modifiées
- La liste des liens de nav retirés
- Le contenu du fichier `docs/V2-PAIEMENT-PLATEFORME.md` que tu as créé

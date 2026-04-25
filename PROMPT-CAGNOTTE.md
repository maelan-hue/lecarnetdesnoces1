# Le Carnet des noces — Addendum : module Cagnotte en ligne

À lire après `CLAUDE-CODE-PROMPT.md` et après avoir commencé à travailler sur le produit principal. Ce document décrit une fonctionnalité complète à ajouter au MVP : **la cagnotte en ligne**.

La maquette visuelle de référence est dans `maquette/cagnotte-maquette.html`. Elle contient 4 écrans navigables :

1. **Configuration** — où le couple compose sa page de cagnotte (photo, histoire, rêves, programme)
2. **Suivi** — tableau de bord de suivi des participations pour le couple
3. **Page publique** — ce que voient les invités quand ils cliquent sur le lien partagé
4. **Formulaire de don** — ce qui s'ouvre quand un invité clique sur "Participer"

## Pourquoi cette fonctionnalité

La cagnotte est un **différenciateur majeur** pour Le Carnet des noces. Les plateformes concurrentes (Leetchi, Lydia Cagnotte, Le Pot Commun) sont des outils génériques, sans lien avec le parcours mariage. En intégrant la cagnotte dans notre produit, nous offrons quelque chose que personne ne propose : une page éditoriale cohérente avec tout le reste (photo du couple, histoire, programme du jour J, rêves illustrés), directement connectée au carnet de préparation.

C'est aussi une **source de revenu complémentaire** : 3 % de commission sur chaque cagnotte retirée.

## Règles métier non négociables

### Modèle économique

- **Commission plateforme : 3 %** prélevée UNIQUEMENT au moment du retrait par le couple. Pas de prélèvement par don.
- **Frais bancaires Stripe côté invité** : ~1,5 % + 0,25 € par don, facturés à l'invité en plus du montant de son don. L'invité voit clairement la décomposition "Don aux mariés / Frais bancaires sécurisés / Total à régler".
- **Frais Stripe côté couple au retrait** : 0,25 € fixe pour le virement sortant, peu importe le montant. Peu cher parce qu'un seul virement total.
- **Paiement uniquement par carte bancaire**, Stripe, 3D Secure obligatoire.
- **Un virement final unique** : le couple demande le virement quand il est prêt (typiquement après le mariage). Pas de virements automatiques intermédiaires.

### Exemple de calcul (50 invités × 50 €)

- Invités paient au total : 50 × 51,00 € = 2 550 € (dont 50 € de frais Stripe)
- Cagnotte brute disponible pour le couple : **2 500 €**
- Au retrait : commission 3 % (75 €) + frais Stripe virement (0,25 €) = 75,25 €
- **Net reçu par le couple : 2 424,75 €**
- **Revenu plateforme : 75 €**

### Ce qu'il faut afficher et ne PAS afficher

**À AFFICHER :**
- Le montant collecté brut sur le dashboard couple
- Le nombre de participants
- La liste des derniers participants (avec ou sans nom selon leur choix, avec leur message optionnel)
- Une décomposition transparente au moment du retrait (brut → commission → frais Stripe → net)
- Une décomposition transparente au moment du don (don net + frais bancaires = total)

**À NE PAS AFFICHER :**
- Aucune jauge de progression (ni sur la page publique, ni sur le dashboard couple, ni par objectif)
- Aucun montant espéré/objectif chiffré par rêve (les rêves sont qualitatifs, pas quantitatifs)
- Pas de "don moyen" ou statistique superflue sur le dashboard couple

### Visibilité des participants

- Chaque invité choisit au moment du don : **afficher son nom** ou **rester anonyme**
- Le choix ne s'applique qu'au livre d'or. Les mariés voient toujours qui a donné dans leur dashboard admin (traçabilité légale).
- Le message est optionnel et facultatif. Il s'affiche dans le livre d'or public (si livre d'or activé par les mariés).

### Les "rêves" (objectifs qualitatifs)

- Le couple peut créer **1 à 5 rêves** avec un titre et une description courte.
- Aucun montant chiffré par rêve. Ce sont juste des directions.
- L'invité peut choisir un rêve à soutenir, ou donner sans préciser ("Peu importe").
- Chaque don est associé à un rêve (ou à "Peu importe") pour la stat "28 dons voyage / 12 maison / 10 album" côté couple.

### Réglages couple configurables

- URL personnalisée de la cagnotte : `lecarnetdesnoces.fr/cagnotte/[slug]`
- Statut : `publique & active` / `brouillon` / `fermée`
- Afficher le livre d'or : oui/non
- Autoriser les dons anonymes : oui/non
- Recevoir un email à chaque don : oui/non
- Recevoir un récap hebdomadaire : oui/non (activé par défaut)

## Schéma de base de données à ajouter

```sql
-- La cagnotte d'un couple (une seule par couple)
create table cagnottes (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references couples(id) on delete cascade unique not null,
  slug text unique not null,              -- 'sophie-marc-2027'
  title text not null,                    -- 'Notre voyage à deux commence ici.'
  subtitle text,                          -- phrase d'accroche
  story text,                             -- histoire du couple (paragraphes)
  photo_path text,                        -- Supabase Storage path
  status text check (status in ('draft', 'active', 'closed')) default 'draft',
  show_guestbook boolean default true,
  allow_anonymous boolean default true,
  email_on_donation boolean default false,
  email_weekly_recap boolean default true,
  stripe_account_id text,                 -- Stripe Connect pour la collecte
  iban_stored text,                       -- IBAN chiffré pour le retrait
  withdrawn_at timestamptz,               -- date du virement final, null si pas encore retiré
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Les rêves (1 à 5 par cagnotte)
create table cagnotte_dreams (
  id uuid primary key default gen_random_uuid(),
  cagnotte_id uuid references cagnottes(id) on delete cascade not null,
  title text not null,
  description text,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Le programme du jour J (lignes heure + description, 0 à N lignes)
create table cagnotte_program (
  id uuid primary key default gen_random_uuid(),
  cagnotte_id uuid references cagnottes(id) on delete cascade not null,
  time_label text not null,               -- '15h00'
  description text not null,              -- 'Cérémonie laïque — Sous les platanes'
  sort_order int not null
);

-- Les dons reçus
create table cagnotte_donations (
  id uuid primary key default gen_random_uuid(),
  cagnotte_id uuid references cagnottes(id) on delete cascade not null,
  dream_id uuid references cagnotte_dreams(id) on delete set null,   -- null = "Peu importe"
  donor_name text,                        -- optionnel si anonyme
  donor_email text,                       -- toujours capté pour accusé + traçabilité
  is_anonymous boolean default false,     -- choix d'afficher/masquer dans livre d'or
  message text,                           -- optionnel
  amount_net int not null,                -- montant net au couple, en centimes (ex: 5000 pour 50€)
  amount_stripe_fees int not null,        -- frais Stripe facturés à l'invité, en centimes
  amount_total_paid int not null,         -- total payé par l'invité, en centimes
  stripe_payment_intent_id text unique,
  status text check (status in ('pending', 'paid', 'refunded')) default 'pending',
  paid_at timestamptz,
  created_at timestamptz default now()
);

-- Historique des retraits (normalement 1 seul par cagnotte, mais gardons flexible)
create table cagnotte_withdrawals (
  id uuid primary key default gen_random_uuid(),
  cagnotte_id uuid references cagnottes(id) not null,
  amount_gross int not null,              -- brut de la cagnotte, en centimes
  platform_commission int not null,       -- 3%, en centimes
  stripe_payout_fee int not null,         -- 25 centimes
  amount_net int not null,                -- ce que reçoit le couple, en centimes
  stripe_transfer_id text,
  status text check (status in ('requested', 'processing', 'completed', 'failed')) default 'requested',
  requested_at timestamptz default now(),
  completed_at timestamptz
);
```

### RLS et sécurité

- La page publique `/cagnotte/[slug]` est accessible à tous (pas d'auth requise) tant que `cagnottes.status = 'active'`.
- Les dons peuvent être créés par n'importe quel visiteur (pas d'auth requise).
- La configuration et le suivi sont accessibles uniquement au couple propriétaire.
- Les webhooks Stripe sont les seuls autorisés à passer un don de `pending` à `paid` (pas d'UI manuelle).

## Flows techniques

### Flow A — Le couple configure sa cagnotte

1. Route authentifiée `/carnet/cagnotte/config`
2. Premier accès : création d'une ligne `cagnottes` avec `status='draft'` et un slug auto-généré (`sophie-marc-2027`)
3. Le couple remplit les 5 étapes (photo, titre+histoire, rêves, programme, réglages)
4. Les sauvegardes sont persistées à chaque étape (pas de gros "submit" à la fin)
5. Quand le couple clique "Enregistrer & publier", `status` passe à `active` et la page publique devient accessible

### Flow B — L'invité fait un don

1. L'invité arrive sur `/cagnotte/[slug]` via un lien partagé
2. Consultation libre (pas d'auth)
3. Clic sur "Participer" → `/cagnotte/[slug]/donner`
4. Formulaire : montant, rêve, message, nom, options anonyme/email
5. Soumission → création d'une ligne `cagnotte_donations` avec `status='pending'`
6. Appel Stripe Checkout avec les montants calculés (net + frais Stripe)
7. Stripe redirige vers la page de confirmation de paiement
8. Webhook Stripe `payment_intent.succeeded` → passage du don à `paid`, envoi email accusé, incrément des compteurs

### Flow C — Le couple retire sa cagnotte

1. Route authentifiée `/carnet/cagnotte/retrait`
2. Calcul live : brut − 3% − 0,25 € = net
3. Vérification que l'IBAN est enregistré (onboarding Stripe Connect préalable)
4. Clic sur "Demander le virement" → création d'une ligne `cagnotte_withdrawals` avec `status='requested'`
5. Transfert Stripe vers le compte Connect du couple, puis payout vers l'IBAN
6. Webhook Stripe `transfer.created` puis `payout.paid` → passage à `completed`
7. Envoi email au couple confirmant l'arrivée des fonds

## Stripe — choix d'implémentation

- **Stripe Connect Custom** ou **Express** pour le couple — Express est plus simple, Custom est plus contrôlé. Express suffit largement pour ce besoin.
- Onboarding léger : le couple n'a qu'à vérifier son identité et renseigner son IBAN. Pas besoin de numéro SIRET ni de formulaires professionnels.
- **Destination charges** avec `transfer_data[destination]` pour router chaque don vers le compte du couple.
- Pour les frais Stripe payés par l'invité : ajoutés au montant de la charge via Stripe Checkout en ligne séparée.

## Interactions avec le reste du produit

- Ajouter une nouvelle entrée dans la navigation du carnet couple : **Cagnotte** (à côté des Invités).
- Si la cagnotte n'est pas encore configurée, afficher un état vide avec CTA "Créer ma cagnotte".
- Si active, afficher directement le dashboard de suivi (écran 2 de la maquette).
- Ajouter le lien de partage dans les emails d'invitation aux invités (optionnel, via toggle).

## Ce que tu dois faire (Claude Code)

1. **Ne code rien tout de suite.** Lis la maquette `maquette/cagnotte-maquette.html`, confirme ce que tu as compris en 10 lignes.
2. **Pose les questions** qui te manquent — notamment sur Stripe Connect (Express vs Custom), sur la gestion des anciens dons si le couple ferme puis rouvre, sur la stratégie de stockage des photos.
3. **Propose un plan d'implémentation** séparé du MVP principal — cette fonctionnalité est un module à part, elle peut être développée après les fondamentaux.
4. **Ensuite seulement**, demande-moi le feu vert avant de coder.

## Points ouverts à trancher avec le porteur de projet

- Montant minimum de don (ex : 5 €) ?
- Plafond de don individuel (ex : 500 € pour limiter la fraude) ?
- Plafond de cagnotte total (ex : 20 000 €) ?
- Peut-on demander plusieurs virements partiels, ou un seul final ?
- Peut-on supprimer un don après coup (ex : carte volée, remords) ?
- Durée de vie d'une cagnotte (ex : fermeture auto 3 mois après le mariage) ?

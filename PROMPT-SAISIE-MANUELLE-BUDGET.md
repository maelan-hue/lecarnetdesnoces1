# Le Carnet des noces — Saisie manuelle de prestataires & Suivi budget

À lire après `CLAUDE-CODE-PROMPT.md`. Ce document précise comment construire la saisie manuelle de prestataires (du Carnet payés en direct, et hors plateforme) ainsi que le suivi budgétaire complet du couple.

La maquette de référence visuelle est dans `maquette/saisie-manuelle-budget-maquette.html` — 4 écrans navigables : budget global, bifurcation cas B/C, formulaire cas B, formulaire cas C.

## Le contexte

Aujourd'hui, le carnet d'un couple ne suit que les prestataires de la plateforme avec paiement Stripe. Cela bloque deux situations très fréquentes :

1. **Cas B — Prestataire du Carnet, paiement en direct** : le couple a contacté un prestataire référencé via la plateforme, mais ils règlent par chèque, virement ou espèces (peut-être pour éviter la commission, ou parce que le prestataire a négocié, ou par préférence personnelle). Pas de blocage technique mais le suivi est impossible.

2. **Cas C — Prestataire hors plateforme** : le couple a trouvé un prestataire qui n'est pas sur Le Carnet — par bouche-à-oreille, sur Instagram, dans la famille. Aujourd'hui, ils sont obligés d'utiliser un Excel à côté pour suivre leur budget complet.

L'objectif : permettre la saisie manuelle dans ces deux cas, avec affichage cohérent dans le carnet et un dashboard budget global.

## Les 3 cas de prestataires dans le carnet d'un couple

| Cas | Source | Paiement | Suivi budget |
|---|---|---|---|
| **A** | Prestataire du Carnet | Via Stripe | Auto (montants enregistrés par les paiements) |
| **B** | Prestataire du Carnet | En direct (chèque, virement, espèces) | Saisie manuelle dans une fiche dédiée |
| **C** | Prestataire externe | En direct | Saisie manuelle complète (création de fiche personnelle) |

**Principe budgétaire fondamental :** Seul le **devis total** (case "Devis total TTC" du formulaire) compte dans le budget global engagé. Les acomptes et soldes ne servent qu'au suivi des paiements personnel — ils ne créent pas de double-comptage dans le total.

## Règles métier

### Saisie manuelle (cas B et C)

- **Aucun paiement Stripe n'est déclenché** lors d'une saisie manuelle. Pas de webhook, pas de transfert, pas de commission. Tu ne factures que sur les paiements via Stripe (cas A).
- **La saisie manuelle est privée** au couple. Le prestataire n'en est pas informé, même s'il s'agit d'un prestataire référencé du Carnet (cas B).
- **Tous les champs sont optionnels sauf nom + catégorie + devis total** pour le cas C, et devis total pour le cas B (le prestataire et la catégorie sont déjà connus).
- **La preuve de paiement** est uploadable mais optionnelle. Stockage Supabase Storage avec accès privé (RLS).

### Visualisation dans le carnet

- Le prestataire saisi manuellement apparaît avec **le même style visuel** qu'un prestataire avec paiement Stripe (cas A), mais avec un petit badge discret **"Saisi manuellement"** ou **"Hors plateforme"** selon le cas.
- Pas de section séparée. Les prestataires sont rangés par catégorie naturelle dans le carnet et le budget.

### Dashboard du carnet

- Le countdown du dashboard a maintenant **5 cases au lieu de 4** : Jours · Mois · Invités · Étapes · **Budget**. La case Budget est cliquable et mène vers l'écran budget global complet.
- Format de la case Budget : "**18 240 €** Engagés" en or, ou "**-6 760 €** Marge" en sage si encore sous budget. Affichage cliquable.

### Écran Budget global

- Récap en haut : Budget prévisionnel (saisi à l'inscription) / Engagé (somme des devis totaux) / Déjà versé (somme des acomptes + soldes) / Reste à régler.
- Barre de progression visuelle : engagé sur prévisionnel.
- Liste par catégorie (lieu, traiteur, photographe...) avec total par catégorie en haut.
- Chaque ligne montre nom, statut paiement, montant.
- CTA en bas pour ajouter une nouvelle prestation (déclenche la bifurcation cas B vs C).

## Schéma de base de données

Tu ajoutes au schéma existant :

```sql
-- Table dédiée aux prestations manuelles (cas B et C)
create table manual_vendor_entries (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references couples(id) on delete cascade not null,

  -- Lien optionnel vers un vendor de la plateforme (cas B uniquement)
  -- null = cas C (prestataire externe)
  linked_vendor_id uuid references vendors(id) on delete set null,

  -- Identité (cas C uniquement, sinon copié depuis vendors si linked_vendor_id)
  external_name text,
  external_category text,           -- slug de la catégorie
  external_city text,
  external_email text,
  external_phone text,
  external_website text,

  -- Devis et paiements
  total_amount int not null,         -- en centimes
  prestation_date date,
  status text check (status in ('discussing', 'quoted', 'deposit_paid', 'fully_paid')) default 'quoted',

  deposit_amount int default 0,
  deposit_paid_at date,
  balance_amount int,                -- calculé : total - deposit
  balance_due_date date,

  payment_method text,               -- 'check', 'transfer', 'cash', 'other'
  payment_proof_path text,           -- Supabase Storage path

  notes text,                        -- notes privées

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes utiles
create index manual_entries_couple on manual_vendor_entries(couple_id);
create index manual_entries_category on manual_vendor_entries(external_category);
```

### RLS sur cette table

Strictement privée au couple :

```sql
alter table manual_vendor_entries enable row level security;

create policy "Couples can manage their own manual entries"
on manual_vendor_entries for all
to authenticated
using (couple_id in (select id from couples where profile_id = auth.uid()))
with check (couple_id in (select id from couples where profile_id = auth.uid()));
```

## Vues SQL utiles pour le calcul du budget

Pour ne pas refaire les calculs à chaque page du dashboard, créer une vue qui agrège tout :

```sql
create view couple_budget_summary as
select
  c.id as couple_id,
  c.budget_total as planned_budget,

  -- Engagé : devis total des prestataires Stripe (paid) + manuels
  coalesce((
    select sum(total_amount) from payments p
    join tasks t on t.id = p.task_id
    where t.couple_id = c.id and p.status = 'paid'
  ), 0) +
  coalesce((
    select sum(total_amount) from manual_vendor_entries
    where couple_id = c.id
  ), 0) as engaged_amount,

  -- Versé : acomptes + soldes effectivement payés
  coalesce((
    select sum(gross_amount) from payments
    where couple_id = c.id and status = 'paid'
  ), 0) +
  coalesce((
    select sum(deposit_amount) from manual_vendor_entries
    where couple_id = c.id
  ), 0) as paid_amount

from couples c;
```

## Composants React à créer

### 1. `<BudgetDashboardCard>` (dans le carnet)

Affichage du countdown enrichi avec la 5e case Budget. Cliquable, mène vers `/carnet/budget`.

### 2. `<BudgetGlobalScreen>`

Page complète sur la route `/carnet/budget`. Affiche :
- Le bloc récap (4 chiffres + barre de progression)
- La liste des prestataires groupés par catégorie
- Le CTA "+ Ajouter une prestation"

### 3. `<AddVendorBifurcation>`

Modal ou page dédiée qui propose les 2 cartes : "Prestataire du Carnet, réglé en direct" (cas B) ou "Prestataire hors plateforme" (cas C).

### 4. `<ManualEntryFormCaseB>`

Formulaire simplifié : devis total, statut, paiements (acompte, solde, dates, mode), notes, upload preuve. **Pas de saisie d'identité** (déjà connue depuis `vendors`).

Trigger : depuis la page d'un vendor du Carnet, bouton "Je le règle en direct".

### 5. `<ManualEntryFormCaseC>`

Formulaire complet : identité du prestataire (nom, catégorie, ville, contacts, web), devis (total, date, statut), paiements (acompte, solde, dates, mode), notes, upload preuve.

Trigger : depuis la page Budget global, bouton "+ Ajouter une prestation" → choix Cas C.

### 6. `<ManualVendorBadge>`

Composant visuel discret pour marquer une entrée saisie manuellement dans les listes du carnet et du budget. Deux variantes : "Saisi manuellement" (cas B) ou "Hors plateforme" (cas C).

## Détails UX

### Champ "Solde restant" calculé automatiquement

Dès que l'utilisateur saisit le devis total et l'acompte, le solde s'affiche en temps réel (input désactivé). Cela évite les erreurs de calcul.

### Statut auto-déduit

Le statut peut être déduit automatiquement des montants saisis :
- Acompte = 0 et devis renseigné → "Devis reçu"
- Acompte > 0 et < devis → "Acompte versé"
- Acompte = devis → "Soldé"

L'utilisateur peut surcharger ce statut manuellement (ex : "En discussion" même sans montant).

### Modification après création

Une fiche manuelle est entièrement modifiable à tout moment via la page Budget global → bouton "Modifier" sur chaque ligne. La modification déclenche un recalcul automatique du budget global.

### Suppression

Bouton "Supprimer" en bas de chaque formulaire d'édition, avec confirmation. La suppression retire la ligne du budget global instantanément.

### Aucune migration vers Stripe possible

Si le couple a saisi manuellement un prestataire et finit par vouloir payer via Stripe, il doit créer un nouveau lien depuis la fiche du prestataire (cas A). L'entrée manuelle reste, ou il la supprime. Pas de logique complexe de "conversion" d'une entrée manuelle en paiement Stripe — KISS.

## Erreurs à NE PAS faire

- ❌ Stocker les montants en euros (float). **Toujours en centimes (int)** pour éviter les erreurs d'arrondi.
- ❌ Compter les acomptes ou soldes dans le budget engagé. Seul le devis total compte. Sinon double-comptage.
- ❌ Permettre de saisir un montant négatif ou un devis de 0. Validation côté serveur obligatoire.
- ❌ Afficher des entrées manuelles dans des listes publiques (recherche, fiche prestataire). Strictement privé au couple.
- ❌ Notifier le prestataire référencé qu'un couple l'a "saisi en direct" (cas B). C'est confidentiel.
- ❌ Mettre la preuve de paiement en accès public. Strict accès couple.
- ❌ Bloquer la saisie si certains champs sont vides. Tout est optionnel sauf nom, catégorie et devis total.

## Ce que tu dois faire (Claude Code)

1. **Ne code rien tout de suite.** Lis la maquette `maquette/saisie-manuelle-budget-maquette.html` (4 écrans navigables) et étudie la mécanique.
2. **Restitue-moi ce que tu as compris** en 10-15 lignes : les 3 cas de prestataires, le principe du devis total, le flux de saisie cas B vs cas C, l'impact sur le budget global.
3. **Pose-moi tes questions** sur les zones d'ombre :
   - Faut-il limiter le nombre d'entrées manuelles ?
   - Comment gérer un prestataire externe qui rejoint plus tard la plateforme (faut-il fusionner les fiches) ?
   - Faut-il prévoir un export PDF ou Excel du budget pour les couples qui veulent le partager ?
   - Comment gérer les devises (uniquement EUR pour le MVP) ?
4. **Propose un plan d'implémentation** : par où commencer, quelles dépendances avec les autres sprints.
5. **Attends mon feu vert** avant d'écrire la moindre ligne de code.

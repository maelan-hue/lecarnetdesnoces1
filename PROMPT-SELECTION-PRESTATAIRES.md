# Le Carnet des noces — Refonte du système de sélection de prestataires

À lire après `CLAUDE-CODE-PROMPT.md` et après le module saisie manuelle / budget. Ce document remplace **complètement** le système précédent de favoris à 3 niveaux par un système plus simple, plus naturel, à 2 niveaux.

La maquette de référence est `maquette/selection-prestataires-maquette.html` qui contient 5 écrans navigables : annuaire, carnet (rubrique catégorie), formulaire budget pré-rempli (flow A), bifurcation budget (flow B), choix depuis la sélection.

## Pourquoi cette refonte

Le système précédent à 3 niveaux (Inconnu → Favori → Retenu) était trop abstrait. Les couples ne savaient pas quand passer du favori au retenu, et le concept de "favori cœur" est ambigu — ça pouvait dire "j'aime" ou "je veux celui-là".

**Le nouveau système à 2 niveaux** est plus clair :

- **Ma sélection** : prestataires en cours de comparaison. Plusieurs possibles par catégorie. **Apparaissent déjà dans le carnet**.
- **Confirmé** : prestataires choisis pour le mariage. Plusieurs possibles par catégorie (cas des goodies, robe + costume, etc.). Apparaissent dans le carnet **et alimentent le budget**.

## Les 2 statuts en détail

### Statut "Ma sélection"

- Le couple ajoute un prestataire à sa sélection depuis l'annuaire (bouton "+ Ajouter à ma sélection")
- Le prestataire **apparaît immédiatement dans le carnet**, dans la bonne rubrique catégorie (Photographe, Fleuriste, etc.)
- Il est affiché avec le tag visuel "Ma sélection" (taupe, discret)
- **Aucun budget n'est encore renseigné** — il apparaît avec la mention "budget non renseigné"
- Le couple peut avoir plusieurs prestataires en sélection dans la même catégorie (typiquement 2 à 3 photographes pendant la phase de comparaison)

### Statut "Confirmé"

- Le couple clique sur "Choisir ce prestataire" depuis sa rubrique carnet
- Il est envoyé vers le formulaire de saisie de budget pré-rempli (nom et catégorie déjà renseignés)
- Il peut compléter le devis maintenant ou cliquer sur **"Passer pour l'instant"**
- Dans tous les cas, le prestataire passe au statut "Confirmé"
- Il reste dans le carnet, au même endroit, avec le tag "Confirmé" (or)
- Les autres prestataires de la même catégorie **restent dans la sélection** (le couple gère sa liste comme il veut)
- **Plusieurs prestataires peuvent être confirmés dans la même catégorie** (ex: 2 fournisseurs de goodies, 1 robe + 1 costume)
- Le devis renseigné (s'il existe) alimente le budget global

## Les 2 flux d'entrée

### Flow A — Depuis l'annuaire

```
1. Couple parcourt /annuaire/[categorie]
2. Sur une carte prestataire, clique "+ Ajouter à ma sélection"
3. Une ligne est créée en DB : vendor_selections (couple_id, vendor_id, status='selection')
4. Le bouton passe à "✓ Dans ma sélection" (en or, plein)
5. Le prestataire apparaît automatiquement dans la rubrique correspondante du carnet

PUIS, plus tard :

6. Couple va sur /carnet/photographe
7. Voit ses 3 photographes en sélection
8. Clique sur "Choisir ce prestataire" sur l'un d'eux
9. Redirigé vers /carnet/budget/ajouter?vendor_id=X
10. Formulaire pré-rempli avec nom + catégorie en lecture seule (visuellement marqué comme pré-rempli)
11. Le couple saisit le devis (optionnel) et valide
12. Le statut passe à 'confirmed' en DB
13. Le devis (s'il existe) alimente le budget global
14. Retour au carnet, le prestataire est désormais affiché en "Confirmé"
```

### Flow B — Depuis la page Budget

```
1. Couple va sur /carnet/budget
2. Clique sur "+ Ajouter une prestation"
3. Bifurcation : "Un prestataire de ma sélection" OU "Hors plateforme"

Si "De ma sélection" :
4. Liste de tous ses prestataires en sélection, groupés par catégorie
5. Clique sur l'un d'eux
6. Redirigé vers le même formulaire pré-rempli que dans le flow A
7. Mêmes étapes ensuite (saisie devis, validation, confirmation)

Si "Hors plateforme" :
- Bascule sur le flow existant cas C (saisie manuelle complète)
```

## Affichage dans le carnet

Le carnet `/carnet/[categorie]` affiche maintenant **deux sous-sections par catégorie** :

### Section "Confirmé"

- Cartes des prestataires confirmés, avec leur devis si renseigné
- Tag "Confirmé" en or, bordure latérale gauche or
- Bouton "Modifier budget" sur chaque ligne
- Affichage : nom, ville/catégorie, montant en or, status

### Section "Ma sélection"

- Cartes des prestataires en sélection, sans devis
- Tag "Ma sélection" en taupe, bordure latérale gauche taupe
- Bouton principal : "Choisir ce prestataire" (or)
- Bouton secondaire : "Retirer"
- Affichage : nom, ville/catégorie, "budget non renseigné" en gris

### Cas particulier : plusieurs catégories pour un même prestataire

Aucun pour l'instant. Un prestataire appartient à une seule catégorie (définie côté pro à l'inscription).

### Cas : prestataire saisi manuellement (hors plateforme)

Le prestataire saisi manuellement (cas C) apparaît dans la section "Confirmé" de sa catégorie, avec un badge supplémentaire "Hors plateforme" (terracotta) à côté du tag "Confirmé".

## Schéma de base de données

Remplace la table `vendor_relations` du système précédent par une table plus simple :

```sql
-- Supprime l'ancienne (ou ajoute juste les nouvelles colonnes)
drop table if exists vendor_relations;

-- Nouvelle table
create table vendor_selections (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references couples(id) on delete cascade not null,
  vendor_id uuid references vendors(id) on delete cascade not null,

  status text check (status in ('selection', 'confirmed')) default 'selection' not null,

  -- Lien vers manual_vendor_entries quand confirmé (optionnel)
  -- Permet de retrouver le budget associé
  budget_entry_id uuid references manual_vendor_entries(id) on delete set null,

  -- Métadonnées
  added_at timestamptz default now(),        -- date d'ajout à la sélection
  confirmed_at timestamptz,                  -- date de passage au statut confirmé

  -- Un même prestataire ne peut être qu'une fois dans la liste d'un couple
  unique (couple_id, vendor_id)
);

create index vendor_selections_couple_idx on vendor_selections (couple_id);
create index vendor_selections_status_idx on vendor_selections (couple_id, status);

-- RLS strict
alter table vendor_selections enable row level security;

create policy "Couples can manage their own selections"
on vendor_selections for all
to authenticated
using (couple_id in (select id from couples where profile_id = auth.uid()))
with check (couple_id in (select id from couples where profile_id = auth.uid()));
```

**Important** : **plus d'index unique partiel par catégorie** (comme l'ancien `one_retained_per_category`). Plusieurs prestataires peuvent être confirmés dans la même catégorie.

## Composants React à créer ou modifier

### 1. `<AddToSelectionButton>` (annuaire)

Bouton "+ Ajouter à ma sélection" qui :
- À l'état initial, affiche "+ Ajouter à ma sélection" (or, contour)
- Au clic, crée une ligne `vendor_selections` avec `status='selection'`
- Bascule en état "✓ Dans ma sélection" (or plein)
- Au clic suivant, demande confirmation puis supprime la ligne (retrait)

### 2. `<CarnetCategorySection>` (rubrique du carnet)

Pour chaque catégorie, affiche deux sous-sections :
- Confirmés (avec total cumulé en haut)
- Ma sélection (avec compteur)
- Si aucun prestataire dans aucun des deux statuts → CTA "Découvrir les prestataires" vers `/annuaire/[categorie]`

### 3. `<VendorRowInCarnet>` (ligne prestataire dans le carnet)

Variations :
- Statut "Ma sélection" : tag taupe, montant "budget non renseigné", boutons "Choisir" + "Retirer"
- Statut "Confirmé" via plateforme : tag or, montant en or, bouton "Modifier budget"
- Statut "Confirmé" via saisie manuelle (cas C) : tag or + badge "Hors plateforme" terracotta, montant en or, bouton "Modifier budget"

### 4. `<ChooseVendorRedirect>` (action "Choisir ce prestataire")

Quand le couple clique sur "Choisir" :
- Ne pas modifier le statut tout de suite (rester en `'selection'`)
- Rediriger vers `/carnet/budget/ajouter?source=selection&vendor_id=X`
- C'est la validation du formulaire qui change le statut à `'confirmed'`
- Si le couple clique "Passer pour l'instant", le statut **passe quand même à `'confirmed'`** mais aucun devis n'est créé. Le prestataire apparaît dans le carnet en "Confirmé" sans montant.

### 5. `<BudgetFormPrefilledFromSelection>`

Formulaire de saisie budget avec :
- Champs nom + catégorie en lecture seule, marqués visuellement comme pré-remplis (italique gold)
- Tip box au-dessus : "Choix enregistré · Studio Mila & Jules est désormais confirmé dans votre carnet. Vous pouvez compléter le budget maintenant ou plus tard."
- Champ devis total (obligatoire si on veut alimenter le budget, optionnel sinon)
- Champs paiements (acompte, solde) optionnels
- Boutons : "Enregistrer" et "Passer pour l'instant"

### 6. `<SelectionPickerFromBudget>`

Écran de choix depuis le budget (flow B) :
- Liste tous les prestataires en sélection
- Groupés par catégorie
- Chaque ligne est cliquable → redirige vers le formulaire pré-rempli
- En bas : CTA "Ajouter un prestataire hors plateforme" qui bascule sur le cas C

## Liens avec les modules existants

### Avec la saisie manuelle (cas B et C)

- Cas A désactivé (paiement plateforme désactivé)
- Cas B : couvert par le nouveau flow A décrit ici (prestataire de la plateforme, saisie manuelle du devis)
- Cas C : conservé tel quel pour les prestataires hors plateforme

Concrètement, la table `manual_vendor_entries` reste alimentée par les deux cas :
- Cas B (prestataire plateforme) : `linked_vendor_id` renseigné, copie des infos vendor automatique
- Cas C (prestataire externe) : `linked_vendor_id = null`, infos saisies manuellement

Quand une entrée cas B est créée, **on crée aussi (ou met à jour) la ligne `vendor_selections` correspondante en statut 'confirmed'** et on lie via `budget_entry_id`.

### Avec le budget global

Le calcul du budget engagé prend en compte **uniquement** les prestataires confirmés ayant un devis renseigné :

```sql
-- Mise à jour de la vue couple_budget_summary
create or replace view couple_budget_summary as
select
  c.id as couple_id,
  c.budget_total as planned_budget,

  -- Engagé : somme des devis des prestataires confirmés (plateforme ou hors)
  coalesce((
    select sum(mve.total_amount)
    from manual_vendor_entries mve
    where mve.couple_id = c.id
  ), 0) as engaged_amount,

  -- Versé : somme des acomptes + soldes effectivement payés
  coalesce((
    select sum(mve.deposit_amount)
    from manual_vendor_entries mve
    where mve.couple_id = c.id
  ), 0) as paid_amount

from couples c;
```

**Les prestataires en statut "Ma sélection" (sans devis) ne comptent pas dans le budget engagé.** Ils ne deviennent comptabilisés que quand le couple les confirme et saisit leur devis.

## Modification du countdown du dashboard

La 5e case du countdown (Budget) compte uniquement les prestataires **confirmés avec devis** :

```
419 Jours · 13 Mois · 124 Invités · 22 Étapes · 18 240 € engagés
```

Optionnellement, on peut afficher en dessous (sous-titre discret) le nombre de prestataires en sélection :
*"8 prestataires en cours de comparaison"*

## Migration depuis l'ancien système

Si la table `vendor_relations` existe déjà avec des données :

```sql
-- Migrer les anciens favoris vers la nouvelle table
insert into vendor_selections (couple_id, vendor_id, status, added_at)
select couple_id, vendor_id, 
  case 
    when status = 'retained' then 'confirmed'
    when status = 'favorite' then 'selection'
    else 'selection'
  end,
  created_at
from vendor_relations
on conflict (couple_id, vendor_id) do nothing;

-- Drop l'ancienne après vérification
-- drop table vendor_relations;
```

## Détails UX critiques

### "Passer pour l'instant" — comportement précis

Le couple a cliqué sur "Choisir ce prestataire". Le formulaire pré-rempli s'affiche. Si le couple clique "Passer" :

- ✅ Le statut passe à `'confirmed'` (le choix est enregistré)
- ✅ Aucune entrée `manual_vendor_entries` n'est créée (pas de devis)
- ✅ Le prestataire apparaît en "Confirmé" dans le carnet, mais avec mention "budget non renseigné"
- ✅ Le couple peut revenir plus tard via "Modifier budget" pour saisir le devis

### Retirer un prestataire confirmé

Si le couple veut retirer un prestataire confirmé :
- Bouton "Retirer du carnet" sur la ligne (avec confirmation)
- Supprime la ligne `vendor_selections` ET la ligne `manual_vendor_entries` liée (si elle existe)
- Le budget global est recalculé

### Repasser un confirmé en sélection

Si le couple change d'avis sans vouloir le retirer complètement :
- Bouton "Remettre en sélection" sur la ligne confirmée
- Le statut repasse à `'selection'`
- L'entrée `manual_vendor_entries` est supprimée (le devis est perdu)
- Le budget global est recalculé

### Plusieurs confirmés dans une même catégorie

Aucune contrainte technique. Le couple peut confirmer 3 photographes différents s'il veut. Le carnet et le budget les afficheront tous. C'est la responsabilité du couple de gérer sa liste.

## Erreurs à NE PAS faire

- ❌ **Bloquer l'ajout à la sélection** si le couple en a déjà beaucoup. Pas de limite.
- ❌ **Forcer la saisie d'un devis** au moment de la confirmation. C'est explicitement optionnel.
- ❌ **Cascade delete d'un prestataire** qui supprimerait silencieusement les sélections et budgets associés. Toujours avec confirmation utilisateur.
- ❌ **Limiter à 1 confirmé par catégorie**. Plusieurs sont autorisés et c'est volontaire (goodies, vêtements, etc.).
- ❌ **Afficher les prestataires en sélection dans le budget global**. Seuls les confirmés AVEC devis comptent.
- ❌ **Notifier le prestataire** quand un couple l'ajoute à sa sélection. Toute la mécanique est privée au couple. Le prestataire est notifié seulement à la prise de contact (messagerie) ou plus tard, en V2, au paiement.

## Tests obligatoires avant validation

Avant de me dire que c'est fini, **tester les 6 scénarios manuellement** :

1. ✅ Ajouter un photographe à la sélection depuis l'annuaire → apparaît dans `/carnet/photographe` en statut "Ma sélection"
2. ✅ Cliquer "Choisir" puis remplir le devis → statut passe à "Confirmé", budget global +X €
3. ✅ Cliquer "Choisir" puis "Passer pour l'instant" → statut passe à "Confirmé", budget non renseigné
4. ✅ Confirmer un second photographe → les deux apparaissent en "Confirmé", budget cumule
5. ✅ Aller sur Budget → "+ Ajouter" → "De ma sélection" → choisir un prestataire → formulaire pré-rempli
6. ✅ Retirer un prestataire confirmé → disparaît du carnet, budget recalculé

Si l'un échoue, **ne pas avancer**.

## Ce que tu dois faire (Claude Code)

1. **Ne code rien tout de suite.** Lis la maquette `maquette/selection-prestataires-maquette.html` (5 écrans navigables) et ce document en entier.
2. **Restitue-moi en 10-15 lignes** ta compréhension :
   - Les 2 statuts
   - Les 2 flows d'entrée
   - La règle "plusieurs confirmés possibles par catégorie"
   - La distinction "Ma sélection" (sans devis) vs "Confirmé" (avec ou sans devis)
3. **Pose tes questions** sur les zones d'ombre, notamment :
   - Faut-il proposer une migration douce des anciens favoris pour les couples déjà inscrits ?
   - Comment gérer le cas où un couple confirme un prestataire puis veut changer sa catégorie (changement de stratégie produit, peu probable) ?
   - Faut-il garder un historique des sélections retirées (pour analytics) ou supprimer définitivement ?
   - Comment afficher visuellement les prestataires confirmés dans le calendrier des disponibilités du prestataire (V2) ?
4. **Propose un plan d'implémentation** :
   - Migration DB en premier
   - Composant `<AddToSelectionButton>` ensuite
   - Refonte de `<CarnetCategorySection>` après
   - Le formulaire budget pré-rempli vient ensuite
   - Tests manuels en parallèle
5. **Attends mon feu vert** avant d'écrire la moindre ligne de code production.

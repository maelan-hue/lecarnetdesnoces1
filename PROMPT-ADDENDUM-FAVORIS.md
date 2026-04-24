# Addendum au prompt — Favoris et sélection de prestataires

À ajouter à `CLAUDE-CODE-PROMPT.md` ou à donner séparément à Claude Code.

---

## Fonctionnalité : favoris et sélection de prestataires

Dans le MVP, le couple doit pouvoir gérer les prestataires selon **trois niveaux** :

1. **Inconnu** — pas encore d'interaction, juste découverte dans l'annuaire
2. **Favori** — le couple a "liké" le prestataire (cœur plein), il veut le retrouver facilement
3. **Retenu** — le couple a choisi ce prestataire pour sa catégorie (= "mon fleuriste"), c'est celui avec qui il va probablement contractualiser

### Règles métier

- **Un prestataire peut être favori ou retenu, pas les deux** — retenu inclut favori, donc le cœur doit rester visible.
- **Un seul "retenu" par catégorie** — si le couple retient un nouveau fleuriste, l'ancien retenu repasse en simple favori (pas supprimé).
- **Plusieurs favoris possibles par catégorie** — c'est la phase de comparaison.
- **Les favoris sont automatiquement rangés par catégorie** dans le carnet. Un fleuriste en favori apparaît dans la rubrique "Fleuriste" du carnet, pas dans une liste globale.

### Comportement dans l'annuaire (`/recherche`)

Chaque carte prestataire doit avoir :
- Un **bouton cœur** en haut à droite pour ajouter/retirer des favoris (état vide / plein)
- Une **checkbox de sélection** pour multi-sélection (sélection temporaire, pour envoyer un message groupé)
- Un **bouton "Voir la fiche"** qui ouvre la fiche publique du prestataire

En bas de l'annuaire, une **barre flottante d'actions** apparaît dès qu'au moins 1 prestataire est coché :
- Compteur : "3 prestataires sélectionnés"
- Bouton : "Envoyer un message groupé"
- Bouton : "Ajouter aux favoris" (ajoute les cochés d'un coup)
- Bouton : "Annuler la sélection"

### Comportement dans le carnet (rubrique d'une catégorie, ex: "Fleuriste")

Pour chaque catégorie, le carnet affiche :

**Si rien n'est retenu, et pas de favori :**
- État vide avec CTA vers l'annuaire "Découvrir les fleuristes disponibles"

**Si au moins un favori mais rien de retenu :**
- Titre : "Vos fleuristes favoris"
- Liste des favoris en cartes, chacune avec :
  - Photo, nom, style, tarif indicatif
  - Bouton ★ "Retenir ce prestataire"
  - Bouton "Envoyer un message"
  - Bouton cœur plein (pour retirer des favoris)
  - Checkbox pour multi-sélection (envoi groupé)

**Si un prestataire est retenu :**
- Bloc en haut mis en valeur : carte dorée "✦ Votre fleuriste · Nom du prestataire" avec statut (à contacter / devis reçu / acompte versé…)
- En dessous, titre : "Autres fleuristes en comparaison (2)" + liste des favoris non retenus

**Barre flottante** identique à celle de l'annuaire, visible dès qu'une checkbox est cochée.

### Écran "Message groupé"

Quand l'utilisateur clique sur "Envoyer un message groupé" (depuis l'annuaire ou depuis le carnet) :

- Récap visuel des prestataires destinataires (photos + noms en ligne)
- **Brief partagé pré-rempli** avec les infos du couple (date, lieu, invités, ambiance, budget indicatif)
- Textarea pour personnaliser le message
- Option "Joindre mon carnet d'inspiration" (V2, pas MVP)
- Bouton "Envoyer à 3 prestataires"
- Note : "Chaque prestataire recevra un message séparé, ils ne se verront pas entre eux."

L'écran `/message` existe déjà dans la maquette — adapter sa logique pour supporter 1 ou N destinataires.

### Impact sur la base de données

Ajouter une table :

```sql
create table vendor_relations (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references couples(id) on delete cascade not null,
  vendor_id uuid references vendors(id) on delete cascade not null,
  status text check (status in ('favorite', 'retained')) not null,
  category text not null,  -- redondant mais utile pour indexation
  created_at timestamptz default now(),
  unique (couple_id, vendor_id)
);

-- Index : un seul retenu par catégorie par couple
create unique index one_retained_per_category
  on vendor_relations (couple_id, category)
  where status = 'retained';
```

Quand un couple "retient" un nouveau prestataire dans une catégorie où il y en avait déjà un retenu, le précédent passe en `favorite` automatiquement (via trigger ou logique applicative).

### Impact sur le carnet

Le carnet actuel affiche les tâches avec un statut. Ces statuts doivent s'articuler avec les relations :

- Pas de relation → tâche en état "À faire, découvrir des prestataires"
- Favoris seuls → tâche en état "En comparaison, X favoris"
- Retenu → tâche en état "Retenu : [Nom]" (à contacter, devis reçu, acompte versé…)
- Acompte versé via la plateforme → tâche en état "Réservé ✓"

### Impact sur les compteurs du dashboard

Le countdown du dashboard peut afficher un indicateur complémentaire :
- "5 favoris en comparaison" si des favoris non retenus existent
- "8/22 prestataires retenus" pour suivre l'avancée globale

(À discuter, tu me dis si tu veux l'ajouter ou pas.)

### Comportement visuel attendu

- Le **cœur vide** et **cœur plein** en style cohérent avec le design editorial (Cormorant + or)
- L'**étoile** pour "retenir" est dorée quand active
- La **carte du retenu** se distingue par un bord doré + un badge "✦ Votre [catégorie]"
- Les **checkboxes** sont des carrés épurés (pas le style système par défaut)
- La **barre flottante** en bas est sur fond ink (encre sombre) avec texte ivoire et boutons or

### Ce que tu dois faire (Claude Code)

1. **Ne code rien tout de suite.** Confirme-moi que tu as compris les 3 niveaux et les règles.
2. **Propose-moi un schéma visuel** (en ASCII ou en description texte) de la rubrique "Fleuriste" du carnet dans les 3 cas : vide / avec favoris seulement / avec retenu + favoris en comparaison.
3. **Propose la structure des composants React** (CardVendor, FloatingActionBar, RetainedCard, FavoriteCard…) et comment ils vont communiquer.
4. **Ensuite seulement**, tu me proposeras l'ordre d'implémentation.

À toi.

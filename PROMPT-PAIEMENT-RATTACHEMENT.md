# Le Carnet des noces — Rattachement paiement / carnet couple

À lire après `CLAUDE-CODE-PROMPT.md` et `PROMPT-SAISIE-MANUELLE-BUDGET.md`. Ce document précise comment lier intelligemment un paiement Stripe au carnet d'un couple, dans **trois scénarios distincts**.

## Le problème à résoudre

Quand un prestataire envoie un lien de paiement à un couple via la plateforme, on ne sait pas a priori dans quelle situation est le couple :

1. **Scénario A** — Le couple a un compte sur Le Carnet, et a déjà mis ce prestataire en favori. Le paiement met à jour la tâche existante.
2. **Scénario B** — Le couple a un compte sur Le Carnet, mais n'a pas mis ce prestataire en favori (il l'a trouvé via un autre canal). Le paiement crée la tâche dans son carnet.
3. **Scénario C** — Le couple n'a pas de compte sur Le Carnet du tout. Le paiement doit fonctionner quand même, sans friction. Une opportunité d'acquisition lui est proposée après.

Sans gestion explicite, le scénario B casse la cohérence du carnet, et le scénario C bloque l'acquisition.

## Principe directeur

**Le paiement ne doit jamais être bloqué par l'absence de compte couple.** La priorité absolue est la conversion au paiement. L'acquisition d'un compte couple est un bonus qu'on tente après.

**L'email saisi au paiement Stripe est la clé de rattachement.** C'est ce qui permet de relier les paiements aux comptes, que la création du compte précède ou suive le paiement.

## Les 3 scénarios en détail

### Scénario A — Couple inscrit, prestataire en favori

**Pré-requis :**
- Le couple a un compte (`couples.id` existe)
- Une ligne `vendor_relations` existe avec `couple_id`, `vendor_id`, `status='favorite' ou 'retained'`
- Une ligne `tasks` existe peut-être déjà avec `couple_id` + `vendor_id`

**Comportement attendu :**
- Au moment du paiement, on identifie le couple via l'email Stripe
- On retrouve la ligne `tasks` correspondante (ou on la crée si elle n'existe pas)
- On met à jour son statut : `paid_deposit` ou `paid_full` selon le type de paiement
- On met à jour `vendor_relations.status` à `'retained'` automatiquement (si c'était un simple favori, le paiement vaut déclaration de choix)
- Le budget global est mis à jour
- L'email de confirmation au couple mentionne : *"Votre paiement a été ajouté à votre carnet, dans la rubrique Photographe."*

### Scénario B — Couple inscrit, pas de relation préalable

**Pré-requis :**
- Le couple a un compte (`couples.id` existe)
- Aucune ligne `vendor_relations` n'existe pour ce vendor
- Aucune ligne `tasks` n'existe pour ce vendor

**Comportement attendu :**
- L'email saisi au paiement correspond au compte couple
- On crée automatiquement :
  - Une ligne `vendor_relations` avec `status='retained'`
  - Une ligne `tasks` avec `status='paid_deposit'` ou `'paid_full'`
- Le presta apparaît dans le carnet et le budget instantanément
- L'email de confirmation au couple est plus explicatif : *"Vous venez de régler 720 € à Studio Mila & Jules. Nous avons ajouté ce prestataire à votre carnet, dans la rubrique Photographe. Vous pouvez le consulter ici : [lien carnet]."*
- Notification facultative à la prochaine connexion : *"Studio Mila & Jules a été ajouté à votre carnet suite à votre paiement."*

### Scénario C — Couple non inscrit

**Pré-requis :**
- L'email saisi au paiement ne correspond à aucun compte couple
- Aucune contrainte technique ne doit empêcher le paiement de réussir

**Comportement attendu :**

**Phase 1 — Paiement sans friction**

- Le couple paie normalement par CB
- La ligne `payments` est créée avec `couple_id = null` (orphelin volontaire)
- L'email + nom + date du mariage (si saisis par le prestataire à la création du lien) sont stockés sur la ligne `payments`
- Le webhook Stripe met à jour `payments.status = 'paid'` exactement comme dans le scénario A
- Le prestataire reçoit son virement normalement

**Phase 2 — Page de confirmation avec proposition de création de compte**

- Après le paiement réussi, le couple est redirigé vers `/paiement/[token]/succes`
- La page affiche le récapitulatif du paiement (montant, prestataire, date)
- En dessous, une **carte d'acquisition** propose la création du carnet :

```
[Carte d'acquisition · style éditorial gold]

  Eyebrow : "Suivez vos paiements et bien plus"
  Titre : "Créez votre carnet privé"
  Texte : "Vos paiements sont déjà enregistrés. En créant votre 
  carnet, vous accédez automatiquement à votre suivi budget, 
  votre liste d'invités, votre cagnotte en ligne, et tous les 
  prestataires de notre annuaire. C'est gratuit et prend 
  30 secondes."

  Bouton primary : "Créer mon carnet"  
  Bouton ghost : "Plus tard, merci"
```

**Phase 3 — Création de compte avec rattachement automatique**

- Si le couple clique sur "Créer mon carnet", il est redirigé vers `/inscription/couple/q1` (le quiz d'onboarding existant)
- L'email + nom + date du mariage sont **pré-remplis** depuis `payments.guest_email`, `guest_first_names`, `guest_wedding_date`
- Le couple complète le quiz et crée son compte
- **À la création du compte, un trigger SQL rattache automatiquement tous les paiements orphelins** correspondant à son email
- Au premier affichage du carnet, le couple voit déjà ses paiements antérieurs avec les bons prestataires en statut "Acompte versé"

**Phase 4 — Si le couple ne crée jamais de compte**

- Aucun blocage. Le paiement reste valide, le prestataire est crédité, le reçu Stripe est envoyé par email
- Si le couple clique plus tard sur le lien de paiement, il revoit la page de succès avec la proposition de création de compte
- Si plus tard encore le couple s'inscrit (par un autre chemin, ex: SEO landing page), le rattachement par email a lieu au moment de la création du compte

## Schéma de base de données — adaptations

### Table `payments`

```sql
-- Modification : couple_id devient nullable
alter table payments alter column couple_id drop not null;

-- Nouveaux champs pour les paiements orphelins
alter table payments add column guest_email text not null;
alter table payments add column guest_first_names text;
alter table payments add column guest_wedding_date date;
alter table payments add column linked_to_couple_at timestamptz;

-- Index pour rattachement rapide
create index payments_guest_email_idx on payments (lower(guest_email)) where couple_id is null;
```

**Important :** L'email guest est **toujours requis** (NOT NULL). C'est notre clé de rattachement, sans elle on perd la trace.

### Table `vendors` — informations de pré-remplissage

Quand le prestataire crée un lien de paiement, il peut renseigner ces 3 champs optionnels qui aideront à l'acquisition future :

```sql
-- Le formulaire de création de lien de paiement permet de saisir :
-- - guest_email (recommandé fortement)
-- - guest_first_names (optionnel : "Sophie & Marc")
-- - guest_wedding_date (optionnel)
-- Ces champs sont copiés sur la ligne payments à la création.
```

### Trigger de rattachement automatique

```sql
-- Quand un couple est créé, on rattache tous les paiements orphelins de son email

create or replace function link_orphan_payments_on_couple_creation()
returns trigger as $$
declare
  user_email text;
begin
  -- Récupérer l'email du nouvel utilisateur
  select email into user_email
  from auth.users
  where id = NEW.profile_id;

  if user_email is null then
    return NEW;
  end if;

  -- Rattacher tous les paiements orphelins avec cet email
  update payments
  set 
    couple_id = NEW.id,
    linked_to_couple_at = now()
  where 
    couple_id is null
    and lower(guest_email) = lower(user_email);

  -- Pour chaque paiement rattaché, créer/mettre à jour la tâche correspondante
  insert into tasks (couple_id, phase, category, title, status, vendor_id, total_amount, paid_amount)
  select 
    NEW.id,
    -- la phase est déduite de la catégorie du vendor (à implémenter via lookup)
    1,  -- placeholder
    v.category,
    v.business_name,
    case 
      when p.payment_type = 'deposit' then 'paid_deposit'::text
      when p.payment_type = 'balance' then 'paid_full'::text
      else 'paid_deposit'::text
    end,
    p.vendor_id,
    p.gross_amount,
    p.gross_amount
  from payments p
  join vendors v on v.id = p.vendor_id
  where p.couple_id = NEW.id and p.linked_to_couple_at = now()
  on conflict (couple_id, vendor_id) do update
    set 
      paid_amount = tasks.paid_amount + excluded.paid_amount,
      status = excluded.status;

  -- Créer aussi une vendor_relation en statut "retained"
  insert into vendor_relations (couple_id, vendor_id, status, category)
  select NEW.id, p.vendor_id, 'retained', v.category
  from payments p
  join vendors v on v.id = p.vendor_id
  where p.couple_id = NEW.id and p.linked_to_couple_at = now()
  on conflict (couple_id, vendor_id) do update
    set status = 'retained';

  return NEW;
end;
$$ language plpgsql security definer;

create trigger auto_link_payments_on_couple_creation
after insert on couples
for each row execute function link_orphan_payments_on_couple_creation();
```

**Note de sécurité** : Le trigger est en `security definer` pour pouvoir lire `auth.users.email`. À tester soigneusement et à auditer.

### Webhook Stripe enrichi

Quand le webhook `payment_intent.succeeded` arrive, le serveur doit :

```ts
// app/api/webhooks/stripe/route.ts (pseudo-code)

async function handleSuccessfulPayment(session) {
  const guestEmail = session.customer_email
  const payment = await db.payments.findByStripeSession(session.id)
  
  // Étape 1 : marquer le paiement comme payé
  await db.payments.update(payment.id, {
    status: 'paid',
    paid_at: new Date(),
    guest_email: guestEmail,
  })
  
  // Étape 2 : tenter de rattacher à un compte existant
  const existingCouple = await db.couples.findByEmail(guestEmail)
  
  if (existingCouple) {
    // Scénarios A et B : on rattache
    await db.payments.update(payment.id, {
      couple_id: existingCouple.id,
      linked_to_couple_at: new Date(),
    })
    
    // Mettre à jour ou créer la tâche
    await upsertTaskForPayment(payment, existingCouple)
    
    // Mettre à jour ou créer la vendor_relation
    await upsertVendorRelation(payment, existingCouple, 'retained')
    
    // Email de confirmation enrichi (mentionne le carnet)
    await sendCouplePaymentConfirmation(existingCouple, payment, { withCarnetLink: true })
  } else {
    // Scénario C : paiement orphelin
    // Email de confirmation simple (avec invitation à créer un carnet)
    await sendGuestPaymentConfirmation(guestEmail, payment, { withSignupCTA: true })
  }
  
  // Toujours notifier le prestataire
  await sendVendorPaymentNotification(payment.vendor_id, payment)
}
```

## Détails UX

### Page de paiement publique `/paiement/[token]`

- Pas de demande de création de compte avant paiement (jamais de friction au paiement)
- Le formulaire Stripe Elements demande email + carte. L'email est obligatoire (Stripe le requiert pour le reçu)
- Note discrète sous le bouton de paiement : *"En réglant, vos paiements seront automatiquement enregistrés si vous avez un carnet sur Le Carnet des noces. Sinon, vous pourrez en créer un après."*

### Page de succès `/paiement/[token]/succes`

Trois variantes selon le scénario :

**Scénario A** (couple identifié et favori existant) :
> Récap du paiement.
> *"Ce paiement a été ajouté à votre carnet — la tâche Photographe · Studio Mila & Jules a été mise à jour."*
> Bouton : "Voir mon carnet"

**Scénario B** (couple identifié, pas de favori préalable) :
> Récap du paiement.
> *"Studio Mila & Jules a été ajouté à votre carnet, dans la rubrique Photographe."*
> Bouton : "Voir mon carnet"

**Scénario C** (pas de couple) :
> Récap du paiement.
> *"Votre paiement a bien été reçu et un reçu vous a été envoyé par email."*
> Carte d'acquisition gold avec proposition de création de compte (voir Phase 2 ci-dessus)

### Inscription post-paiement

- L'email est pré-rempli (vient de `payments.guest_email`)
- Si le prestataire avait renseigné les noms et la date, ils sont aussi pré-remplis dans Q1 et Q2
- Le couple ne peut pas modifier l'email pendant l'inscription (sinon le rattachement échoue) — il est affiché en lecture seule
- À la fin du quiz et de la création du compte, le trigger SQL rattache automatiquement les paiements antérieurs
- La première vue du carnet montre déjà les prestataires payés en haut, avec un bandeau de bienvenue : *"Bienvenue Sophie & Marc — nous avons retrouvé Studio Mila & Jules dans votre carnet."*

### Inscription via un autre chemin (SEO, organic) avec paiements antérieurs

Même logique : le trigger se déclenche à la création du compte et rattache tous les paiements antérieurs. Le couple voit son carnet pré-rempli sans rien faire de spécial.

## Impacts sur la création du lien de paiement par le prestataire

Le formulaire `/pro/nouveau-lien` doit être modifié pour permettre au prestataire de saisir :

- **Email du couple** (recommandé fortement, mais pas obligatoire — le couple le saisira au paiement)
- **Prénoms des mariés** (optionnel, pré-remplit le carnet futur)
- **Date du mariage** (optionnel, pré-remplit le quiz Q1 futur)

Une note explicative à côté du champ email :
> *"Si vous renseignez l'email du couple, nous pourrons mieux les accompagner après le paiement (carnet pré-rempli, suivi budget automatique). C'est optionnel — ils saisiront leur email de toute façon au moment du paiement."*

## Erreurs à NE PAS faire

- ❌ **Bloquer le paiement** si le couple n'a pas de compte. C'est une erreur d'acquisition fatale.
- ❌ **Forcer la création d'un compte** sur la page de paiement avant que la CB soit chargée.
- ❌ **Stocker un paiement sans email guest**. Sans email, on perd toute trace de qui a payé et tout rattachement futur est impossible.
- ❌ **Faire le rattachement post-paiement uniquement côté client** (en JavaScript). Le rattachement doit être déclenché côté serveur (webhook Stripe + trigger SQL) pour être fiable.
- ❌ **Modifier l'email pendant l'inscription post-paiement**. Si le couple change l'email, le trigger échoue à rattacher. Email en lecture seule.
- ❌ **Envoyer 2 emails de confirmation différents**. Un seul email, dont le contenu varie selon le scénario (A/B/C).
- ❌ **Auto-créer un compte** au paiement avec un mot de passe aléatoire. Trop intrusif. La création de compte reste un acte volontaire.

## Cas limites à anticiper

### Le couple a 2 emails différents

Sophie utilise `sophie@gmail.com` pour son compte mais saisit `marc@gmail.com` au paiement parce que c'est la carte de Marc. Le rattachement automatique échouera.

**Solution :** ajouter dans le carnet une page "Mes paiements" où le couple peut **rattacher manuellement** un paiement orphelin via un code de récupération envoyé à l'email du paiement. Ce n'est pas urgent pour le MVP, mais à prévoir en V2.

### Le couple paie pour quelqu'un d'autre

Tante Hélène paie l'acompte du DJ pour Sophie & Marc avec sa propre carte et son propre email. Le rattachement échouera.

**Solution :** au moment du paiement, ajouter un champ optionnel "Email des mariés (si différent du vôtre)". Si rempli, ce sera cet email qui servira de clé de rattachement. Cas peu fréquent, à implémenter seulement si on voit le besoin remonter.

### Plusieurs couples partagent le même email

Cas extrêmement rare. Le trigger rattachera le paiement au premier couple inscrit avec cet email. Pas de gestion particulière.

### Le compte couple est créé puis supprimé

Si le couple supprime son compte, les paiements rattachés gardent leur `couple_id` (qui pointe vers une ligne supprimée via cascade). Vérifier que la cascade `on delete cascade` sur `payments.couple_id` est bien `set null` plutôt que cascade, pour ne pas perdre les paiements (importants pour la comptabilité).

```sql
alter table payments 
  drop constraint payments_couple_id_fkey,
  add constraint payments_couple_id_fkey 
    foreign key (couple_id) references couples(id) on delete set null;
```

## Tests obligatoires avant validation

Avant de me dire que c'est fini, **tester les 5 scénarios manuellement** :

1. ✅ Paiement avec un couple inscrit + favori existant → tâche mise à jour, statut paid_deposit
2. ✅ Paiement avec un couple inscrit sans favori → tâche créée + vendor_relation créée
3. ✅ Paiement sans compte → page de succès avec CTA création + paiement orphelin en DB
4. ✅ Création de compte après paiement orphelin → rattachement automatique + carnet pré-rempli
5. ✅ Création de compte sans paiement antérieur (cas standard) → trigger ne fait rien

Si l'un des 5 échoue, **ne pas avancer**.

## Ce que tu dois faire (Claude Code)

1. **Ne code rien tout de suite.** Restitue-moi en 10-15 lignes ta compréhension des 3 scénarios, du flux email comme clé de rattachement, et du rôle du trigger SQL.
2. **Pose tes questions** sur les zones d'ombre :
   - Comment gérer la casse de l'email (lowercase systématique ?)
   - Faut-il une expiration sur les paiements orphelins (ex : 6 mois) ?
   - Comment gérer le RGPD pour les `guest_email` qui ne créeront jamais de compte ?
   - Faut-il proposer une page de connexion magique (magic link) pour les couples qui ont un email mais pas de mot de passe créé ?
3. **Propose un plan d'implémentation** : par où commencer, quelles dépendances avec les sprints précédents (auth, paiements Stripe, schéma `tasks`).
4. **Implémente les 5 tests manuels** comme premier livrable. Pas d'écran avancé tant que les 5 ne passent pas.
5. **Attends mon feu vert** avant d'écrire la moindre ligne de code production.

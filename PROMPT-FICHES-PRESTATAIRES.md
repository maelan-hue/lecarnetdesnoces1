# Le Carnet des noces — Fiches publiques prestataires modulaires

À lire après `CLAUDE-CODE-PROMPT.md` quand tu attaqueras le sprint des fiches prestataires. Ce document précise comment construire les fiches publiques pour qu'elles soient adaptées à chaque type de métier, sans complexité inutile.

La maquette de référence visuelle est dans `maquette/fiches-prestataires-maquette.html` qui contient 4 exemples (lieu de réception, photographe, traiteur, DJ).

## Le principe directeur

Une fiche prestataire publique doit donner **les 5 ou 6 informations vraiment décisives** pour aider un couple à prendre contact ou non. Pas plus. Si on liste 15 caractéristiques, le couple décroche, le prestataire ne renseigne rien, et la fiche devient pauvre par défaut.

L'architecture est la suivante : **un squelette commun pour toutes les catégories**, et **une seule section "Caractéristiques" qui change selon le métier**. Pas de templates radicalement différents, pas de logique complexe — juste un schéma de champs adapté.

## Architecture en 4 zones

### Zone 1 — En-tête héro (commun à toutes les fiches)

- Photo de couverture en grand format
- Badge de catégorie (ex : "Photographe", "Lieu de réception")
- Nom de l'atelier en titre éditorial
- Métadonnées en italique : ville · spécialité courte · années d'expérience ou volume
- Affichage : prix indicatif ("à partir de ...") et chip de disponibilité

### Zone 2 — Section "À propos" (commun)

Bio du prestataire en 2-3 paragraphes éditoriaux. Texte libre que le prestataire rédige.

### Zone 3 — Section "Caractéristiques" (variable selon catégorie)

C'est **la seule section qui change** d'une fiche à l'autre. Elle contient au maximum **6 lignes de caractéristiques pertinentes pour le métier**.

### Zone 4 — Sections finales (commun)

- Portfolio (galerie de 6 photos minimum)
- Tarifs (formules avec prix indicatifs)
- Aside latérale : "Le plus", disponibilité, avis clients

## Liste exhaustive des catégories et des 5-6 caractéristiques par catégorie

Voici la définition complète. **Toutes les caractéristiques sont optionnelles** — un prestataire peut ne renseigner que 2 lignes sur 6 si c'est tout ce qui compte pour lui. La fiche s'adapte et n'affiche que ce qui est rempli.

### 1. Lieu de réception
- Capacité (assis / debout)
- Hébergement sur place
- Traiteurs imposés (oui / non / liste)
- Intérieur ou extérieur
- Horaires possibles (heure de fin musique)
- Parking

### 2. Photographe
- Style photographique
- Durée standard
- Nombre de photos livrées
- Délai de livraison
- 1 ou 2 photographes
- Album / tirages inclus ou en option

### 3. Traiteur
- Type de cuisine
- Régimes spéciaux gérés
- Capacité (min – max invités)
- Service en salle inclus
- Vaisselle fournie
- Test de menu inclus

### 4. Fleuriste
- Style (champêtre, bohème, classique, minimaliste…)
- Prestations couvertes (bouquet, arche, centres de table…)
- Fleurs locales et de saison
- Délai de fraîcheur garanti
- Démontage le lendemain

### 5. DJ / Musicien
- Type d'animation (DJ seul / DJ + live / cérémonie acoustique)
- Sonorisation et lumières incluses
- Durée standard de la prestation
- Playlist personnalisable
- Animation cérémonie laïque possible

### 6. Vidéaste
- Style (cinéma / documentaire / short reel)
- Durée du film final
- Drone inclus ou non
- Délai de livraison
- Nombre de caméras

### 7. Officiant laïc
- Langue(s)
- Entretiens préalables inclus
- Écriture personnalisée
- Durée de cérémonie
- Périmètre géographique

### 8. Coiffure & maquillage
- Sur place ou en salon
- Essai inclus
- Témoins inclus ou en option
- Options bio / végane
- Forfait mariée + témoins

### 9. Décoration / Papeterie
- Spécialités (faire-part, menus, signalétique, décoration florale…)
- Création sur-mesure ou catalogue
- Délai de livraison
- Papier (recyclé / gravé / calligraphié)
- Échantillons offerts

### 10. Wedding planner
- Type d'accompagnement (intégral / partiel / Jour J)
- Durée d'accompagnement
- Périmètre géographique
- Nombre de mariages par an
- Visite des lieux incluse

### 11. Voiture / Transport
- Type de véhicule (vintage / cabriolet / luxe / utilitaire)
- Capacité passagers
- Avec chauffeur ou sans
- Périmètre kilométrique
- Décoration florale incluse

### 12. Robe & Costume
- Type (créateurs / boutique / sur-mesure)
- Essayages inclus
- Retouches incluses
- Délai de fabrication
- Accessoires (voile, ceinture…)

### 13. Photobooth
- Type (photo physique / digital / animation magicien)
- Durée
- Imprimante incluse
- Animateur sur place
- Album souvenir inclus

### 14. Ongles / Manucure
- Sur place ou en salon
- Témoins inclus
- Pose semi-permanente ou classique
- Nail art personnalisé
- Essai inclus

### 15. Goodies invités
- Type (savons, dragées, bougies, huile d'olive…)
- Personnalisation (étiquette, prénoms…)
- Quantité minimum
- Délai de fabrication
- Prix unitaire

### 16. Soins pré-mariage
- Type de soins (visage / corps / amincissement / spa)
- Forfait mariée multi-séances
- Témoins inclus possibles
- À domicile ou en institut
- Bio / naturel

### 17. Vin & Champagne
- Type (cave / domaine viticole / sommelier)
- Vins locaux / Roussillon
- Service sommelier inclus
- Verres fournis
- Reprise des bouteilles non-ouvertes

### 18. Autre
Pas de section "Caractéristiques" — uniquement un texte descriptif libre dans la bio.

## Implémentation technique

### Schéma de données

Plutôt que de créer 18 colonnes différentes par catégorie dans la table `vendors`, utiliser une approche **schéma JSON par catégorie**.

```sql
-- La table vendors existante reste telle quelle pour les champs communs
-- (business_name, category, city, bio, price_from, etc.)

-- Ajouter une colonne JSONB pour les caractéristiques spécifiques
alter table vendors add column specs jsonb default '{}'::jsonb;

-- Exemple de contenu pour un photographe :
-- {
--   "style_photographique": "Reportage sensible, lumière naturelle",
--   "duree_standard": "10-12h",
--   "photos_livrees": "600-800 retouchées",
--   "delai_livraison": "8-10 semaines",
--   "nombre_photographes": "2",
--   "album_inclus": false
-- }
```

Avantages : flexibilité totale, ajout d'un nouveau champ ou d'une nouvelle catégorie sans migration DB.

### Schéma TypeScript pour les caractéristiques

Créer un fichier de configuration central qui définit le schéma de chaque catégorie :

```ts
// lib/vendor-categories.ts

export type SpecField = {
  key: string                  // 'capacite_assise'
  label: string                // 'Capacité assise'
  type: 'text' | 'number' | 'select' | 'multiselect' | 'boolean'
  options?: string[]           // pour select et multiselect
  placeholder?: string         // pour aider le prestataire à remplir
  helpText?: string            // tip optionnel
}

export type VendorCategory = {
  slug: string                 // 'photographe', 'lieu-reception'
  label: string                // 'Photographe', 'Lieu de réception'
  badge_color?: string         // optionnel pour design
  specs: SpecField[]
}

export const VENDOR_CATEGORIES: VendorCategory[] = [
  {
    slug: 'lieu-reception',
    label: 'Lieu de réception',
    specs: [
      { key: 'capacite', label: 'Capacité (assis / debout)', type: 'text', placeholder: 'Ex : 150 assis · 250 debout' },
      { key: 'hebergement', label: 'Hébergement sur place', type: 'text', placeholder: 'Ex : 14 chambres · 28 lits' },
      { key: 'traiteurs_imposes', label: 'Traiteurs imposés', type: 'text', placeholder: 'Ex : Liste de 6 traiteurs partenaires' },
      { key: 'espace', label: 'Intérieur ou extérieur', type: 'select', options: ['Intérieur', 'Extérieur', 'Intérieur + extérieur'] },
      { key: 'horaires', label: 'Horaires possibles', type: 'text', placeholder: 'Ex : Soirée jusqu\'à 3h, musique amplifiée OK' },
      { key: 'parking', label: 'Parking', type: 'text', placeholder: 'Ex : 60 places' },
    ]
  },
  {
    slug: 'photographe',
    label: 'Photographe',
    specs: [
      { key: 'style', label: 'Style photographique', type: 'text', placeholder: 'Ex : Reportage sensible, lumière naturelle' },
      { key: 'duree', label: 'Durée standard', type: 'text', placeholder: 'Ex : 10 à 12 heures' },
      { key: 'nombre_photos', label: 'Nombre de photos livrées', type: 'text', placeholder: 'Ex : 600 à 800 retouchées' },
      { key: 'delai_livraison', label: 'Délai de livraison', type: 'text', placeholder: 'Ex : 8 à 10 semaines' },
      { key: 'nombre_photographes', label: 'Photographes présents', type: 'select', options: ['1', '2', 'Variable selon formule'] },
      { key: 'album_tirages', label: 'Album / tirages', type: 'select', options: ['Inclus', 'En option', 'Non proposé'] },
    ]
  },
  // ... répéter pour les 16 autres catégories selon la liste ci-dessus
]
```

**Tu dois définir les 18 catégories dans ce fichier**, en suivant rigoureusement la liste ci-dessus.

### Composant `<VendorSpecsSection>` (variable selon catégorie)

```tsx
// components/vendor/VendorSpecsSection.tsx

import { VENDOR_CATEGORIES } from '@/lib/vendor-categories'

export function VendorSpecsSection({ vendor }) {
  const category = VENDOR_CATEGORIES.find(c => c.slug === vendor.category)
  if (!category || category.slug === 'autre') return null

  // Filtrer pour ne garder que les specs effectivement renseignées
  const filledSpecs = category.specs.filter(spec => {
    const value = vendor.specs?.[spec.key]
    return value !== null && value !== undefined && value !== ''
  })

  // Ne pas afficher la section si rien n'est renseigné
  if (filledSpecs.length === 0) return null

  return (
    <section className="fiche-section">
      <div className="fiche-section-eyebrow">Caractéristiques · {category.label}</div>
      <h2 className="h2-ed">Le <em>détail</em> de la prestation</h2>
      <div className="specs-grid">
        {filledSpecs.map(spec => (
          <SpecRow
            key={spec.key}
            label={spec.label}
            value={vendor.specs[spec.key]}
            type={spec.type}
          />
        ))}
      </div>
    </section>
  )
}
```

### Composant d'édition côté pro

L'écran d'édition de la fiche pour les prestataires doit aussi être adaptatif :

```tsx
// app/(pro)/pro/fiche/page.tsx

export default async function ProFichePage() {
  // ... fetch vendor data
  const category = VENDOR_CATEGORIES.find(c => c.slug === vendor.category)

  return (
    <form action={updateVendorSpecs}>
      {/* Sections communes : nom, catégorie, ville, bio, photo */}
      <CommonFields vendor={vendor} />

      {/* Section dynamique selon catégorie */}
      {category && category.slug !== 'autre' && (
        <SpecsEditor category={category} vendor={vendor} />
      )}

      <button type="submit">Enregistrer</button>
    </form>
  )
}
```

L'éditeur affiche les 5-6 champs de la catégorie avec leurs labels et placeholders, **tous optionnels**. Le prestataire remplit ce qu'il veut.

## Règles de design et UX

### Tous les champs sont optionnels

**Aucune caractéristique ne doit être obligatoire.** Le prestataire saisit uniquement ce qui s'applique à son offre. Si un champ est vide, il n'est pas affiché sur la fiche publique. Pas de tiret, pas de "non renseigné", rien — la ligne disparaît.

### Affichage en grille à 2 colonnes sur desktop, 1 colonne sur mobile

```css
.specs-grid { grid-template-columns: 1fr 1fr; gap: 12px 24px; }
@media (max-width: 540px) { .specs-grid { grid-template-columns: 1fr; } }
```

### Les champs longs (multi-tags) prennent toute la largeur

Si une caractéristique est de type "multiselect" (ex: régimes alimentaires gérés par un traiteur), elle peut prendre `grid-column: 1 / -1` pour s'étaler sur les 2 colonnes.

### Aucune section "Caractéristiques" si aucun champ n'est rempli

Si le prestataire n'a rien rempli (cas typique d'une fiche fraîchement créée), la section entière n'apparaît pas. La fiche reste cohérente avec juste l'en-tête, la bio, le portfolio et les tarifs.

### Format des valeurs

- **Texte court (text)** : affichage direct
- **Boolean** : affiché comme "Oui" / "Non" (préférer reformuler en texte ; ex: "Album inclus : Oui" → simplement afficher "Album inclus" si vrai, ou ne pas afficher la ligne si faux)
- **Multiselect** : tags or pour les options choisies (ex: pour les régimes alimentaires gérés)

## Filtres de recherche

Dans `/recherche`, certains filtres ne s'appliquent qu'à certaines catégories :

- "Capacité d'accueil" → uniquement quand catégorie = lieu de réception
- "Style photographique" → uniquement quand catégorie = photographe
- "Régimes spéciaux" → uniquement quand catégorie = traiteur ou goodies
- etc.

Le moteur de recherche doit gérer ces filtres conditionnels. Les filtres communs (ville, prix, disponibilité, ambiance) restent toujours visibles.

## Migration et seed des données

Quand tu mettras en place ce système, prévois :

1. **Migration de la colonne `specs`** dans la table `vendors`
2. **Seed des 18 catégories** dans `lib/vendor-categories.ts`
3. **Page d'aide pour les pros** : "Comment optimiser votre fiche · les 6 informations qui font la différence"
4. **Validation côté serveur** : pas de validation stricte sur les champs, mais une longueur max de 200 caractères par valeur pour éviter les abus

## Ce que tu dois faire (Claude Code)

1. **Lis la maquette** `maquette/fiches-prestataires-maquette.html` et étudie les 4 exemples (lieu, photographe, traiteur, DJ).
2. **Ne code rien tout de suite.** Dis-moi en 10 lignes ce que tu as compris.
3. **Pose tes questions** sur les points qui te semblent ambigus :
   - Est-ce que le schéma JSONB te paraît adapté ou tu vois un avantage à des colonnes typées ?
   - Comment gérer la migration si on ajoute un champ à une catégorie existante ?
   - Comment gérer le cas d'une catégorie qui change de slug (ex : "photographe" → "photographe-videaste") ?
4. **Propose une stratégie d'implémentation** : par où commencer (les 4 catégories les plus importantes, puis les autres ?), comment tester ?
5. **Attends mon feu vert** avant de coder.

## Erreurs à NE PAS faire

- ❌ Créer 18 colonnes typées dans `vendors` pour chaque caractéristique de chaque catégorie. Tu vas avoir une table avec 90 colonnes vides la plupart du temps.
- ❌ Rendre certains champs obligatoires "pour que la fiche soit complète". Le prestataire abandonnera son inscription au lieu de remplir.
- ❌ Afficher des lignes vides "non renseigné" sur la fiche publique. Cela donne une impression de mauvaise qualité.
- ❌ Forcer le prestataire à choisir parmi des options figées si un champ peut être en texte libre. Ex : "Style photographique" est mieux en texte libre qu'en select de 5 options qui ne couvriront jamais tous les cas.
- ❌ Ajouter de la complexité inutile (validations strictes, calculs complexes, dépendances entre champs). KISS.
- ❌ Forcer un `category = 'autre'` à remplir des caractéristiques. Pour cette catégorie, seule la bio compte.

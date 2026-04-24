# Le Carnet des noces — Prompt de démarrage Claude Code

## Contexte

Je démarre un projet web from scratch. Le projet s'appelle **Le Carnet des noces**. C'est une plateforme de mise en relation entre couples qui se marient et prestataires de mariage, ciblée sur le Roussillon (Pyrénées-Orientales).

Le dossier courant contient uniquement un sous-dossier `maquette/` avec un fichier HTML qui est **la maquette finale visuelle et fonctionnelle**. Tout le reste est à construire.

## Ta mission

Avant d'écrire la moindre ligne de code, tu dois :

1. **Lire intégralement** `maquette/carnet-des-noces-site-complet.html`. Ne survole pas. Ce fichier fait environ 5 800 lignes et contient 27 écrans dans une navigation à onglets. C'est la source de vérité absolue pour le design, les libellés, les flows utilisateurs et la logique produit.

2. **Me restituer** ce que tu as compris, en 15 lignes maximum :
   - Le positionnement produit
   - Les 3 grandes zones (public / couple / prestataire)
   - Les principaux flows utilisateurs
   - Le modèle économique
   - L'ADN visuel

3. **Me poser les questions qui te manquent** avant de proposer quoi que ce soit. N'invente rien, ne suppose rien. Si quelque chose te semble ambigu dans la maquette, pose la question.

4. **Ensuite seulement**, tu me proposeras :
   - Une stack technique
   - Une structure de projet
   - Un plan de développement en sprints

Ne lance **aucune installation**, n'écris **aucun fichier de code**, ne crée **aucun dossier** avant que j'aie validé ta compréhension et répondu à tes questions.

## Principes de travail non négociables

- **La maquette est la référence.** Ne la "modernise" pas, ne change pas les libellés, ne remplace pas le design system par quelque chose de plus "propre". Les polices (Cormorant Garamond + Jost), les couleurs (ivoire, or, taupe, encre), les ornements (chiffres romains, italiques, "Bon à savoir 🌿"), tout est volontaire et fait partie de la valeur produit.

- **Mobile-first.** La cible principale est une mariée qui consulte sur smartphone.

- **Pas de sur-ingénierie.** Pas de monorepo, pas de microservices, pas de GraphQL. Un framework standard, une base de données standard, un hébergement standard. 95 % des fonctionnalités de ce MVP se font avec des outils courants.

- **Poser des questions plutôt que deviner.** Mieux vaut 5 questions en début de sprint qu'un jour de refactoring.

- **Commits en français**, courts et descriptifs. Pas de `fix stuff`, pas de `WIP`.

## Quelques garde-fous factuels à respecter dès le départ

Ces éléments sont déjà tranchés et ne sont pas à rediscuter :

- Commission : **3 % à la charge du couple** (en sus du montant), quel que soit le type de prestataire
- Paiement : **carte bancaire uniquement**, via Stripe Connect, 3D Secure obligatoire
- Pas de remboursement automatique, médiation gratuite en cas de litige
- Les wedding planners s'inscrivent comme des prestataires classiques — pas d'outil collaboratif WP spécifique dans ce MVP

## À toi

Lis la maquette, restitue-moi ce que tu as compris, et pose-moi les questions qui te manquent. N'écris pas de code tant que je ne t'ai pas donné le feu vert.

@AGENTS.md

# tvd-app-prototype

Application mobile React Native + Expo, développée seul, destinée à un public
francophone. Android d'abord (Pixel 6 Pro et émulateur), iOS ensuite.
Fonctionnalités et destination de publication non définies.

Ce fichier est la seule copie faisant foi des conventions applicables au code.
Il complète `AGENTS.md`, fourni par Expo, qui ne se modifie pas : **en cas de
conflit, ce fichier prime.** En cas de divergence avec un document de décision,
signaler l'écart plutôt que de choisir.

## Accompagnement

- Le développeur vient du web (PHP/WordPress) et débute en JavaScript/TypeScript,
  React et développement mobile. Expliquer brièvement un concept nouveau avant de
  s'en servir.
- Répondre en français.
- Distinguer ce qui est vérifié de ce qui est supposé.

## Stack

- Expo SDK 58 (React Native 0.88, React 19.3), modèle `default`, TypeScript.
- Expo Router, racine `src/app/` ; React Compiler activé.
- Node : version fixée par `.nvmrc` (26), gestionnaire de paquets npm.
- EAS (Expo Application Services) pour les builds dans le cloud.

## Environnement : WSL et Windows

Une seule machine de développement, YOGA-NUMA. **Toujours préciser où une
commande s'exécute** : WSL, Windows, téléphone ou cloud.

| Côté               | Contenu                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------ |
| WSL (Ubuntu 24.04) | Code, Git, Node (nvm), Metro, EAS CLI global, Claude Code                                  |
| Windows            | Android Studio, émulateur, serveur adb unique (`adb` dans WSL est un enrobage d'`adb.exe`) |

- Réseau WSL en mode miroir avec `hostAddressLoopback` ; règle de pare-feu
  Hyper-V `Metro8081` pour le port 8081.
- Ne jamais installer un second serveur adb ni le SDK Android dans WSL. Ne jamais
  modifier `.wslconfig`, les règles de pare-feu ni la configuration d'Android
  Studio : ces réglages relèvent du développeur.

### Relier un appareil à Metro

| Appareil                                                    | Chemin par défaut         | Repli                                                                                     |
| ----------------------------------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------- |
| Émulateur (lancé depuis Android Studio avant la touche `a`) | `npx expo start`          | `adb reverse tcp:8081 tcp:8081` puis `npx expo start --localhost`                         |
| Pixel 6 Pro                                                 | `npx expo start` en Wi-Fi | USB : `adb -s 23021FDEE003DX reverse tcp:8081 tcp:8081` puis `npx expo start --localhost` |

Fermer Expo Go avant `adb reverse --remove-all`, sinon la commande se bloque.

## Builds

- Les builds natifs, development builds compris, se font **par EAS, dans le
  cloud** (`eas build --profile development`).
- Pas de build natif local (`npx expo run:android`) : la chaîne de compilation
  Android n'est pas installée dans WSL. Ce repli ne s'envisage que si EAS échoue,
  sur décision du développeur : le proposer, ne jamais installer l'outillage de
  soi-même.
- EAS CLI : utiliser le `eas` installé globalement, et non
  `npx eas-cli@latest` comme le suggère `AGENTS.md`.
- Signaler avant d'agir tout service payant (plan EAS, compte développeur Google
  ou Apple).
- Signaler tout ce qui exige un Mac (build iOS local, simulateur, signature
  Apple), pour que ces séances soient regroupées.

## Règles dures

- **Aucune version, option ou compatibilité donnée de mémoire.** Vérifier dans la
  documentation (docs.expo.dev pour la version du SDK du projet, reactnative.dev,
  developer.android.com) et citer la source avec sa date de consultation.
- **Aucun secret dans Git** : keystore Android, certificats Apple, jetons,
  fichiers `.env*`. Ils suivent une procédure de sauvegarde hors Git.
- Ajouter une dépendance par `npx expo install <paquet>`, jamais par
  `npm install <paquet>`.
- Ne jamais lancer `npm audit fix --force`. Réaligner les versions sur le SDK par
  `npx expo install --fix`.
- Ne pas passer à ESLint 10 ni forcer des versions par `overrides` : ESLint et
  ses extensions suivent la version installée par `npx expo install`.
- À chaque mise à jour du SDK, relancer `npm audit` et `npx expo install --check`,
  et signaler l'évolution du nombre d'alertes.
- Ne jamais créer ni éditer `android/` et `ios/` à la main (voir `AGENTS.md`).
- Demander confirmation avant toute commande destructive (`rm -rf`,
  `git reset --hard`, `git push --force`, suppression d'une branche distante).

## Vérifier avant de déclarer une tâche terminée

```bash
npx expo lint
npx tsc --noEmit
npm run format:check
```

Sur un clone neuf, `npx tsc --noEmit` signale de fausses erreurs (modules CSS) tant
que `npx expo start` n'a pas été lancé une fois : le fichier `expo-env.d.ts` est
généré par le serveur de développement et ignoré par Git.

Le formatage se corrige par `npm run format`, jamais à la main.

Si une commande propose d'installer ou de modifier une configuration, s'arrêter
et demander. Pour un changement visible à l'écran, décrire le contrôle manuel à
faire sur l'appareil.

## Règle de langue

| Catégorie                                       | Langue                                 |
| ----------------------------------------------- | -------------------------------------- |
| Identifiants (variables, fonctions, composants) | anglais                                |
| Noms de fichiers de code                        | anglais, en kebab-case comme le modèle |
| Commentaires                                    | français                               |
| Messages de commit                              | français                               |
| Textes de l'interface                           | français                               |

Pas de numéro de ligne d'une dépendance dans un commentaire : il devient faux à
la mise à jour suivante.

## Règles Git

Claude Code ne committe jamais. Une fois le travail terminé et les vérifications
passées, il propose le message de commit et une description si nécessaire. La
relecture des modifications et le commit sont toujours faits par le développeur.

Le compte rendu de fin de lot décrit ce que Claude Code pense avoir fait ; seul
`git diff` décrit ce qui est. Ne jamais affirmer qu'un fichier est ou n'est pas
commité sans avoir lu `git status`.

- Ne jamais committer de secret ni de fichier généré : tout ce que `.gitignore`
  exclut reste exclu.
- **Indexer par nom de fichier**, jamais `git add .` ni `git commit -a`.
- Vérifier `git status` avant chaque commit.
- Réécriture d'historique (`--amend`, `reset --soft`) seulement tant que rien
  n'est poussé ; ensuite, un nouveau commit.
- Remote unique : `origin` = GitHub (dépôt privé `sinedolo/tvd-app-prototype`).
  Pas de miroir sur le NAS.

### Messages de commit : Conventional Commits 1.0.0

Référence : <https://www.conventionalcommits.org/fr/v1.0.0/>

- Format : `type(portée): description`. La portée est facultative, comme le
  permet la spécification : l'omettre quand aucune portée en usage ne convient,
  plutôt que d'en forcer une (`chore: compléter le gitignore…`).
- Types : feat, fix, chore, docs, refactor, style, test, build, ci, perf
- Description à l'impératif présent, en minuscule, sans point final, en français
- Une intention par commit
- Portées en usage : `claude`, `expo`, `eas`, `deps`, `vscode`, `app`. En ajouter
  une quand un nouveau domaine apparaît, et la reporter ici.
- Exemples :
  - `docs(claude): ajouter les conventions du projet`
  - `chore(eas): lier le projet au compte expo`
  - `chore(deps): réaligner les dépendances sur le sdk 58`
- Les messages de commit proposés ne contiennent pas de ligne `Co-Authored-By`

Les deux premiers commits du dépôt sont antérieurs à cette convention.

### Branches

- `main` porte l'état stable. **Aucun commit direct sur `main`.**
- Une branche par lot de travail, créée depuis `main` à jour : `feature/<sujet>`,
  `fix/<sujet>`, `chore/<sujet>` ou `docs/<sujet>`, en kebab-case. Fusion sur
  `main` en `git merge --no-ff`, pour qu'un commit de fusion marque chaque lot.
- Une branche fusionnée se supprime, en local et sur `origin`.
- Avant de commencer un lot, vérifier la branche courante (`git branch --show-current`).
- `spike/<sujet>` : banc d'essai jetable, jamais fusionné, supprimé en local et
  sur `origin` après consignation des résultats.

## Documents de décision

Ils vivent hors du dépôt (Obsidian, qui fait foi, et le projet Claude) : les
demander si le raisonnement derrière une règle est nécessaire.

| Document                          | Contenu                                                      |
| --------------------------------- | ------------------------------------------------------------ |
| Feuille de route                  | Étapes, tâches, statuts, points à vérifier                   |
| Décision 01 (stack)               | React Native + Expo, EAS ; Flutter en repli                  |
| Décision 02 (outillage)           | Architecture WSL/Windows, adb, réseau                        |
| Fiche de vérification 1.3 (spike) | Résultats des tests de l'outillage                           |
| Procédure côté Windows (1.4)      | WHPX, Android Studio, `.wslconfig`, `Metro8081`, Pixel 6 Pro |
| Procédure côté WSL (1.5)          | nvm et Node, enrobage `adb`, EAS CLI, chemins vers Metro     |
| Environnement de travail          | Machine, Git, VS Code, Claude Code                           |

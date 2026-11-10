# tvd-app-prototype

Prototype d'application mobile React Native + Expo (SDK 58), pour un public
francophone. Android d'abord ; iOS différé.

## Prérequis

- Node 26 (version fixée par `.nvmrc`, installable avec nvm) et npm
- Un development build installé sur l'appareil ou l'émulateur (`eas build --profile development`)

## Démarrer

```bash
npm install
npx expo start
```

## Vérifier

```bash
npx expo lint
npx tsc --noEmit
npm run format:check
```

Le formatage se corrige par `npm run format`.

## Conventions

Les conventions du projet (environnement WSL/Windows, builds, Git, langue du
code) sont dans [CLAUDE.md](CLAUDE.md).

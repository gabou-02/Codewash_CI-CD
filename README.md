# CodeWash : Level Up RPG

Educational RPG game for kids (mini-games, XP, achievements), built with
React + Vite and packaged as a Windows desktop app with Electron.
This repository is a legacy rescue project: the game was vibe-coded by a
non-developer and is being stabilized and cleaned by Code Wash Inc.

The technical debt register lives in `docs/DEBT.md`.

## Prerequisites

- Node.js 20 or newer
- npm

## Install

```bash
cd CodeWashGame
npm install
```

## Run

```bash
npm run dev            # browser version (Vite dev server)
npm run electron:dev   # desktop version (builds then launches Electron)
```

## Build the Windows executable

```bash
npm run electron:build
```

The GitHub Actions workflow `.github/workflows/build-exe.yml` also builds
the exe and publishes a release on every push to main.

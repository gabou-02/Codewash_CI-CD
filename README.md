# CodeWash : Level Up RPG

Educational RPG game for kids (mini-games, XP, achievements), built with
React + Vite and packaged as a Windows desktop app with Electron.
This repository is a legacy rescue project: the game was vibe-coded by a
non-developer and is being stabilized and cleaned by Code Wash Inc.

The technical debt register lives in `docs/DEBT.md`.

## Prerequisites

- Node.js **22.22.2+ or 24.15+** (Node 25 is not supported). The range is
  enforced by `engines` in `CodeWashGame/package.json` and mirrors `jsdom`, our
  strictest dependency. Check yours with `node --version`; the CI runs Node 24.
  Node 20 is too old: the jsdom test workers fail to start on it.
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

## Repositories and CI

Work happens on the private repository `gabou-02/Codewash_CI-CD`. Its `dev`
branch is copied to the school repository by `.github/workflows/mirror-dev.yml`
on every push to `dev`. The school repository is a mirror: **never push to it
directly**, or `dev` diverges there and the mirror starts failing.

The pipeline runs here, and only here. Both workflows are pinned to this
repository with:

```yaml
if: github.repository == 'gabou-02/Codewash_CI-CD'
```

Without that guard the mirrored copies ran again on the school organisation,
whose Actions budget is exhausted: the jobs died at startup in about three
seconds without running a step, and the school repository's Actions tab filled
up with red runs that meant nothing. They now skip cleanly there.

`main` is **not** mirrored. Pushing it to the school repository is a manual
step, to be agreed between us so it does not happen twice.

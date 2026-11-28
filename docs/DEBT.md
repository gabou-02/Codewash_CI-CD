# Technical Debt Register

Baseline: commit `415bedb` (project as received), 2026-11-12.
Every refactoring PR references one item (example: "Fixes D01").
Tags per item: effort (hours / days / week+) and status (open / in progress / done).

## 1. Map

Kids RPG: React 19 + Vite, packaged for Windows with Electron (plain 1280x720
window, no IPC).

Updated 2026-11-27. Dashed nodes are the layers extracted since the baseline;
everything solid is still as received. `src/theme/` arrives with PR #6.

```mermaid
graph TD
    MAIN[main.jsx<br>mounts I18nProvider] --> APP

    APP["App.jsx<br>1492 lines, 31 useState<br>still holds almost everything"]
    APP --> SKILL["SkillCard.jsx<br>778 lines, complexity 107<br>all 3 mini-games"]
    APP --> DRAWERS[3 drawers<br>settings / cosmetics / achievements]
    APP --> MODALS[modals<br>reset / bug report / parental]
    APP --> UI[small UI pieces<br>SafeImage, PixelHeart, toasts]
    APP --> UTILS[utils<br>game math, sounds, achievements]
    SKILL --> UTILS
    UTILS --> DATA[constants<br>gameData, achievements, assets]

    APP -.-> THEME
    APP -.-> I18N
    DRAWERS -.-> I18N
    DRAWERS -.-> THEME
    THEME -.-> DATA

    subgraph extracted [Extracted, tested, injectable]
        I18N["src/i18n/<br>translator · catalogs · storage<br>context · I18nProvider"]
        THEME["src/theme/<br>resolveTheme"]
    end

    classDef new stroke-dasharray: 5 5
    class I18N,THEME,extracted new
```

Where the state and the I/O live:

| Concern            | Where                                                                                       | Status                 |
| ------------------ | ------------------------------------------------------------------------------------------- | ---------------------- |
| Game state         | `App.jsx`, 31 `useState`, no context, props passed by hand (up to 21)                       | as received (D05)      |
| Saves              | `localStorage`, one JSON blob per profile (`heroSkills_v23_p1/2/3`), rewritten on every hit | as received (D17)      |
| Language choice    | `localStorage` via `src/i18n/storage.js`, the only module touching the global               | extracted              |
| Theme resolution   | `src/theme/resolveTheme.js`, pure, merges over a default theme                              | extracted (PR #6)      |
| Audio              | `new Audio` in 11 places, plus `soundManager.js`                                            | as received (D01, D06) |
| Microphone         | Google cloud API, no keys, no fallback                                                      | as received (D21)      |
| Randomness, timers | `Math.random` x34 and `setTimeout` x28, reached as globals                                  | as received (D06, D16) |

The two extracted layers follow the policy the subject asks for: I/O isolated
behind one module, dependencies injected, pure logic unit-tested without a DOM.
They are the shape the rest should converge to (D06).

Critical flows to freeze with tests: save/load, combat/XP, achievements,
mini-games, themes. Done so far: game formulas, achievements, i18n, theme
resolution, theme assets. Not yet: save/load, combat.

## 2. Baseline metrics

| What          | Value                                                                   |
| ------------- | ----------------------------------------------------------------------- |
| Test coverage | 0 % (after D08: gameUtils.js 80 % lines, gated at 80)                   |
| Code size     | 6 938 lines / 24 files (App.jsx 1492, GlobalStyles 1302, SkillCard 778) |
| Complexity    | worst 107 (SkillCard.jsx:65), 14 functions above 10                     |
| Duplication   | 2.5 % (6 clones, biggest 103 lines)                                     |
| npm run lint  | 28 errors, all from `._*` junk files                                    |
| Repo          | 243 MB assets, 374 `._*` files committed                                |

<details>

- Lines: `find src electron -name '*.js*' -not -name '._*' -exec wc -l {} +`
- Complexity: ESLint rule `complexity` (threshold 10), JSX enabled
- Duplication: `npx jscpd src electron --min-tokens 50`
- Coverage: `npm run test:coverage` (v8 provider, `include: ['src/**']`)

Re-measure after each phase.
</details>

### Measurement log

Dated, so every claim of progress can be checked against a commit.

| Date       | Change                                               | Coverage (lines) | Note                                                             |
| ---------- | ---------------------------------------------------- | ---------------- | ---------------------------------------------------------------- |
| 2026-11-12 | baseline `415bedb`                                   | 0 %              | project as received                                              |
| 2026-11-19 | D08 safety net                                       | 19.3 %           | game formulas under characterization tests                       |
| 2026-11-24 | i18n layer (Translation mission)                     | 51.6 %           | jsdom component tests reach `App.jsx`, 0 % -> 30 % on that file  |
| 2026-11-25 | Prettier + five CI gates (D33)                       | 49.5 %           | whole tree formatted; global thresholds ratcheted 14 % -> 49 %   |
| 2026-11-27 | theme assets under test (D11)                        | 49.6 %           | 101 -> 133 tests; `SafeImage.jsx` 0 % -> 100 %                   |
| 2026-11-27 | D02 fix + profile loading extracted, merged with D11 | 53.4 %           | 159 tests; `src/profile/` at 100 %; `App.jsx` 1840 -> 1658 lines |

## 3. Fix first (P1)

- **D01 · Game almost silent** · two separate causes, both live. (a) `soundManager.js`
  looks in `sounds/ui/`, files are in `sounds/ui/ui/` (same for mob); errors hidden by
  `.catch(() => {})`. (b) `gameData.jsx:21-32` declares 10 flat `assets/sounds/*.wav`
  paths matching no file at all, and they are consumed: `SkillCard.jsx:309` does
  `new Audio(BASE_ASSETS.audio.mismatch)`. Cause (b) found while fixing D11.
  (hours, open)
- **D02 · Profile switch corrupts data** · `App.jsx` `handleSwitchProfile` : stats and
  border cosmetics never reloaded, so both autosaves write the old player's stats and
  border into the new profile. (days, done: profile loading extracted to
  `src/profile/profileStorage.js` under characterization tests, switch now reloads
  everything through `loadProfile`; regression test `App.profileSwitch.test.jsx`)
- **D03 · Corrupted save = white screen** · `App.jsx:51` : JSON.parse without try/catch at
  startup, no error boundary. (hours, open)
- **D04 · Double effects in dev** · `App.jsx:569` : sounds/badges/timers fired from inside a
  state updater; StrictMode runs it twice. (week+, open)
- **D05 · Two god components** : App.jsx (one 361-line function) and SkillCard.jsx
  (complexity 107, 1100-char lines). Untestable. (week+, in progress: profile loading
  moved out with D02, App.jsx 1840 -> 1658 lines after Prettier)
- **D06 · No seams** : all I/O hit as globals; wrappers needed before testing. (days, in
  progress: `src/i18n/storage.js` and `src/profile/profileStorage.js` take an injected
  storage; saves are still written straight to localStorage by App)
- **D07 · CI publishes a public release on every push** · `build-exe.yml:43`. (hours,
  done: workflow now runs on tags/manual only; it was in fact inert, `.github` sits
  in CodeWashGame/ and GitHub only reads workflows at the repo root)
- **D08 · No test/lint/coverage in CI**. (days, done: Vitest + 19 characterization
  tests on the game formulas, root ci.yml runs lint + build + tests + coverage gate)
- **D09 · 374 `._*` junk files** : cause all 28 lint errors, block lint as a gate. (hours,
  done: lint 28 errors -> 0)
- **D10 · No README / .gitignore**. (hours, done)

## 4. Fix soon (P2)

- **D11 · 3 of 4 themes visibly broken** · `gameData.jsx` `THEME_CONFIG` : 4 missing
  images, spy background = minecraft.png. (hours, done: spy background -> spy.png, the
  three dangling card backs -> the generic memorycard.jpg, spy logo -> explicit `null`
  since no art exists, dead `fallbackSrc` prop removed from App.jsx. Guarded by
  `gameData.themes.test.js`, which reads the real `public/` tree and fails on any
  dangling theme asset. Theme-specific art stays with D12)
- **D12 · Theme = wallpaper only** : empty mob lists, hardcoded colors everywhere, shuffled
  theme identities. The "crafting table" the subject names is the **writing** mini-game
  (`fantasyName: "Crafting Table"`), not cleaning, which is "Chest Management".
  (days, open)
- **D13 · Minecraft hardcoded in the domain** : mobs, badges, words, skill names; shown in
  every theme. Blocks the Themes mission. (week+, open)
- **D14 · XP math inconsistent** · `App.jsx:711` : multi-level gain reuses one threshold;
  UI vs engine off by one at level 20. (days, open)
- **D15 · Unreachable achievements** : perfectionist (stat never incremented), full_set
  (needs 8 badges, cap is 7), speed_demon (counts forever). (hours, open)
- **D16 · Timers never cleaned** : 21 of 28 setTimeout leak; Simon keeps playing after exit,
  mic restarts itself. (days, open)
- **D17 · Fragile slow saves** : ad-hoc migration, display data persisted, full write per
  hit, reset = page reload. (days, open)
- **D18 · Copy-paste x6** : letter-slot input x4, audio snippet x6, tooltips x3. (days, open)
- **D19 · Dead code** : 2 orphan files, 9 unused exports, ~330 lines dead CSS, inert
  tailwind.config.js. (hours, partly done: `MenuDrawer_old.jsx` (231 lines, imported
  nowhere) and the stray root `test.md` deleted; the unused exports, the dead CSS and
  the inert tailwind config remain)
- **D20 · 3 competing stylesheets** : 1302-line CSS string in JSX + index.css duplicates +
  inert Tailwind config. (days, open)
- **D21 · Mic feature likely dead in the exe** : Google cloud API without keys, no fallback;
  background noise costs HP. (week+, open)
- **D22 · Electron security** : no CSP, remote content, no nav guard, parental password in
  the bundle. (days, open)
- **D23 · Window too small** : fixed 720p, no scroll, content ~900+ px; battle panel off
  screen. (days, open)
- **D24 · Bug Report button is a stub** : "Whoa... That sucks...", no form, no close button.
  This is the Bug Reporting mission. (days, open)
- **D25 · Fragile build** : undocumented rolldown-vite alias, Windows-only target, 162 MB of
  .wav in the exe. The CI also ran Node 20 while the toolchain needs newer (fixed:
  workflows pin Node 24 and `engines` mirrors jsdom's range, `^22.22.2 || ^24.15.0 ||
  > =26.0.0`, after jsdom workers failed to start on 20. npm only warns on a mismatch;
add `.npmrc`with`engine-strict=true` to make it block). (days, open)
- **D26 · Magic numbers** : boss cadence "20" x9 with 3 formulas, HP "10" x3, `#FFD700` x8.
  (days, open)
- **D32 · Most UI strings are still inline English** : the settings drawer and
  the main-menu buttons are extracted; the mini-games (`SkillCard.jsx`), the
  achievement drawer, the cosmetics drawer and the modals are not. Blocks a
  complete Translation delivery. (days, open)
- **D33 · `format:check` exists but is not enforced** : Prettier and the
  `format:check` script were installed, yet no CI step ran them, so a badly
  formatted commit still merged. Demonstrated once: the PR that added Prettier
  failed its own `format:check` on `vite.config.js` while the job was green.
  (hours, done: `ci.yml` now runs five gates per PR, format, lint at
  `--max-warnings 0`, build, coverage thresholds, and 80 % diff coverage via
  `diff-cover`; coverage published as artifact and PR comment; `dev` added to the
  push triggers. Static analysis added separately as
  `.github/workflows/codeql.yml`, `security-and-quality` queries, same repository
  guard as the others)

## 5. Later (P3)

- **D27 · Four product names** + stock Vite favicon. (hours, open)
- **D28 · No accessibility** : 2 aria-labels, no keyboard, mic-only reading. (week+, open)
- **D29 · Debug leftovers in UI** : 28 console.log, "LOGO PLACEHOLDER", "WIN". (hours, open)
- **D30 · Inconsistent rules** : wrong answers free in writing, Simon bonus discarded.
  (hours, open)
- **D31 · i18n layer has no plural rules** · `src/i18n/translator.js` : keys
  interpolate `{{vars}}` but cannot say "1 badge / 2 badges". Needs a `plural()`
  helper or `Intl.PluralRules` the first time a counted string is translated.
  Accepted knowingly, see `docs/adr/0001-i18n.md`. (hours, open)
- **D34 · Diff-coverage gate bypassed once** · PR #1 : the PR reformats the whole codebase,
  so diff-cover counts every line as modified (43 % < 80 %). Formatting only, verified by
  rebuilding the PR from dev + Prettier (only 2 eslint comments differ). Merged with that
  single check red, before branch rulesets existed. (hours, done, not to be repeated)
- **D35 · Trailing commas in profile cards** · `ProfileCard.jsx` : shows "P2," and
  "Player 2," (present since `415bedb`). (hours, done: both commas removed)
- **D38 · Format gate did not cover the repository root** : `format` and
  `format:check` ran `prettier` from `CodeWashGame/`, so the root markdown, `docs/`
  and the workflows were never checked. (hours, done: both scripts now include
  `../*.md`, `../docs/**/*.md` and `../.github/**/*.yml`)
- **D36 · Warning on every fresh profile** · `profileStorage.js` `loadTheme` / `loadStats` :
  `JSON.parse(null).theme` throws when a profile has no save yet, caught and logged with
  `console.warn`. Harmless for the player, noisy in the console; frozen by the
  characterization tests. (hours, open)
- **D37 · Release workflow paths broken after the move** · `build-exe.yml` : moving the
  workflow to the repo root (D07) fixed the `run:` steps with `working-directory`, but
  `uses:` steps ignore it. `setup-node` looked for `package-lock.json` at the root (no
  `cache-dependency-path`), and the upload and release steps looked for
  `release/LevelUpRPG-Portable.exe` instead of `CodeWashGame/release/`. Any `v*` tag or
  manual run would have failed before producing the exe. Found while writing the
  changelog, never observed in a run. (hours, done: both paths point into
  `CodeWashGame/`; to confirm with one manual run of the workflow)

## 6. Risk matrix

|                   | Low likelihood     | Medium                                           | High                    |
| ----------------- | ------------------ | ------------------------------------------------ | ----------------------- |
| **High impact**   | D21                | D02, D04, D13                                    | D01, D05, D06, D07, D08 |
| **Medium impact** | D17, D30           | D11, D12, D14, D16, D18, D22, D23, D24, D25, D26 | D03, D09, D10, D33, D37 |
| **Low impact**    | D19, D27, D31, D34 | D20, D28, D29, D32                               | D15, D35, D36           |

## 7. Attack plan

1. **Hygiene** (no behavior change): remove `._*` (D09), commit README/.gitignore (D10),
   stop release spam (D07).
2. **Safety net**: Vitest + characterization tests (math, then save/load, then combat),
   CI gates (D08), minimal seams (D06).
3. **Visible fixes under test**: D01, D03, D11, D15. Mid-term demo material.
4. **Hotspots**: D05, D04, D02, D16, D17. Re-measure after each PR.
5. **The 4 missions**: Bug Reporting (D24), Translation (D32), Themes (D11, D12, D13),
   Trivia (new game).
6. **Handover**: ADRs, runbook, changelog; this file maps the remaining debt.

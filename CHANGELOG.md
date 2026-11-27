# Changelog

What changed between the project as received and what we deliver. Format based
on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

The baseline is commit `415bedb` (2026-11-12), the vibe-coded project exactly as
handed to us. Every entry names the debt item it closes, so it can be traced
back to `docs/DEBT.md` and forward to the pull request that did it.

## [Unreleased]

### Added

- **Internationalisation** (D32). A four-module i18n layer under
  `CodeWashGame/src/i18n/`: pure translation logic, locale discovery, an isolated
  storage wrapper, and the React binding. A language button in the main menu,
  English and French shipped. Locale files are discovered from
  `src/i18n/locales/*.json`, so adding a language is adding one file. See
  `docs/adr/0001-i18n.md` and `docs/ADD_A_LANGUAGE.md`.
- **Test suite**, from nothing to 159 tests. Characterization tests on the game
  formulas, achievements (D08) and save loading (D02), the "language battery"
  that fails the CI when a locale is missing a key, guard tests on theme assets,
  and the first component tests in the project.
- **jsdom test environment** (D08), with `jsdom` and `@testing-library/react`.
  `App.jsx` turned out to render under jsdom, which opened component testing for
  the whole codebase and took line coverage from 19 % to 51 %.
- **Five CI quality gates** on every pull request (D08, D33): format check, lint
  with warnings counted as errors, build, coverage thresholds, and 80 % coverage
  of the lines a PR changes. Coverage is published as an artifact and as a PR
  comment. Nothing merges on red.
- **Prettier**, with `format` and `format:check` scripts and a `.prettierignore`.
  `eslint-config-prettier` is loaded last in `eslint.config.js`, so ESLint never
  reports a style rule that Prettier would rewrite, and `coverage/` is ignored by
  the linter.
- **Mirror workflow** (`mirror-dev.yml`). Every push to `dev` on the team
  repository is copied to the school repository over SSH (secret
  `SCHOOL_SSH_KEY`), so the school repository is always up to date without
  pushing twice. `ci.yml` and the mirror job only run on the team repository:
  copied to the school one, they are skipped instead of failing there.
- **Coverage reports** (D08) in `lcov`, `json-summary`, `json` and `html`. `lcov`
  feeds the diff-coverage gate, the JSON files feed the PR comment, and the HTML
  report (`coverage/index.html`) is for browsing locally. Reports are written even
  when a test fails, and test files and `src/main.jsx` are excluded from the
  measure.
- **Profile save module** (D02, D05, D06). `CodeWashGame/src/profile/profileStorage.js`
  holds the save-loading logic that lived inside `App.jsx`: skills, theme, stats,
  border cosmetics, and the per-profile summary shown on the profile cards. Every
  function takes an injected storage (`localStorage` by default), following the
  shape of `src/i18n/storage.js`, so save formats are testable without a browser.
  Frozen by 25 characterization tests, quirks included, and gated at 100 %.
- **Regression test for profile switching** (D02). `App.profileSwitch.test.jsx`
  renders the real game under jsdom, switches from profile 1 to profile 2 through
  the settings drawer, and checks that neither save was overwritten. It fails on
  the code as received.
- **Guard tests for theme assets** (D11). `gameData.themes.test.js` reads the
  real `public/` tree and fails on any theme asset that does not exist, on a
  background shared between two themes, or on a mismatch between `THEME_CONFIG`
  and the theme menu.
- **Documentation**: this changelog, `docs/DEBT.md` (the technical debt register,
  with a dated measurement log), `docs/adr/0001-i18n.md`, `docs/ADD_A_LANGUAGE.md`,
  a README, and a `.gitignore` (D10).
- **Accessible names** on the four main-menu buttons that had none, settings,
  cosmetics, achievements and bug report, and proper `listbox` semantics on the
  language selector (partial D28).
- **`engines` field** declaring the supported Node range, mirroring `jsdom`, our
  strictest dependency.

### Changed

- **The whole tree is Prettier-formatted.** One mechanical pass, no behaviour
  change. Verified by reformatting the pre-pass sources and diffing: only two
  files differed, both because an `eslint-disable-next-line` comment had to move
  inside a callback Prettier had split.
- **CI also runs on pushes to `dev`** (D33), not only on `main`, so a direct push
  or the result of a merge is checked too. A new push cancels the run it made
  obsolete, and the workflow token is limited to reading the code and writing the
  PR coverage comment.
- **CI runs Node 24** instead of Node 20 (D25). Node 20 broke the jsdom test
  workers through `undici`, and `@electron/rebuild` had been warning
  `EBADENGINE` on every run, so the exe was being built on an unsupported Node.
- **Coverage thresholds ratcheted** as coverage grew, 0 % to 14 % to 49 % to 53 %
  global, with per-file floors at 100 % on the i18n layer and the profile module.
- **`App.jsx` loads saves through `profileStorage`** (D05). The loading code was
  moved out unchanged, taking `App.jsx` from 1840 to 1658 lines (counted after the
  Prettier pass).
- **Settings drawer** text comes from the translation catalogs instead of being
  inline (D32).

### Fixed

- **Switching profile overwrote the new profile's save** (D02). The switch reloaded
  skills and theme but not stats or border cosmetics, so the autosave wrote the
  previous player's monster counts, deaths and achievement progress, plus their
  border, into the profile being opened. Silent data loss, no error shown. The
  switch now reloads everything through one `loadProfile` call. The border is set
  directly rather than through `handleBorderChange`, so a profile switch is not
  counted as a border change towards achievements.
- **Themes 2, 3 and 4 rendered wrong** (D11). The spy theme used the Minecraft
  wallpaper as its background while its own image existed on disk. Three card
  backs and one logo pointed at files that were never shipped, and `SafeImage`
  silently swallowed the 404s into a placeholder box, so nothing ever failed
  loudly. The spy logo is now an explicit `null` since no art exists for it.
- **`SafeImage` was given a prop it does not accept.** `App.jsx` passed a
  `fallbackSrc` pointing at an external placeholder service; it had been ignored
  since it was written. Removed rather than implemented: the game ships as an
  offline exe, and loading remote content conflicts with D22.
- **CI published a public release on every push** (D07). Now runs on tags and
  manual dispatch only.
- **The release workflow never ran** (D07). `build-exe.yml` sat in
  `CodeWashGame/.github/workflows/`, and GitHub only reads workflows at the
  repository root, so the exe was never built by the CI. It now lives in
  `.github/workflows/` and runs `npm` from `CodeWashGame/`. Pushing a `v*` tag is
  meant to build the Windows exe and publish a release, a manual run to build it
  as an artifact only.
- **374 committed `._*` junk files** (D09), which caused all 28 lint errors and
  blocked using lint as a gate. Lint went from 28 errors to 0.
- **Release workflow could not find `package.json`**, so the exe build failed.

### Known issues

The debt we hand over is listed in `docs/DEBT.md`, with a risk matrix and effort
estimates. The ones most likely to bite a new team first:

- **The game is still almost silent** (D01). Two separate causes: a nested
  folder mismatch in `soundManager.js`, and 10 sound paths in `gameData.jsx`
  that match no file while being consumed by `SkillCard.jsx`.
- **A corrupted save renders a white screen** with no recovery path (D03).
- **`App.jsx` (1658 lines) and `SkillCard.jsx` (complexity 107) are still god
  components** (D05). Saves are read through an injected storage now, but still
  written straight to `localStorage` by `App.jsx`, and the other I/O (audio, mic,
  clock, randomness) is still reached as globals (D06).
- **Themes only change the wallpaper** (D12), because the domain is hardcoded
  Minecraft (D13).
- **Most UI text is still inline English** (D32), and the i18n layer has no
  plural rules (D31).

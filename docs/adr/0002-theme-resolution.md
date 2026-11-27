# 2. A theme is data merged over a default, not a lookup

Date: 2026-11-27
Status: accepted

## Context

Three of the four shipped themes were a wallpaper and nothing else. The cause
was structural, not cosmetic. `THEME_CONFIG` held whatever each theme happened
to define, and every consumer invented its own fallback:

```js
const currentThemeData = THEME_CONFIG[activeTheme] || THEME_CONFIG.minecraft;
themeData.assets.mobs[mobName] || BASE_ASSETS.axolotls.Pink;
const skillThemeConfig = themeData.skills[config.id] || {};
```

So a theme that declared `mobs: {}` got no creatures at all, and a theme that
named four of its six skills showed blanks for the other two. The fallback was
per-call-site, inconsistent, and in one case resolved to a pink axolotl.

A second structure, `THEMES_LIST`, held the menu entries. It had to agree with
`THEME_CONFIG` by hand, and it did not: it advertised `spy.png` while the config
used `minecraft.png` (D11).

The mission requires two new themes and, explicitly, that adding further ones be
streamlined for people who are not technical.

## Decision

One module, `src/theme/resolveTheme.js`, owns the question "what does theme X
look like". It is pure and dependency-free, so it runs in the plain `node` test
environment.

1. **Merge over a default theme.** `resolveTheme(id, config)` returns a complete
   theme: every field filled, every skill present, every creature resolved.
   `mobs` and `skills` merge key by key, so a theme can override one creature or
   one skill name and inherit the rest. `style`, `logo` and `cardBack` are
   replaced wholesale, because a half-merged background is never wanted.
2. **`null` means "deliberately absent".** A theme writing `logo: null` keeps
   that null through the merge instead of inheriting the default logo;
   `SafeImage` then draws its own placeholder. Omitting the key inherits. The
   distinction matters: the spy theme has no logo art, and that is a fact to
   record, not a gap to paper over.
3. **An unknown id resolves to the default** rather than throwing. A corrupted
   save must not be able to blank the screen (D03).
4. **The menu list is derived**, `listThemes(THEME_CONFIG)`. The parallel array
   is gone, so the two can no longer disagree.

Consumers lost their ad-hoc fallbacks: `App.jsx` calls `resolveTheme` once.

## Consequences

Good:

- Adding a theme is one entry in one file. The `fantasy` and `scifi` themes
  added here are about twenty lines each, and most of that is skill naming.
  `docs/ADD_A_THEME.md` is the non-technical version of that procedure.
- A theme can be filled in gradually. Replace one creature, name two skills,
  ship it; nothing shows a gap in the meantime.
- The resolution logic is unit-tested at 100 %, and `gameData.themes.test.js`
  checks the configuration against the real `public/` tree, so a theme naming a
  file that does not exist fails the CI (D11).

Costs and limits:

- **The default theme is still the Minecraft one.** Structurally every theme now
  overrides a base; in practice that base is Minecraft artwork and Minecraft
  creature names, so an unthemed creature still looks like Minecraft. Fixing
  that needs artwork, not code, and stays tracked as D13.
- **Sounds, music and colours do not follow the theme yet.** The resolver has no
  opinion about them because nothing in the codebase routes them through a
  theme. Tracked as D12.
- The merge is shallow by design, two levels deep. A future theme needing
  per-skill assets would have to extend `mergeOverDefault` rather than nest
  deeper and hope.

## Alternatives rejected

- **Require every theme to declare everything.** Would have made the config
  self-contained and removed the merge entirely, but it also makes adding a
  theme a 150-line copy-paste, which is the opposite of the requirement.
- **Fall back at the call site, consistently.** Cheaper to write, but it leaves
  the fallback rule duplicated at every consumer, which is exactly the state
  that produced the bug.

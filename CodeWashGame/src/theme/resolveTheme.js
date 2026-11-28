/**
 * Theme resolution (D12, D13).
 *
 * One place answers "for theme X, what is the background, the logo, the card
 * back, the image for mob M, the name of skill S". Before this module, callers
 * reached into THEME_CONFIG directly and each one re-invented its own fallback,
 * usually `|| THEME_CONFIG.minecraft`, which is why three themes out of four
 * were only a wallpaper: anything a theme did not define simply went missing.
 *
 * Pure and dependency-free so it runs in the plain `node` test environment.
 *
 * The shape of a theme entry is documented in docs/ADD_A_THEME.md.
 */

/** Theme used for anything a theme does not define, and when the id is unknown. */
export const DEFAULT_THEME_ID = "minecraft";

/**
 * Merges a theme over the default one, field by field.
 *
 * Only `mobs` and `skills` merge key by key: a theme that names three mobs
 * keeps the default images for all the others, instead of rendering nothing.
 * `style`, `logo` and `cardBack` are replaced wholesale, because a half-merged
 * background is never what anyone wants.
 */
const mergeOverDefault = (theme, base) => ({
  ...base,
  ...theme,
  style: theme.style ?? base.style,
  assets: {
    ...base.assets,
    ...theme.assets,
    // `logo: null` is a deliberate "this theme ships no logo", so it must
    // survive the merge instead of falling back to the default theme's logo.
    logo: "logo" in (theme.assets ?? {}) ? theme.assets.logo : base.assets.logo,
    mobs: { ...base.assets.mobs, ...(theme.assets?.mobs ?? {}) },
  },
  skills: Object.fromEntries(
    Object.keys(base.skills).map((id) => [
      id,
      { ...base.skills[id], ...(theme.skills?.[id] ?? {}) },
    ]),
  ),
});

/**
 * Returns the complete theme for `themeId`, every field filled in.
 * An unknown id resolves to the default theme rather than throwing: a corrupted
 * save must not be able to blank the screen (see D03).
 */
export const resolveTheme = (themeId, config) => {
  const base = config[DEFAULT_THEME_ID];
  const theme = config[themeId];
  if (!theme) return mergeOverDefault({}, base);
  return mergeOverDefault(theme, base);
};

/**
 * Image for `mobName` in the resolved theme, falling back to the default
 * theme's art. Returns null when nobody has an image, which SafeImage renders
 * as its own placeholder.
 */
export const resolveMobImage = (theme, mobName) =>
  theme.assets.mobs[mobName] ?? null;

/**
 * The theme list the menu renders, derived from the config itself.
 *
 * This is what makes adding a theme a one-entry change: there is no second
 * list to keep in step. The previous THEMES_LIST was a parallel array that had
 * to agree with THEME_CONFIG by hand, and it did not.
 */
export const listThemes = (config) =>
  Object.entries(config).map(([id, theme]) => ({
    id,
    name: theme.name,
    img: theme.preview,
  }));

/**
 * Pure translation logic: no React, no I/O, no module-level state.
 *
 * Kept free of side effects on purpose, so it runs under the plain `node`
 * test environment configured in vite.config.js and needs no DOM. The React
 * binding lives in I18nProvider.jsx and the catalog discovery in catalogs.js.
 */

/** Language used when a key is missing from the active catalog. */
export const DEFAULT_LANGUAGE = "en";

/** Matches {{placeholder}} in a translation string. */
const PLACEHOLDER_PATTERN = /\{\{\s*([\w.]+)\s*\}\}/g;

/**
 * Walks a dotted path ("menu.settings.title") through a nested catalog.
 * Returns undefined unless the path resolves to a string, so a half-written
 * catalog can never inject an object into the UI.
 */
export const resolveKey = (catalog, key) => {
  if (!catalog || typeof key !== "string" || key === "") return undefined;

  const found = key.split(".").reduce((node, segment) => {
    if (node === null || typeof node !== "object") return undefined;
    return node[segment];
  }, catalog);

  return typeof found === "string" ? found : undefined;
};

/**
 * Replaces {{placeholder}} with the matching value from `vars`.
 * Unknown placeholders are left in place: a missing variable stays visible
 * during review instead of silently rendering "undefined".
 */
export const interpolate = (template, vars) => {
  if (typeof template !== "string") return template;
  if (!vars) return template;

  return template.replace(PLACEHOLDER_PATTERN, (match, name) => {
    const value = vars[name];
    return value === undefined || value === null ? match : String(value);
  });
};

/**
 * Translates `key` using the active language, falling back to
 * DEFAULT_LANGUAGE and finally to the key itself. Returning the key keeps an
 * untranslated screen readable and makes the gap obvious in a screenshot.
 */
export const translate = (catalogs, language, key, vars) => {
  const catalogSet = catalogs || {};
  const template =
    resolveKey(catalogSet[language], key) ??
    resolveKey(catalogSet[DEFAULT_LANGUAGE], key) ??
    key;

  return interpolate(template, vars);
};

/**
 * Builds the language list shown in the selector, straight from the loaded
 * catalogs: adding a language is adding a locale file, never editing a list.
 * Catalogs with no `$meta.name` are skipped rather than shown unnamed.
 */
export const listLanguages = (catalogs) =>
  Object.entries(catalogs || {})
    .map(([code, catalog]) => ({
      code,
      name: catalog && catalog.$meta ? catalog.$meta.name : undefined,
    }))
    .filter((language) => typeof language.name === "string")
    .sort((a, b) => a.name.localeCompare(b.name));

/**
 * Picks the language to start on: a stored choice wins, then any catalog
 * matching the host language ("fr-FR" matches the "fr" catalog), then the
 * default. Takes its inputs as arguments so tests need no browser globals.
 */
export const pickInitialLanguage = (
  catalogs,
  storedLanguage,
  systemLanguage,
) => {
  const available = new Set(Object.keys(catalogs || {}));

  if (available.has(storedLanguage)) return storedLanguage;

  const systemBase =
    typeof systemLanguage === "string"
      ? systemLanguage.split("-")[0]
      : undefined;
  if (available.has(systemBase)) return systemBase;

  return DEFAULT_LANGUAGE;
};

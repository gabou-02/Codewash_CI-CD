/**
 * Translation catalog discovery.
 *
 * Locale files are picked up from ./locales/*.json at build time, so adding a
 * language means dropping one JSON file in that folder: no list to edit, no
 * import to add, nothing to register. This is the whole point of the design
 * (see docs/adr/0001-i18n.md).
 *
 * A catalog announces its own code through "$meta.code"; the file name is only
 * a fallback, so renaming a file cannot silently change a language code.
 */

const localeModules = import.meta.glob("./locales/*.json", { eager: true });

/**
 * Language code taken from a locale file name, used only when a catalog
 * forgets its "$meta.code" (catalogs.test.js then fails on that catalog).
 * Exported so both branches are covered without a malformed locale file.
 */
export const codeFromPath = (path) => {
  const match = /([^/]+)\.json$/.exec(path);
  return match ? match[1] : path;
};

/**
 * Turns one glob entry into a [code, catalog] pair. Pure and exported so the
 * fallbacks are covered by tests instead of by a deliberately broken locale.
 */
export const toCatalogEntry = ([path, module]) => {
  const catalog = module.default ?? module;
  const declaredCode =
    catalog && catalog.$meta ? catalog.$meta.code : undefined;
  return [declaredCode || codeFromPath(path), catalog];
};

export const CATALOGS = Object.fromEntries(
  Object.entries(localeModules).map(toCatalogEntry),
);

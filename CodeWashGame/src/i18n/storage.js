/**
 * The only place in the i18n layer that touches a browser global.
 *
 * Isolating it keeps the provider and the translator testable without a DOM,
 * and makes the failure policy explicit: a disabled, full or absent storage
 * degrades into "no saved preference" instead of throwing during render.
 * See docs/DEBT.md (D06) for the wider seams effort.
 */

/** localStorage key holding the player's language choice. */
export const LANGUAGE_STORAGE_KEY = "language_v1";

/**
 * Builds a storage wrapper over `getStore`, which is called lazily so a
 * missing global only matters when a read or a write actually happens.
 */
export const createStorage = (getStore) => ({
  getItem: (key) => {
    try {
      return getStore().getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      getStore().setItem(key, value);
    } catch {
      // A language preference is not worth breaking a lesson over.
    }
  },
});

/** Wrapper used by the running app. */
export const browserStorage = createStorage(() => localStorage);

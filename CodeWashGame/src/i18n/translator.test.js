// Unit tests for the pure translation logic. New code, so every branch here is
// covered on purpose (see docs/DEBT.md: 100% on added code).
import { describe, it, expect } from "vitest";
import {
  DEFAULT_LANGUAGE,
  resolveKey,
  interpolate,
  translate,
  listLanguages,
  pickInitialLanguage,
} from "./translator";

const CATALOGS = {
  en: {
    $meta: { code: "en", name: "English" },
    settings: { title: "Settings", nested: { deep: "Deep" } },
    greeting: "Hello {{name}}, you are level {{level}}",
  },
  fr: {
    $meta: { code: "fr", name: "Français" },
    settings: { title: "Paramètres" },
  },
};

describe("resolveKey", () => {
  it("resolves a dotted path to its string", () => {
    expect(resolveKey(CATALOGS.en, "settings.title")).toBe("Settings");
    expect(resolveKey(CATALOGS.en, "settings.nested.deep")).toBe("Deep");
  });

  it("returns undefined for a missing key or a missing branch", () => {
    expect(resolveKey(CATALOGS.en, "settings.missing")).toBeUndefined();
    expect(resolveKey(CATALOGS.en, "nope.nope.nope")).toBeUndefined();
  });

  it("refuses a non-string leaf, so an object never reaches the UI", () => {
    expect(resolveKey(CATALOGS.en, "settings")).toBeUndefined();
  });

  it("guards against an absent catalog or an unusable key", () => {
    expect(resolveKey(undefined, "settings.title")).toBeUndefined();
    expect(resolveKey(CATALOGS.en, "")).toBeUndefined();
    expect(resolveKey(CATALOGS.en, 42)).toBeUndefined();
  });
});

describe("interpolate", () => {
  it("substitutes every placeholder, whatever the inner spacing", () => {
    expect(
      interpolate("Hi {{name}} and {{ other }}", { name: "A", other: "B" }),
    ).toBe("Hi A and B");
  });

  it("stringifies non-string values", () => {
    expect(interpolate("Level {{level}}", { level: 7 })).toBe("Level 7");
  });

  it("leaves an unknown or null placeholder visible instead of printing undefined", () => {
    expect(interpolate("Hi {{name}}", {})).toBe("Hi {{name}}");
    expect(interpolate("Hi {{name}}", { name: null })).toBe("Hi {{name}}");
  });

  it("passes through when there is nothing to interpolate", () => {
    expect(interpolate("Plain", undefined)).toBe("Plain");
    expect(interpolate(undefined, { a: 1 })).toBeUndefined();
  });
});

describe("translate", () => {
  it("uses the active language", () => {
    expect(translate(CATALOGS, "fr", "settings.title")).toBe("Paramètres");
  });

  it("falls back to the default language for a key the locale lacks", () => {
    expect(translate(CATALOGS, "fr", "settings.nested.deep")).toBe("Deep");
  });

  it("falls back to the key itself when no catalog has it", () => {
    expect(translate(CATALOGS, "fr", "totally.unknown")).toBe(
      "totally.unknown",
    );
  });

  it("interpolates after resolving", () => {
    expect(
      translate(CATALOGS, "en", "greeting", { name: "Eliott", level: 3 }),
    ).toBe("Hello Eliott, you are level 3");
  });

  it("survives an unknown language and a missing catalog set", () => {
    expect(translate(CATALOGS, "de", "settings.title")).toBe("Settings");
    expect(translate(undefined, "en", "settings.title")).toBe("settings.title");
  });
});

describe("listLanguages", () => {
  it("derives the selector list from the catalogs, sorted by name", () => {
    expect(listLanguages(CATALOGS)).toEqual([
      { code: "en", name: "English" },
      { code: "fr", name: "Français" },
    ]);
  });

  it("skips a catalog that declares no name rather than showing it unnamed", () => {
    expect(listLanguages({ xx: {}, yy: { $meta: {} } })).toEqual([]);
  });

  it("tolerates an empty or absent catalog set", () => {
    expect(listLanguages({})).toEqual([]);
    expect(listLanguages(undefined)).toEqual([]);
  });
});

describe("pickInitialLanguage", () => {
  it("prefers a stored choice", () => {
    expect(pickInitialLanguage(CATALOGS, "fr", "en-US")).toBe("fr");
  });

  it("falls back to the host language, region stripped", () => {
    expect(pickInitialLanguage(CATALOGS, null, "fr-FR")).toBe("fr");
  });

  it("ignores a stored or host language with no catalog", () => {
    expect(pickInitialLanguage(CATALOGS, "de", "es-ES")).toBe(DEFAULT_LANGUAGE);
  });

  it("defaults when nothing is known", () => {
    expect(pickInitialLanguage(CATALOGS, undefined, undefined)).toBe(
      DEFAULT_LANGUAGE,
    );
    expect(pickInitialLanguage(undefined, undefined, undefined)).toBe(
      DEFAULT_LANGUAGE,
    );
  });
});

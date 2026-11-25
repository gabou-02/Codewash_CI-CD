// The "language battery": these tests guard the locale files themselves.
// They are what keeps a new translation from shipping half-done, and they fail
// the CI when a key is added to one language and forgotten in another.
import { describe, it, expect } from "vitest";
import { CATALOGS, codeFromPath, toCatalogEntry } from "./catalogs";
import { DEFAULT_LANGUAGE } from "./translator";

/** Flattens a catalog into dotted leaf keys, ignoring the $meta block. */
const flattenKeys = (node, prefix = "") =>
  Object.entries(node)
    .filter(([key]) => key !== "$meta")
    .flatMap(([key, value]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      return value !== null && typeof value === "object"
        ? flattenKeys(value, path)
        : [path];
    });

const codes = Object.keys(CATALOGS);
const referenceKeys = flattenKeys(CATALOGS[DEFAULT_LANGUAGE]).sort();

describe("discovery", () => {
  it("finds the locale files without any manual registration", () => {
    expect(codes).toContain("en");
    expect(codes).toContain("fr");
  });

  it("ships the default language, or nothing could fall back", () => {
    expect(CATALOGS[DEFAULT_LANGUAGE]).toBeDefined();
  });
});

describe("codeFromPath", () => {
  it("reads the language code off a locale file name", () => {
    expect(codeFromPath("./locales/es.json")).toBe("es");
  });

  it("falls back to the raw path when it is not a locale file name", () => {
    expect(codeFromPath("weird-entry")).toBe("weird-entry");
  });
});

describe("toCatalogEntry", () => {
  it("keys a catalog by the code it declares, not by its file name", () => {
    const catalog = { $meta: { code: "es", name: "Español" } };
    expect(
      toCatalogEntry(["./locales/spanish.json", { default: catalog }]),
    ).toEqual(["es", catalog]);
  });

  it("accepts a module whose catalog is not under `default`", () => {
    const catalog = { $meta: { code: "de", name: "Deutsch" } };
    expect(toCatalogEntry(["./locales/de.json", catalog])).toEqual([
      "de",
      catalog,
    ]);
  });

  it("falls back to the file name when $meta is absent or incomplete", () => {
    expect(toCatalogEntry(["./locales/it.json", { default: {} }])[0]).toBe(
      "it",
    );
    expect(
      toCatalogEntry(["./locales/pt.json", { default: { $meta: {} } }])[0],
    ).toBe("pt");
  });
});

describe.each(codes)('catalog "%s"', (code) => {
  const catalog = CATALOGS[code];

  it("declares a $meta code matching the language it is registered under", () => {
    expect(catalog.$meta.code).toBe(code);
  });

  it("declares a non-empty display name for the selector", () => {
    expect(typeof catalog.$meta.name).toBe("string");
    expect(catalog.$meta.name.length).toBeGreaterThan(0);
  });

  it("covers exactly the keys of the default language", () => {
    expect(flattenKeys(catalog).sort()).toEqual(referenceKeys);
  });

  it("has a non-empty string behind every key", () => {
    for (const key of flattenKeys(catalog)) {
      const value = key
        .split(".")
        .reduce((node, segment) => node[segment], catalog);
      expect(typeof value, `${code}: ${key}`).toBe("string");
      expect(value.trim().length, `${code}: ${key}`).toBeGreaterThan(0);
    }
  });
});

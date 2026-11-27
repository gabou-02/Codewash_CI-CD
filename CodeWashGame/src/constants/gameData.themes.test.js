// Guard tests for the theme configuration (D11).
//
// The bug these freeze was not a logic error: THEME_CONFIG simply pointed at
// files that were never shipped, and SafeImage swallowed the 404 into a
// placeholder box. Nothing failed, the themes just looked broken. These tests
// make a dangling asset path fail the CI instead.
//
// They read the real `public/` tree, so they stay honest when assets move.
import { describe, it, expect } from "vitest";
import { existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { THEME_CONFIG, THEMES_LIST } from "./gameData";

const PUBLIC_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../public",
);

const resolve = (assetPath) => join(PUBLIC_DIR, assetPath);

/** Pulls the url('...') target out of a CSS backgroundImage value. */
const backgroundPath = (style) => {
  const match = /url\('([^']+)'\)/.exec(style.backgroundImage);
  return match ? match[1] : null;
};

const themeIds = Object.keys(THEME_CONFIG);

describe("THEME_CONFIG / THEMES_LIST consistency", () => {
  it("offers the same themes in the menu as in the config", () => {
    expect(THEMES_LIST.map((theme) => theme.id).sort()).toEqual(
      [...themeIds].sort(),
    );
  });

  it("names every theme the same way in both places", () => {
    for (const entry of THEMES_LIST) {
      expect(entry.name, entry.id).toBe(THEME_CONFIG[entry.id].name);
    }
  });

  it("gives every theme the full set of skills", () => {
    const skillIds = Object.keys(THEME_CONFIG.minecraft.skills).sort();
    for (const id of themeIds) {
      expect(Object.keys(THEME_CONFIG[id].skills).sort(), id).toEqual(skillIds);
    }
  });
});

describe.each(themeIds)('theme "%s"', (id) => {
  const theme = THEME_CONFIG[id];

  it("has a background image that exists on disk", () => {
    const path = backgroundPath(theme.style);
    expect(path, `${id}: no url() in backgroundImage`).toBeTruthy();
    expect(existsSync(resolve(path)), `${id}: missing ${path}`).toBe(true);
  });

  it("does not reuse another theme's background", () => {
    const own = backgroundPath(theme.style);
    const others = themeIds
      .filter((other) => other !== id)
      .map((other) => backgroundPath(THEME_CONFIG[other].style));
    expect(others, `${id}: ${own} is shared`).not.toContain(own);
  });

  it("has a card back that exists on disk", () => {
    const { cardBack } = theme.assets;
    expect(cardBack, `${id}: no cardBack`).toBeTruthy();
    expect(existsSync(resolve(cardBack)), `${id}: missing ${cardBack}`).toBe(
      true,
    );
  });

  it("either ships its logo or declares it absent with null", () => {
    const { logo } = theme.assets;
    if (logo === null) return; // deliberate: SafeImage draws its placeholder
    expect(typeof logo, `${id}: logo must be a path or null`).toBe("string");
    expect(existsSync(resolve(logo)), `${id}: missing ${logo}`).toBe(true);
  });

  it("points every declared mob image at a file that exists", () => {
    for (const [mob, path] of Object.entries(theme.assets.mobs)) {
      expect(existsSync(resolve(path)), `${id}/${mob}: missing ${path}`).toBe(
        true,
      );
    }
  });
});

describe("theme menu previews", () => {
  it.each(THEMES_LIST.map((theme) => [theme.id, theme.img]))(
    "%s preview image exists",
    (id, img) => {
      expect(existsSync(resolve(img)), `${id}: missing ${img}`).toBe(true);
    },
  );
});

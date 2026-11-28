// Unit tests for theme resolution (D12, D13). Pure logic, no DOM.
import { describe, it, expect } from "vitest";
import {
  DEFAULT_THEME_ID,
  resolveTheme,
  resolveMobImage,
  listThemes,
} from "./resolveTheme";

const CONFIG = {
  minecraft: {
    name: "Minecraft",
    preview: "base.png",
    style: { backgroundImage: "url('base.png')" },
    assets: {
      logo: "base_logo.png",
      cardBack: "base_card.jpg",
      mobs: { Zombie: "zombie.png", Creeper: "creeper.png" },
    },
    skills: {
      reading: { name: "Reading", boss: "Ender Dragon", mobType: "Standard" },
      math: { name: "Math", boss: "Wither" },
    },
  },
  spy: {
    name: "Spy",
    preview: "spy.png",
    style: { backgroundImage: "url('spy.png')" },
    assets: { logo: null, cardBack: "base_card.jpg", mobs: {} },
    skills: { reading: { name: "Intel Analysis", boss: "Double Agent" } },
  },
  fantasy: {
    name: "Fantasy",
    preview: "fantasy.png",
    style: { backgroundImage: "url('fantasy.png')" },
    assets: { cardBack: "base_card.jpg", mobs: { Zombie: "ghoul.png" } },
    skills: {},
  },
};

describe("resolveTheme", () => {
  it("keeps the theme's own background and name", () => {
    const theme = resolveTheme("spy", CONFIG);
    expect(theme.name).toBe("Spy");
    expect(theme.style.backgroundImage).toBe("url('spy.png')");
  });

  it("fills in mobs the theme does not define, which is what left three themes empty", () => {
    const theme = resolveTheme("spy", CONFIG);
    expect(theme.assets.mobs.Zombie).toBe("zombie.png");
    expect(theme.assets.mobs.Creeper).toBe("creeper.png");
  });

  it("lets a theme override one mob without losing the others", () => {
    const theme = resolveTheme("fantasy", CONFIG);
    expect(theme.assets.mobs.Zombie).toBe("ghoul.png");
    expect(theme.assets.mobs.Creeper).toBe("creeper.png");
  });

  it("keeps an explicit null logo instead of inheriting one", () => {
    expect(resolveTheme("spy", CONFIG).assets.logo).toBeNull();
  });

  it("inherits the logo when the theme says nothing about it", () => {
    expect(resolveTheme("fantasy", CONFIG).assets.logo).toBe("base_logo.png");
  });

  it("gives every theme the full set of skills", () => {
    const theme = resolveTheme("fantasy", CONFIG);
    expect(Object.keys(theme.skills).sort()).toEqual(["math", "reading"]);
    expect(theme.skills.reading.name).toBe("Reading");
  });

  it("merges a skill field by field, keeping the default mobType", () => {
    const theme = resolveTheme("spy", CONFIG);
    expect(theme.skills.reading).toEqual({
      name: "Intel Analysis",
      boss: "Double Agent",
      mobType: "Standard",
    });
  });

  it("falls back to the default theme on an unknown id, rather than throwing", () => {
    const theme = resolveTheme("does-not-exist", CONFIG);
    expect(theme.name).toBe("Minecraft");
    expect(theme.assets.mobs.Zombie).toBe("zombie.png");
  });

  it("survives a saved theme id of undefined", () => {
    expect(resolveTheme(undefined, CONFIG).name).toBe("Minecraft");
  });

  it("resolves the default theme to itself", () => {
    expect(resolveTheme(DEFAULT_THEME_ID, CONFIG).name).toBe("Minecraft");
  });
});

describe("resolveMobImage", () => {
  it("returns the themed image when there is one", () => {
    expect(resolveMobImage(resolveTheme("fantasy", CONFIG), "Zombie")).toBe(
      "ghoul.png",
    );
  });

  it("returns null for a mob nobody has art for", () => {
    expect(resolveMobImage(resolveTheme("spy", CONFIG), "Warden")).toBeNull();
  });
});

describe("listThemes", () => {
  it("lists every configured theme, in config order", () => {
    expect(listThemes(CONFIG)).toEqual([
      { id: "minecraft", name: "Minecraft", img: "base.png" },
      { id: "spy", name: "Spy", img: "spy.png" },
      { id: "fantasy", name: "Fantasy", img: "fantasy.png" },
    ]);
  });

  it("grows on its own when a theme is added", () => {
    const withExtra = {
      ...CONFIG,
      noir: { name: "Noir", preview: "noir.png" },
    };
    expect(listThemes(withExtra)).toHaveLength(4);
    expect(listThemes(withExtra).at(-1)).toEqual({
      id: "noir",
      name: "Noir",
      img: "noir.png",
    });
  });
});

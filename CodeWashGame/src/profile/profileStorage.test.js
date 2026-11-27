// Characterization tests: they freeze the CURRENT save-loading behavior that
// was moved out of App.jsx (D02, D05, D06), quirks included. If one fails
// after a change, that change altered how saves are read.
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  getStorageKey,
  loadSkills,
  loadTheme,
  loadStats,
  readProfileStats,
  loadCosmetics,
  loadProfile,
} from "./profileStorage";
import { SKILL_DATA } from "../constants/gameData";
import { getDefaultStats } from "../utils/achievementUtils";
import { calculateMobHealth } from "../utils/gameUtils";

const fakeStorage = (entries = {}) => {
  const store = new Map(Object.entries(entries));
  return { getItem: (key) => (store.has(key) ? store.get(key) : null) };
};

const SKILL_IDS = SKILL_DATA.map((s) => s.id);
const COMBAT_IDS = ["reading", "math", "writing", "patterns"];

afterEach(() => {
  vi.restoreAllMocks();
});

// getStorageKey : vérifie que chaque profil a sa propre clé de sauvegarde
// (heroSkills_v23_p1, _p2, _p3).
describe("getStorageKey", () => {
  it("uses one key per profile", () => {
    expect(getStorageKey(2)).toBe("heroSkills_v23_p2");
  });
});

// loadSkills : fige la lecture des compétences d'un profil. Skills par défaut
// si rien n'est sauvegardé, fusion avec la sauvegarde, ancien format « à plat »,
// repli sur l'ancienne clé pour le profil 1, réparation des champs invalides
// (rétrocompatibilité) et retour aux valeurs par défaut si le JSON est corrompu.
describe("loadSkills", () => {
  it("builds fresh skills when nothing is saved", () => {
    const skills = loadSkills(2, fakeStorage());
    expect(Object.keys(skills)).toEqual(SKILL_IDS);
    for (const id of SKILL_IDS) {
      expect(skills[id]).toMatchObject({
        level: 1,
        xp: 0,
        difficulty: 1,
        earnedBadges: [],
        mobHealth: calculateMobHealth(1),
        mobMaxHealth: calculateMobHealth(1),
        lostLevel: false,
        recoveryDifficulty: null,
      });
      expect(skills[id].currentMiniboss).toBeTruthy();
      expect(skills[id].currentBoss).toBeTruthy();
    }
    expect(skills.memory.memoryMob).toBeTruthy();
    expect(skills.reading.memoryMob).toBeNull();
    expect(skills.patterns.patternMob).toBeTruthy();
    expect(skills.reading.readingMobAura).toBeTruthy();
    expect(skills.math.readingMobAura).toBeNull();
  });

  it("merges a saved {skills} blob over the defaults", () => {
    const storage = fakeStorage({
      heroSkills_v23_p2: JSON.stringify({
        skills: { math: { level: 7, xp: 30, difficulty: 3 } },
      }),
    });
    const skills = loadSkills(2, storage);
    expect(skills.math).toMatchObject({ level: 7, xp: 30, difficulty: 3 });
    expect(skills.reading.level).toBe(1);
  });

  it("still reads the old flat format (skills at the root)", () => {
    const storage = fakeStorage({
      heroSkills_v23_p3: JSON.stringify({ reading: { level: 4 } }),
    });
    expect(loadSkills(3, storage).reading.level).toBe(4);
  });

  it("falls back to the pre-profile key for profile 1 only", () => {
    const legacy = JSON.stringify({ skills: { math: { level: 9 } } });
    const storage = fakeStorage({ heroSkills_v23: legacy });
    expect(loadSkills(1, storage).math.level).toBe(9);
    expect(loadSkills(2, storage).math.level).toBe(1);
  });

  it("repairs invalid or missing fields of known skills", () => {
    const broken = {};
    for (const id of SKILL_IDS) {
      broken[id] = {
        difficulty: "3",
        earnedBadges: null,
        mobHealth: null,
        lostLevel: "no",
        recoveryDifficulty: undefined,
        memoryMob: null,
        patternMob: null,
        readingMob: null,
        mathMob: null,
        writingMob: null,
        readingMobAura: null,
        mathMobAura: null,
        writingMobAura: null,
        patternMobAura: null,
        currentMiniboss: null,
        currentBoss: null,
        currentMinibossAura: null,
        currentBossAura: null,
      };
    }
    const storage = fakeStorage({
      heroSkills_v23_p2: JSON.stringify({ skills: broken }),
    });
    const skills = loadSkills(2, storage);
    for (const id of SKILL_IDS) {
      expect(skills[id].difficulty).toBe(1);
      expect(skills[id].earnedBadges).toEqual([]);
      expect(skills[id].mobHealth).toBe(calculateMobHealth(1));
      expect(skills[id].lostLevel).toBe(false);
    }
    expect(skills.memory.memoryMob).toBeTruthy();
    expect(skills.patterns.patternMob).toBeTruthy();
    expect(skills.reading.readingMob).toBeTruthy();
    expect(skills.math.mathMob).toBeTruthy();
    expect(skills.writing.writingMob).toBeTruthy();
    expect(skills.reading.readingMobAura).toBeTruthy();
    expect(skills.math.mathMobAura).toBeTruthy();
    expect(skills.writing.writingMobAura).toBeTruthy();
    expect(skills.patterns.patternMobAura).toBeTruthy();
    for (const id of COMBAT_IDS) {
      expect(skills[id].currentMiniboss).toBeTruthy();
      expect(skills[id].currentBoss).toBeTruthy();
      expect(skills[id].currentMinibossAura).toBeTruthy();
      expect(skills[id].currentBossAura).toBeTruthy();
    }
    // Quirk: cleaning and memory are not repaired, they keep the saved null.
    expect(skills.cleaning.currentMiniboss).toBeNull();
    expect(skills.memory.currentBoss).toBeNull();
  });

  it("uses difficulty 1 for mob health when the saved difficulty is 0", () => {
    const storage = fakeStorage({
      heroSkills_v23_p2: JSON.stringify({
        skills: { math: { difficulty: 0, mobHealth: null } },
      }),
    });
    const math = loadSkills(2, storage).math;
    expect(math.difficulty).toBe(0);
    expect(math.mobHealth).toBe(calculateMobHealth(1));
  });

  it("keeps unknown saved skills, repaired", () => {
    const storage = fakeStorage({
      heroSkills_v23_p2: JSON.stringify({ skills: { legacy: { level: 2 } } }),
    });
    expect(loadSkills(2, storage).legacy).toMatchObject({
      level: 2,
      difficulty: 1,
      earnedBadges: [],
      lostLevel: false,
      recoveryDifficulty: null,
    });
  });

  it("falls back to fresh skills and warns on a corrupted save", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const storage = fakeStorage({ heroSkills_v23_p2: "{not json" });
    expect(loadSkills(2, storage).math.level).toBe(1);
    expect(warn).toHaveBeenCalledOnce();
  });
});

// loadTheme : fige la lecture du thème. Thème sauvegardé, « minecraft » par
// défaut, repli sur l'ancienne clé pour le profil 1, et avertissement console
// même sans sauvegarde (bizarrerie d'origine conservée).
describe("loadTheme", () => {
  it("returns the saved theme", () => {
    const storage = fakeStorage({
      heroSkills_v23_p2: JSON.stringify({ theme: "kpop" }),
    });
    expect(loadTheme(2, storage)).toBe("kpop");
  });

  it("defaults to minecraft when the save has no theme", () => {
    const storage = fakeStorage({ heroSkills_v23_p2: JSON.stringify({}) });
    expect(loadTheme(2, storage)).toBe("minecraft");
  });

  it("falls back to the pre-profile key for profile 1", () => {
    const storage = fakeStorage({
      heroSkills_v23: JSON.stringify({ theme: "kpop" }),
    });
    expect(loadTheme(1, storage)).toBe("kpop");
  });

  it("warns even when nothing is saved (quirk), then defaults", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(loadTheme(2, fakeStorage())).toBe("minecraft");
    expect(warn).toHaveBeenCalledOnce();
  });
});

// loadStats : fige la lecture des statistiques. Fusion avec les stats par
// défaut, valeurs par défaut sans stats sauvegardées, repli sur l'ancienne clé
// pour le profil 1, et avertissement console même sans sauvegarde.
describe("loadStats", () => {
  it("merges saved stats over the defaults", () => {
    const storage = fakeStorage({
      heroSkills_v23_p2: JSON.stringify({ stats: { totalMobsDefeated: 42 } }),
    });
    expect(loadStats(2, storage)).toEqual({
      ...getDefaultStats(),
      totalMobsDefeated: 42,
    });
  });

  it("returns defaults when the save has no stats", () => {
    const storage = fakeStorage({ heroSkills_v23_p2: JSON.stringify({}) });
    expect(loadStats(2, storage)).toEqual(getDefaultStats());
  });

  it("falls back to the pre-profile key for profile 1", () => {
    const storage = fakeStorage({
      heroSkills_v23: JSON.stringify({ stats: { totalDeaths: 3 } }),
    });
    expect(loadStats(1, storage).totalDeaths).toBe(3);
  });

  it("warns even when nothing is saved (quirk), then defaults", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(loadStats(2, fakeStorage())).toEqual(getDefaultStats());
    expect(warn).toHaveBeenCalledOnce();
  });
});

// readProfileStats : fige le résumé affiché sur les cartes de profil (niveau
// total, meilleur niveau, thème), à partir des skills en cours ou de la
// sauvegarde ; null si le profil n'a pas de sauvegarde ou si elle est corrompue.
describe("readProfileStats", () => {
  it("summarizes live skills with the given theme", () => {
    const live = { math: { level: 5 }, reading: { level: 2 }, broken: null };
    expect(readProfileStats(1, live, "kpop", fakeStorage())).toEqual({
      totalLevel: 7,
      highestLevel: 5,
      skills: live,
      theme: "kpop",
    });
  });

  it("summarizes a saved profile", () => {
    const skills = {
      math: { level: 3 },
      reading: { level: 6 },
      writing: { level: 1 },
      x: {},
    };
    const storage = fakeStorage({
      heroSkills_v23_p2: JSON.stringify({ skills, theme: "kpop" }),
    });
    expect(readProfileStats(2, null, null, storage)).toEqual({
      totalLevel: 10,
      highestLevel: 6,
      skills,
      theme: "kpop",
    });
  });

  it("reads the old flat format and defaults the theme", () => {
    const storage = fakeStorage({
      heroSkills_v23: JSON.stringify({ math: { level: 2 } }),
    });
    expect(readProfileStats(1, null, null, storage)).toMatchObject({
      totalLevel: 2,
      theme: "minecraft",
    });
  });

  it("returns null when the profile has no save", () => {
    expect(readProfileStats(2, null, null, fakeStorage())).toBeNull();
  });

  it("returns null and warns on a corrupted save", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const storage = fakeStorage({ heroSkills_v23_p2: "{not json" });
    expect(readProfileStats(2, null, null, storage)).toBeNull();
    expect(warn).toHaveBeenCalledOnce();
  });
});

// loadCosmetics : fige la lecture de la bordure et de sa couleur, avec les
// valeurs par défaut d'origine (bordure pleine, doré #FFD700).
describe("loadCosmetics", () => {
  it("defaults to a solid gold border", () => {
    expect(loadCosmetics(2, fakeStorage())).toEqual({
      border: "solid",
      borderColor: "#FFD700",
    });
  });

  it("returns the profile's saved border", () => {
    const storage = fakeStorage({
      borderEffect_p2: "rainbow",
      borderColor_p2: "#123456",
    });
    expect(loadCosmetics(2, storage)).toEqual({
      border: "rainbow",
      borderColor: "#123456",
    });
  });
});

// loadProfile : vérifie qu'un seul appel lit tout ce qu'il faut pour afficher
// un profil (skills, thème, stats, bordure et couleur). C'est ce que le
// changement de profil doit recharger pour corriger D02.
describe("loadProfile", () => {
  it("reads skills, theme, stats and border of one profile", () => {
    const storage = fakeStorage({
      heroSkills_v23_p2: JSON.stringify({
        skills: { math: { level: 4 } },
        theme: "kpop",
        stats: { totalMobsDefeated: 42 },
      }),
      borderEffect_p2: "rainbow",
      borderColor_p2: "#123456",
    });
    const profile = loadProfile(2, storage);
    expect(profile.skills.math.level).toBe(4);
    expect(profile.theme).toBe("kpop");
    expect(profile.stats.totalMobsDefeated).toBe(42);
    expect(profile.border).toBe("rainbow");
    expect(profile.borderColor).toBe("#123456");
  });
});

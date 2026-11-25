// Characterization tests: they freeze the CURRENT behavior of the game
// formulas, quirks included (see docs/DEBT.md). If one of these fails after
// a refactoring, the refactoring changed behavior. Do not update a value
// here without referencing the debt item that justifies the change.
import { describe, it, expect } from "vitest";
import {
  getDifficultyMultiplier,
  calculateDamage,
  calculateMobHealth,
  getExpectedDifficulty,
  getEncounterType,
  calculateXPReward,
  calculateXPToLevel,
  getRandomMob,
  getMobForSkill,
  getReadingWord,
  generateMathProblem,
  getWordForDifficulty,
} from "./gameUtils";
import {
  HOSTILE_MOBS,
  FUNNY_LONG_WORDS,
  WRITING_DIFFICULTY_POOLS,
} from "../constants/gameData";

describe("getDifficultyMultiplier", () => {
  it("is 3^(difficulty-1)", () => {
    expect(getDifficultyMultiplier(1)).toBe(1);
    expect(getDifficultyMultiplier(2)).toBe(3);
    expect(getDifficultyMultiplier(4)).toBe(27);
    expect(getDifficultyMultiplier(7)).toBe(729);
  });
});

describe("calculateDamage", () => {
  it("is 12 times the difficulty multiplier", () => {
    expect(calculateDamage(1, 1)).toBe(12);
    expect(calculateDamage(1, 3)).toBe(108);
    expect(calculateDamage(1, 7)).toBe(8748);
  });

  it("ignores the player level (current behavior)", () => {
    expect(calculateDamage(99, 3)).toBe(calculateDamage(1, 3));
  });
});

describe("calculateMobHealth", () => {
  it("is always 5 hits worth of damage", () => {
    expect(calculateMobHealth(1)).toBe(60);
    expect(calculateMobHealth(3)).toBe(540);
    expect(calculateMobHealth(7)).toBe(43740);
  });
});

describe("getExpectedDifficulty", () => {
  it("unlocks one difficulty every 20 levels, capped at 7", () => {
    expect(getExpectedDifficulty(1)).toBe(1);
    expect(getExpectedDifficulty(20)).toBe(1); // off by one vs the UI, see D14
    expect(getExpectedDifficulty(21)).toBe(2);
    expect(getExpectedDifficulty(40)).toBe(2);
    expect(getExpectedDifficulty(121)).toBe(7);
    expect(getExpectedDifficulty(999)).toBe(7);
  });
});

describe("getEncounterType", () => {
  it("cycles hostile / miniboss at 10 / boss at 20", () => {
    for (const lvl of [1, 9, 11, 19, 21, 39]) {
      expect(getEncounterType(lvl)).toBe("hostile");
    }
    for (const lvl of [10, 30, 50]) {
      expect(getEncounterType(lvl)).toBe("miniboss");
    }
    for (const lvl of [20, 40, 100]) {
      expect(getEncounterType(lvl)).toBe("boss");
    }
  });
});

describe("calculateXPReward", () => {
  it("without player level: 100 times the multiplier", () => {
    expect(calculateXPReward(1)).toBe(100);
    expect(calculateXPReward(3)).toBe(900);
  });

  it("at or above expected difficulty: full scaled reward", () => {
    expect(calculateXPReward(1, 1)).toBe(100);
    expect(calculateXPReward(1, 20)).toBe(192);
    expect(calculateXPReward(2, 21)).toBe(596);
    expect(calculateXPReward(3, 41)).toBe(3563);
    expect(calculateXPReward(7, 121)).toBe(4524488);
  });

  it("below expected difficulty: exponential penalty", () => {
    expect(calculateXPReward(1, 41)).toBe(35); // expected diff 3, gap 2
    expect(calculateXPReward(1, 121)).toBe(4); // expected diff 7, gap 6
  });
});

describe("calculateXPToLevel", () => {
  it("without player level: 100 times the multiplier", () => {
    expect(calculateXPToLevel(2)).toBe(300);
  });

  it("with player level: scales with level only", () => {
    expect(calculateXPToLevel(1, 1)).toBe(100);
    expect(calculateXPToLevel(2, 21)).toBe(596);
    expect(calculateXPToLevel(1, 41)).toBe(3563);
  });

  it("ignores the difficulty argument when a level is given (current behavior)", () => {
    expect(calculateXPToLevel(5, 21)).toBe(calculateXPToLevel(1, 21));
  });
});

describe("getMobForSkill", () => {
  it("cleaning follows the chest ladder", () => {
    const cleaning = { id: "cleaning" };
    expect(getMobForSkill(cleaning, { level: 1 })).toBe("Chest");
    expect(getMobForSkill(cleaning, { level: 2 })).toBe("Trapped Chest");
    expect(getMobForSkill(cleaning, { level: 5 })).toBe("Shulker Box");
    expect(getMobForSkill(cleaning, { level: 25 })).toBe("Shulker Box");
    expect(getMobForSkill(cleaning, { level: 20 })).toBe("Ender Chest");
    expect(getMobForSkill(cleaning, { level: 40 })).toBe("Ender Chest");
  });

  it("returns the stored mob when one exists (no reroll on re-render)", () => {
    expect(getMobForSkill({ id: "memory" }, { memoryMob: "Allay" })).toBe(
      "Allay",
    );
    expect(
      getMobForSkill({ id: "math" }, { level: 3, mathMob: "Creeper" }),
    ).toBe("Creeper");
    expect(
      getMobForSkill({ id: "math" }, { level: 20, currentBoss: "Warden" }),
    ).toBe("Warden");
    expect(
      getMobForSkill({ id: "math" }, { level: 10, currentMiniboss: "Ravager" }),
    ).toBe("Ravager");
  });
});

describe("getRandomMob", () => {
  it("always returns a hostile mob and respects the exclusion", () => {
    const keys = Object.keys(HOSTILE_MOBS);
    for (let i = 0; i < 100; i++) {
      const mob = getRandomMob("Creeper");
      expect(keys).toContain(mob);
      expect(mob).not.toBe("Creeper");
    }
  });
});

describe("getReadingWord", () => {
  it("difficulty 7 draws from the funny long words", () => {
    for (let i = 0; i < 20; i++) {
      expect(FUNNY_LONG_WORDS).toContain(getReadingWord(7));
    }
  });
});

describe("generateMathProblem", () => {
  it("difficulties 1-5: the answer matches the question", () => {
    for (let difficulty = 1; difficulty <= 5; difficulty++) {
      for (let i = 0; i < 30; i++) {
        const { question, answer } = generateMathProblem(difficulty);
        const expr = question
          .replace(" = ?", "")
          .replaceAll("×", "*")
          .replaceAll("÷", "/");
        expect(String(eval(expr))).toBe(answer);
      }
    }
  });

  it("difficulty 6 and 7 are flagged pools with numeric answers", () => {
    const pemdas = generateMathProblem(6);
    expect(pemdas.isPemdas).toBe(true);
    expect(pemdas.answer).toMatch(/^\d+$/);
    const nightmare = generateMathProblem(7);
    expect(nightmare.isNightmare).toBe(true);
    expect(nightmare.answer).toMatch(/^\d+$/);
  });
});

describe("getWordForDifficulty", () => {
  it("returns an uppercase word from the mapped pool (6 and 7 reuse pool 5)", () => {
    for (let difficulty = 1; difficulty <= 7; difficulty++) {
      const pool = WRITING_DIFFICULTY_POOLS[Math.min(difficulty, 5)];
      const poolWords = pool.map((item) => item.word.toUpperCase());
      for (let i = 0; i < 10; i++) {
        const { word, displayName, image } = getWordForDifficulty(difficulty);
        expect(word).toBe(word.toUpperCase());
        expect(poolWords).toContain(word);
        expect(typeof displayName).toBe("string");
        expect(typeof image).toBe("string");
      }
    }
  });
});

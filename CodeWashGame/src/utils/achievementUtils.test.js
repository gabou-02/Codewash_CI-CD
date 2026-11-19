// Characterization tests for the achievement logic. They freeze the CURRENT
// behavior, including known quirks (see docs/DEBT.md). Do not update a value
// here without referencing the debt item that justifies the change.
import { describe, it, expect } from 'vitest';
import {
    getDefaultStats,
    isAchievementUnlocked,
    getCurrentTier,
    getNextTier,
    getTierProgress,
    getNewlyUnlockedAchievements,
    getNewTierAchievements,
    addUniqueToArray,
    getAchievementDisplayName,
} from './achievementUtils';

const SKILL_IDS = ['reading', 'math', 'writing', 'cleaning', 'memory', 'patterns'];

const makeSkills = (level) =>
    Object.fromEntries(SKILL_IDS.map((id) => [id, { level }]));

const statsWith = (patch) => ({ ...getDefaultStats(), ...patch });

describe('getDefaultStats', () => {
    it('freezes the stats shape (including the dead achievementsUnlocked field)', () => {
        expect(getDefaultStats()).toEqual({
            phantomsCaught: 0,
            totalMobsDefeated: 0,
            totalBossesDefeated: 0,
            totalMinibossesDefeated: 0,
            totalDeaths: 0,
            uniqueMobsDefeated: [],
            uniqueBossesDefeated: [],
            uniqueMinibossesDefeated: [],
            themeChanges: 0,
            borderChanges: 0,
            battlesThisSession: 0,
            loginDates: [],
            perfectMemoryGames: 0,
            achievementsUnlocked: [],
        });
    });
});

describe('isAchievementUnlocked', () => {
    it('one-shot: first_steps unlocks at 1 mob defeated', () => {
        expect(isAchievementUnlocked('first_steps', getDefaultStats(), {})).toBe(false);
        expect(isAchievementUnlocked('first_steps', statsWith({ totalMobsDefeated: 1 }), {})).toBe(true);
    });

    it('tiered: phantom_hunter unlocks at tier 1 (5 phantoms)', () => {
        expect(isAchievementUnlocked('phantom_hunter', statsWith({ phantomsCaught: 4 }), {})).toBe(false);
        expect(isAchievementUnlocked('phantom_hunter', statsWith({ phantomsCaught: 5 }), {})).toBe(true);
    });

    it('unknown achievement id is locked', () => {
        expect(isAchievementUnlocked('nope', getDefaultStats(), {})).toBe(false);
    });

    it('quirk: skill_mastery is "unlocked" with an empty skills object', () => {
        // Math.min of an empty list is Infinity, see docs/DEBT.md
        expect(isAchievementUnlocked('skill_mastery', getDefaultStats(), {})).toBe(true);
    });
});

describe('getCurrentTier', () => {
    it('walks the phantom_hunter ladder', () => {
        const at = (n) => getCurrentTier('phantom_hunter', statsWith({ phantomsCaught: n }), {});
        expect(at(0)).toBe(-1);
        expect(at(5)).toBe(0);
        expect(at(99)).toBe(6);
        expect(at(100)).toBe(7);
    });

    it('combined_levels sums the six skills', () => {
        const tier = getCurrentTier('combined_levels', getDefaultStats(), makeSkills(50));
        expect(tier).toBe(2); // 6 x 50 = 300 -> Gold Power
    });

    it('skill_mastery tracks the lowest skill', () => {
        const skills = makeSkills(20);
        expect(getCurrentTier('skill_mastery', getDefaultStats(), skills)).toBe(0);
        skills.patterns.level = 19;
        expect(getCurrentTier('skill_mastery', getDefaultStats(), skills)).toBe(-1);
    });

    it('returns -1 for non-tiered achievements', () => {
        expect(getCurrentTier('first_steps', getDefaultStats(), {})).toBe(-1);
    });
});

describe('getNextTier', () => {
    it('returns the next ladder step, or null at max', () => {
        expect(getNextTier('phantom_hunter', statsWith({ phantomsCaught: 5 }), {}).level).toBe(10);
        expect(getNextTier('phantom_hunter', statsWith({ phantomsCaught: 100 }), {})).toBeNull();
    });
});

describe('getTierProgress', () => {
    it('is a floored percentage toward the next tier', () => {
        const at = (n) => getTierProgress('phantom_hunter', statsWith({ phantomsCaught: n }), {});
        expect(at(0)).toBe(0);
        expect(at(7)).toBe(40); // 2 of the 5 between tier 1 (5) and tier 2 (10)
        expect(at(100)).toBe(100);
    });
});

describe('getNewlyUnlockedAchievements', () => {
    it('reports only freshly crossed achievements', () => {
        const before = getDefaultStats();
        const after = statsWith({ totalMobsDefeated: 1, totalDeaths: 1 });
        const newly = getNewlyUnlockedAchievements(before, after, {}, {});
        expect(newly).toContain('first_steps');
        expect(newly).toContain('ouch');
        expect(newly).not.toContain('dragon_slayer');
    });
});

describe('getNewTierAchievements', () => {
    it('reports tier crossings with their new index', () => {
        const before = statsWith({ phantomsCaught: 4 });
        const after = statsWith({ phantomsCaught: 5 });
        expect(getNewTierAchievements(before, after, {}, {})).toEqual([
            { achievementId: 'phantom_hunter', tierIndex: 0 },
        ]);
    });
});

describe('addUniqueToArray', () => {
    it('adds new values, returns the same array for duplicates', () => {
        const arr = ['Zombie'];
        expect(addUniqueToArray(arr, 'Creeper')).toEqual(['Zombie', 'Creeper']);
        expect(addUniqueToArray(arr, 'Zombie')).toBe(arr);
    });
});

describe('getAchievementDisplayName', () => {
    it('uses the tier name once a tier is reached', () => {
        expect(getAchievementDisplayName('phantom_hunter', getDefaultStats(), {})).toBe('Ghost Buster');
        expect(getAchievementDisplayName('phantom_hunter', statsWith({ phantomsCaught: 10 }), {})).toBe('Silver Ghost Buster');
        expect(getAchievementDisplayName('first_steps', getDefaultStats(), {})).toBe('First Steps');
        expect(getAchievementDisplayName('nope', getDefaultStats(), {})).toBe('');
    });
});

describe('documented dead ends (D15)', () => {
    it('perfectionist only unlocks via perfectMemoryGames, which the game never increments', () => {
        expect(isAchievementUnlocked('perfectionist', getDefaultStats(), {})).toBe(false);
        expect(isAchievementUnlocked('perfectionist', statsWith({ perfectMemoryGames: 1 }), {})).toBe(true);
    });

    it('full_set needs 8 badges on one skill', () => {
        const skills = { math: { earnedBadges: [1, 2, 3, 4, 5, 6, 7] } };
        expect(isAchievementUnlocked('full_set', getDefaultStats(), skills)).toBe(false);
        skills.math.earnedBadges.push(8);
        expect(isAchievementUnlocked('full_set', getDefaultStats(), skills)).toBe(true);
    });
});

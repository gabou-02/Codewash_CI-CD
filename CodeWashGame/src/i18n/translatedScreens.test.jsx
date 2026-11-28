// @vitest-environment jsdom
// One test per screen that was translated, rendering it in French and
// checking the English is gone. Cheap to extend: add a case when a new
// screen is extracted.
import React from "react";
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { I18nProvider } from "./I18nProvider";
import { LANGUAGE_STORAGE_KEY } from "./storage";
import MenuDrawer from "../components/drawers/MenuDrawer";
import CosmeticsDrawer from "../components/drawers/CosmeticsDrawer";
import ParentalVerificationModal from "../components/ui/ParentalVerificationModal";
import AchievementToast from "../components/ui/AchievementToast";
import { getDefaultStats } from "../utils/achievementUtils";
import { ACHIEVEMENTS } from "../constants/achievements";

afterEach(cleanup);

const SKILL_IDS = [
  "reading",
  "math",
  "writing",
  "cleaning",
  "memory",
  "patterns",
];
const skills = Object.fromEntries(
  SKILL_IDS.map((id) => [
    id,
    { level: 1, xp: 0, difficulty: 1, earnedBadges: [] },
  ]),
);

const inFrench = (children) =>
  render(
    <I18nProvider
      storage={{
        getItem: (key) => (key === LANGUAGE_STORAGE_KEY ? "fr" : null),
        setItem: () => {},
      }}
      systemLanguage="en-GB"
    >
      {children}
    </I18nProvider>,
  );

describe("screens translated to French", () => {
  it("achievements drawer", () => {
    const { container } = inFrench(
      <MenuDrawer isOpen skills={skills} stats={getDefaultStats()} />,
    );

    expect(container.textContent).toContain("Succès");
    expect(container.textContent).toContain("Niveau total :");
    expect(container.textContent).not.toContain("Total Level:");
  });

  it("cosmetics drawer", () => {
    const { container } = inFrench(
      <CosmeticsDrawer
        isOpen
        activeTheme="minecraft"
        setActiveTheme={vi.fn()}
        selectedBorder="solid"
        setSelectedBorder={vi.fn()}
        borderColor="#FFD700"
        setBorderColor={vi.fn()}
        unlockedBorders={["solid"]}
        unlockedAchievements={[]}
      />,
    );

    expect(container.textContent).toContain("Thèmes et cosmétiques");
    expect(container.textContent).toContain("Effets de bordure");
    expect(container.textContent).not.toContain("Border Effects");
  });

  it("parental verification modal", () => {
    // Rendered through ReactDOM.createPortal, so it lands on document.body.
    inFrench(
      <ParentalVerificationModal
        isOpen
        onClose={vi.fn()}
        onVerified={vi.fn()}
      />,
    );

    expect(document.body.textContent).toContain("Valider");
    expect(document.body.textContent).not.toContain("Submit");
  });

  it("achievement toast", () => {
    const firstAchievement = Object.keys(ACHIEVEMENTS)[0];
    const { container } = inFrench(
      <AchievementToast achievementId={firstAchievement} />,
    );

    expect(container.textContent).toContain("SUCCÈS DÉBLOQUÉ !");
    expect(container.textContent).not.toContain("ACHIEVEMENT UNLOCKED!");
  });
});

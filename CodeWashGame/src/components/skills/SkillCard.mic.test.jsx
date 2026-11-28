// @vitest-environment jsdom
// Note: a battling, centred card renders through ReactDOM.createPortal, so
// its output lands on document.body rather than inside the render container.
// The reading mini-game shows either what the player said or a microphone
// status. The status is a sentinel compared in logic (see constants/micStatus),
// so only its display may be translated. These tests pin that split, rendering
// the card directly because the battle panel only appears for the carousel's
// centred card, which is awkward to reach through App.
import React from "react";
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";
import SkillCard from "./SkillCard";
import { I18nProvider } from "../../i18n/I18nProvider";
import { LANGUAGE_STORAGE_KEY } from "../../i18n/storage";
import { MIC_STATUS } from "../../constants/micStatus";
import { SKILL_DATA, THEME_CONFIG } from "../../constants/gameData";

afterEach(cleanup);

const readingSkill = SKILL_DATA.find((skill) => skill.id === "reading");

const renderCard = (language, { spokenText, isListening }) =>
  render(
    <I18nProvider
      storage={{
        getItem: (key) => (key === LANGUAGE_STORAGE_KEY ? language : null),
        setItem: () => {},
      }}
      systemLanguage="en-GB"
    >
      <SkillCard
        config={readingSkill}
        data={{
          level: 1,
          xp: 0,
          difficulty: 1,
          mobHealth: 10,
          mobMaxHealth: 10,
        }}
        themeData={THEME_CONFIG.minecraft}
        isCenter
        isBattling
        mobName="Zombie"
        mobAura={null}
        challenge={{ question: "Write: dragon", answer: "dragon" }}
        isListening={isListening}
        spokenText={spokenText}
        damageNumbers={[]}
        onStartBattle={vi.fn()}
        onEndBattle={vi.fn()}
        onMathSubmit={vi.fn()}
        onMicClick={vi.fn()}
        difficulty={1}
        setDifficulty={vi.fn()}
        unlockedDifficulty={7}
        selectedBorder="solid"
        borderColor="#FFD700"
        bossHealing={false}
      />
    </I18nProvider>,
  );

describe("reading mini-game microphone status", () => {
  it("translates the listening placeholder", () => {
    renderCard("fr", {
      spokenText: MIC_STATUS.LISTENING,
      isListening: true,
    });

    expect(document.body.textContent).toContain("J'écoute...");
    expect(document.body.textContent).not.toContain(MIC_STATUS.LISTENING);
  });

  it("translates the microphone-off placeholder", () => {
    renderCard("fr", {
      spokenText: MIC_STATUS.OFF,
      isListening: false,
    });

    expect(document.body.textContent).toContain("Micro coupé");
    expect(document.body.textContent).not.toContain(MIC_STATUS.OFF);
  });

  it("shows what the player actually said, untranslated", () => {
    renderCard("fr", {
      spokenText: "dragon",
      isListening: true,
    });

    expect(document.body.textContent).toContain("dragon");
    expect(document.body.textContent).not.toContain("J'écoute...");
  });

  it("falls back to the status when nothing has been said yet", () => {
    renderCard("en", { spokenText: "", isListening: true });

    expect(document.body.textContent).toContain("Listening...");
  });
});

// @vitest-environment jsdom
// Characterization test for the settings drawer, written alongside its i18n
// extraction: it pins the labels the drawer shows, in English and in French,
// so a missing or renamed translation key fails the CI instead of the demo.
import React from "react";
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import SettingsDrawer from "./SettingsDrawer";
import { I18nProvider } from "../../i18n/I18nProvider";
import { LANGUAGE_STORAGE_KEY } from "../../i18n/storage";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const storageWith = (language) => ({
  getItem: (key) => (key === LANGUAGE_STORAGE_KEY ? language : null),
  setItem: () => {},
});

const profileStats = { level: 12, theme: "minecraft", health: 10 };

const handlers = {
  setBgmVol: vi.fn(),
  setSfxVol: vi.fn(),
  onReset: vi.fn(),
};

const renderDrawer = (language, overrides) =>
  render(
    <I18nProvider storage={storageWith(language)} systemLanguage="en-GB">
      <SettingsDrawer
        isOpen
        onReset={handlers.onReset}
        bgmVol={0.5}
        setBgmVol={handlers.setBgmVol}
        sfxVol={0.25}
        setSfxVol={handlers.setSfxVol}
        currentProfile={1}
        onSwitchProfile={vi.fn()}
        profileNames={{ 1: "Player 1", 2: "Player 2", 3: "Player 3" }}
        onRenameProfile={vi.fn()}
        getProfileStats={() => profileStats}
        parentStatus={{ 1: false, 2: false, 3: false }}
        onParentVerified={vi.fn()}
        currentSkills={{}}
        {...overrides}
      />
    </I18nProvider>,
  );

describe("SettingsDrawer", () => {
  it("shows the English labels by default", () => {
    renderDrawer("en");

    expect(screen.getByRole("heading", { name: "Settings" })).toBeDefined();
    expect(screen.getByRole("heading", { name: /Select File/ })).toBeDefined();
    expect(
      screen.getByRole("heading", { name: /Audio Configuration/ }),
    ).toBeDefined();
    expect(screen.getByText("Music Volume")).toBeDefined();
    expect(screen.getByText("SFX Volume")).toBeDefined();
    expect(screen.getByRole("heading", { name: /Danger Zone/ })).toBeDefined();
    expect(
      screen.getByRole("button", { name: /DELETE PROFILE PROGRESS/ }),
    ).toBeDefined();
  });

  it("shows the French labels when the game runs in French", () => {
    renderDrawer("fr");

    expect(screen.getByRole("heading", { name: "Paramètres" })).toBeDefined();
    expect(screen.getByRole("heading", { name: /Sauvegardes/ })).toBeDefined();
    expect(
      screen.getByRole("heading", { name: /Configuration audio/ }),
    ).toBeDefined();
    expect(screen.getByText("Volume de la musique")).toBeDefined();
    expect(screen.getByText("Volume des effets")).toBeDefined();
    expect(
      screen.getByRole("heading", { name: /Zone de danger/ }),
    ).toBeDefined();
    expect(
      screen.getByRole("button", { name: /SUPPRIMER LA PROGRESSION/ }),
    ).toBeDefined();
  });

  it("leaves no hardcoded English string behind in French", () => {
    const { container } = renderDrawer("fr");

    for (const leftover of ["Settings", "Audio Configuration", "Danger Zone"]) {
      expect(container.textContent).not.toContain(leftover);
    }
  });

  it("still renders the volume sliders at their given values", () => {
    renderDrawer("en");

    const sliders = screen.getAllByRole("slider");
    expect(sliders.map((slider) => slider.value)).toEqual(["0.5", "0.25"]);
  });

  it("reports volume changes as numbers to its parent", () => {
    renderDrawer("en");
    const [music, sfx] = screen.getAllByRole("slider");

    fireEvent.change(music, { target: { value: "0.8" } });
    fireEvent.change(sfx, { target: { value: "0" } });

    expect(handlers.setBgmVol).toHaveBeenCalledWith(0.8);
    expect(handlers.setSfxVol).toHaveBeenCalledWith(0);
  });

  it("asks its parent to reset when the danger-zone button is pressed", () => {
    renderDrawer("en");

    fireEvent.click(
      screen.getByRole("button", { name: /DELETE PROFILE PROGRESS/ }),
    );

    expect(handlers.onReset).toHaveBeenCalledOnce();
  });

  it("slides out of view when closed, keeping its content mounted", () => {
    const { container } = renderDrawer("en", { isOpen: false });

    expect(container.firstChild.className).toContain("-translate-x-full");
    expect(screen.getByRole("heading", { name: "Settings" })).toBeDefined();
  });
});

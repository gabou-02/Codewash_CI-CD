// @vitest-environment jsdom
// Regression test for D02: switching profile must not write the previous
// player's stats or border cosmetics into the new profile's save.
import React from "react";
import { describe, it, expect, beforeAll, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import App from "./App";
import { I18nProvider } from "./i18n/I18nProvider";

beforeAll(() => {
  // The game builds Audio objects on mount; jsdom has no media stack.
  window.HTMLMediaElement.prototype.play = vi.fn(() => Promise.resolve());
  window.HTMLMediaElement.prototype.pause = vi.fn();
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const saveOf = (profileId) =>
  JSON.parse(localStorage.getItem(`heroSkills_v23_p${profileId}`));

describe("profile switch (D02)", () => {
  it("keeps each profile's stats and border after switching", () => {
    localStorage.setItem("currentProfile_v1", "1");
    localStorage.setItem(
      "heroSkills_v23_p1",
      JSON.stringify({ stats: { totalMobsDefeated: 5 } }),
    );
    localStorage.setItem(
      "heroSkills_v23_p2",
      JSON.stringify({ stats: { totalMobsDefeated: 42 } }),
    );
    localStorage.setItem("borderEffect_p1", "rainbow");
    localStorage.setItem("borderColor_p1", "#111111");
    localStorage.setItem("borderEffect_p2", "solid");
    localStorage.setItem("borderColor_p2", "#222222");

    render(
      <I18nProvider systemLanguage="en-GB">
        <App />
      </I18nProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    // The card shows "Player 2," (trailing comma is legacy UI, see ProfileCard).
    fireEvent.click(screen.getByText(/^Player 2/));

    expect(localStorage.getItem("currentProfile_v1")).toBe("2");
    expect(saveOf(2).stats.totalMobsDefeated).toBe(42);
    expect(localStorage.getItem("borderEffect_p2")).toBe("solid");
    expect(localStorage.getItem("borderColor_p2")).toBe("#222222");
    expect(saveOf(1).stats.totalMobsDefeated).toBe(5);
    expect(localStorage.getItem("borderEffect_p1")).toBe("rainbow");
  });
});

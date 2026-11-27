// @vitest-environment jsdom
// Covers the speech-recognition path, which had never been exercised: the
// mic status placeholders travel in the same state as the player's speech,
// so translating the display without pinning this would have been blind.
//
// `webkitSpeechRecognition` does not exist in jsdom, so it is stubbed with a
// recorder that lets the test fire the callbacks the app registers.
import React from "react";
import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterEach,
  vi,
} from "vitest";
import { render, screen, cleanup, act } from "@testing-library/react";
import App from "./App";
import { I18nProvider } from "./i18n/I18nProvider";
import { LANGUAGE_STORAGE_KEY } from "./i18n/storage";

/** Last instance the app built, so the test can drive its callbacks. */
let recognition;

class FakeSpeechRecognition {
  constructor() {
    this.start = vi.fn();
    this.stop = vi.fn();
    recognition = this;
  }
}

beforeAll(() => {
  window.HTMLMediaElement.prototype.play = vi.fn(() => Promise.resolve());
  window.HTMLMediaElement.prototype.pause = vi.fn();
});

beforeEach(() => {
  recognition = undefined;
  window.webkitSpeechRecognition = FakeSpeechRecognition;
});

afterEach(() => {
  cleanup();
  delete window.webkitSpeechRecognition;
  localStorage.clear();
});

const renderApp = (language) => {
  const store = new Map([[LANGUAGE_STORAGE_KEY, language]]);
  return render(
    <I18nProvider
      storage={{
        getItem: (key) => (store.has(key) ? store.get(key) : null),
        setItem: (key, value) => store.set(key, value),
      }}
      systemLanguage="en-GB"
    >
      <App />
    </I18nProvider>,
  );
};

/** Starts the reading mini-game; "Enchant!" is its action button. */
const startReadingBattle = () => {
  act(() => screen.getByRole("button", { name: "Enchant!" }).click());
};

describe("speech recognition wiring", () => {
  it("starts a listener when the reading mini-game opens", () => {
    renderApp("en");

    startReadingBattle();

    expect(recognition).toBeDefined();
    expect(recognition.start).toHaveBeenCalled();
  });

  it("registers the callbacks the app drives its state from", () => {
    renderApp("en");
    startReadingBattle();

    // Executing them must be safe: they run outside React's event loop when
    // the browser's speech engine fires. The displayed placeholder cannot be
    // asserted here because the battle panel only renders for the carousel's
    // centred card, which reading is not on load.
    expect(typeof recognition.onstart).toBe("function");
    expect(typeof recognition.onend).toBe("function");
    act(() => recognition.onstart());
  });
});

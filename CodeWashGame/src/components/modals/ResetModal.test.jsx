// @vitest-environment jsdom
// The reset modal asks the player to type a confirmation word. That word is
// compared in logic, so translating the display without translating the
// comparison would make the confirmation impossible in French. These tests
// pin both halves.
import React from "react";
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import ResetModal from "./ResetModal";
import { I18nProvider } from "../../i18n/I18nProvider";
import { LANGUAGE_STORAGE_KEY } from "../../i18n/storage";

afterEach(cleanup);

const renderModal = (language, onConfirm = vi.fn()) => {
  const utils = render(
    <I18nProvider
      storage={{
        getItem: (key) => (key === LANGUAGE_STORAGE_KEY ? language : null),
        setItem: () => {},
      }}
      systemLanguage="en-GB"
    >
      <ResetModal isOpen onClose={vi.fn()} onConfirm={onConfirm} />
    </I18nProvider>,
  );
  return { ...utils, onConfirm };
};

/** The hidden input behind the letter slots. */
const slotInput = (container) => container.querySelector('input[type="text"]');

describe("ResetModal", () => {
  it("shows the English wording by default", () => {
    renderModal("en");

    expect(screen.getByText("Delete Progress?")).toBeDefined();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDefined();
  });

  it("shows the French wording", () => {
    renderModal("fr");

    expect(screen.getByText("Supprimer la progression ?")).toBeDefined();
    expect(screen.getByRole("button", { name: "Annuler" })).toBeDefined();
  });

  it("accepts the English confirmation word in English", () => {
    const { container, onConfirm } = renderModal("en");

    fireEvent.change(slotInput(container), { target: { value: "DELETE" } });
    fireEvent.submit(container.querySelector("form"));

    expect(onConfirm).toHaveBeenCalled();
  });

  it("accepts the French confirmation word in French", () => {
    const { container, onConfirm } = renderModal("fr");

    fireEvent.change(slotInput(container), { target: { value: "SUPPRIMER" } });
    fireEvent.submit(container.querySelector("form"));

    expect(onConfirm).toHaveBeenCalled();
  });

  it("refuses the English word when the game runs in French", () => {
    const { container, onConfirm } = renderModal("fr");

    fireEvent.change(slotInput(container), { target: { value: "DELETE" } });
    fireEvent.submit(container.querySelector("form"));

    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("sizes the letter slots to the translated word", () => {
    const { container } = renderModal("fr");

    // "SUPPRIMER" is 9 letters, "DELETE" is 6.
    expect(slotInput(container).getAttribute("maxLength")).toBe("9");
  });
});

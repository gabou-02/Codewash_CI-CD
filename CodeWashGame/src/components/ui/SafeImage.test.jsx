// @vitest-environment jsdom
// SafeImage is the component the theme config relies on when a theme ships no
// logo art (THEME_CONFIG.spy.assets.logo is null, see D11). These tests pin
// that contract so the null stays a deliberate choice rather than a surprise.
import React from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import SafeImage from "./SafeImage";

afterEach(cleanup);

describe("SafeImage", () => {
  it("renders the image when it has a source", () => {
    render(<SafeImage src="assets/themes/spy.png" alt="Spy" />);

    const img = screen.getByRole("img", { name: "Spy" });
    expect(img.getAttribute("src")).toBe("assets/themes/spy.png");
  });

  it("draws a labelled placeholder when the source is null", () => {
    const { container } = render(<SafeImage src={null} alt="Game Logo" />);

    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("Game Logo")).toBeDefined();
  });

  it("falls back to the placeholder when the image fails to load", () => {
    const { container } = render(
      <SafeImage src="assets/missing.png" alt="Gone" />,
    );

    fireEvent.error(container.querySelector("img"));

    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("Gone")).toBeDefined();
  });

  it("retries when the source changes after a failure", () => {
    const { container, rerender } = render(
      <SafeImage src="assets/missing.png" alt="Theme" />,
    );
    fireEvent.error(container.querySelector("img"));
    expect(container.querySelector("img")).toBeNull();

    rerender(<SafeImage src="assets/themes/spy.png" alt="Theme" />);

    expect(container.querySelector("img").getAttribute("src")).toBe(
      "assets/themes/spy.png",
    );
  });

  it("stays clickable in both states", () => {
    let clicks = 0;
    const onClick = () => (clicks += 1);

    const { container } = render(
      <SafeImage src="assets/themes/spy.png" alt="Theme" onClick={onClick} />,
    );
    fireEvent.click(container.querySelector("img"));
    fireEvent.error(container.querySelector("img"));
    fireEvent.click(screen.getByText("Theme").parentElement);

    expect(clicks).toBe(2);
  });
});

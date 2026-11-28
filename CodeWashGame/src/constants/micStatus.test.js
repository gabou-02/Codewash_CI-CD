// The two values here are compared in SkillCard's logic, not just displayed.
// These tests pin that contract: translate the display, never the sentinel.
import { describe, it, expect } from "vitest";
import { MIC_STATUS, isMicStatus } from "./micStatus";

describe("MIC_STATUS", () => {
  it("keeps the exact values the logic has always compared against", () => {
    expect(MIC_STATUS).toEqual({ LISTENING: "Listening...", OFF: "Mic Off" });
  });
});

describe("isMicStatus", () => {
  it("recognises both status placeholders", () => {
    expect(isMicStatus(MIC_STATUS.LISTENING)).toBe(true);
    expect(isMicStatus(MIC_STATUS.OFF)).toBe(true);
  });

  it("treats anything the player actually said as speech", () => {
    expect(isMicStatus("dragon")).toBe(false);
    expect(isMicStatus("mic off")).toBe(false); // case matters
  });

  it("treats an empty or absent value as speech, not a status", () => {
    expect(isMicStatus("")).toBe(false);
    expect(isMicStatus(undefined)).toBe(false);
    expect(isMicStatus(null)).toBe(false);
  });
});

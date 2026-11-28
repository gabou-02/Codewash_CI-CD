/**
 * Microphone status sentinels.
 *
 * `spokenText` carries two different things at once: what the player actually
 * said, or a status placeholder. `SkillCard` tells them apart by comparing
 * against these exact strings, so they are logic, not display text, and they
 * must not be translated. The UI translates them at the render site instead.
 *
 * The values are kept exactly as they were so behaviour does not change. That
 * a status is carried in the same state as user speech is a smell in its own
 * right, recorded as D06 (no seams) and worth splitting when the microphone
 * work is revisited (D21).
 */
export const MIC_STATUS = {
  LISTENING: "Listening...",
  OFF: "Mic Off",
};

/** True when `spokenText` holds a status rather than something the player said. */
export const isMicStatus = (spokenText) =>
  spokenText === MIC_STATUS.LISTENING || spokenText === MIC_STATUS.OFF;

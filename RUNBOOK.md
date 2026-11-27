# Runbook

For whoever is on duty when the game breaks during a school day. Start at the
symptom, apply the first fix that matches, and only then read the explanation.

Nothing here requires a developer. Anything that does says so and tells you who
to call.

## Before anything

**Which version is running?** The window title bar and the `.exe` file name.
Note it before you change anything; you will be asked.

**Do not delete a save to "clean things up".** Progress is stored locally and
there is no backup. The recovery steps below preserve it where possible.

## Symptom: the screen is blank or white

The most likely cause, and a known bug (`D03` in `docs/DEBT.md`).

A corrupted save is read at startup without a safety net, and the whole screen
fails to draw. One child's broken save blanks the game for everyone on that
machine.

**Fix, in order:**

1. Close and reopen the game. If it still blanks, continue.
2. Open the developer console: `Ctrl` + `Shift` + `I`, then the **Console** tab.
   Copy any red text, you will need it for the report.
3. In the **Application** tab, find **Local Storage**. You will see entries like
   `heroSkills_v23_p1`, `heroSkills_v23_p2`, `heroSkills_v23_p3`, one per
   profile slot.
4. **Copy the contents of all three into a text file before touching anything.**
   This is the only backup that will exist.
5. Delete **one** profile entry, the one belonging to the child who was playing,
   and reopen the game.
6. If it now starts, that profile's progress is lost but the other two are
   intact. Restore the saved text into the other slots if they were affected.

**Escalate** if deleting all three does not fix it: the problem is not the save.

## Symptom: no sound, or almost none

Known bug, `D01`. Two separate causes, both unfixed at the time of writing: the
sound files sit one folder deeper than the code looks, and a second set of paths
points at files that were never shipped.

**There is no fix on the user's side.** Check the obvious first so you do not
report a false alarm:

1. Settings (top-left gear): **Music Volume** and **SFX Volume** are not at 0.
2. The machine itself is not muted.

If both are fine, the game is simply silent. It does not affect play. Report it
and carry on.

## Symptom: a mini-game keeps playing after the child leaves it

Known bug, `D16`. Timers are not cleaned up when a screen is left, so sounds and
the Simon sequence keep running, and the microphone can restart itself.

**Fix:** close and reopen the game. It will come back clean.

## Symptom: a child's progress appears on another child's profile

Known bug, `D02`, and the most damaging one.

Switching profile does not reload everything, so an automatic save can write one
child's statistics into another's slot.

**Act immediately, every minute of play makes it worse:**

1. **Stop playing on that machine.**
2. Back up all three `heroSkills_v23_p*` entries as described above.
3. Do not switch profiles again until a developer has looked at it.

**Escalate.** Recovering the mixed data is not something to attempt live.

## Symptom: the microphone does not work

Known bug, `D21`. The reading feature calls a cloud service that has no
credentials configured, and there is no fallback. It very likely never worked in
the packaged `.exe`.

Worse, background noise can be read as a wrong answer and cost the child health
points. **In a noisy room, avoid the reading exercises** until this is fixed.

## Symptom: part of the screen is cut off, the battle panel is unreachable

Known bug, `D23`. The window is fixed at 1280x720 while the content needs more,
and there is no scrolling.

**Workaround:** the fullscreen button, top right. If that is not enough, the
machine's display scaling may be above 100 %; lowering it gives more room.

## Symptom: the game will not start at all

1. Is it the `.exe` or a developer machine? On a developer machine, run
   `node --version`: it must be **22.22.2+ or 24.15+**, and not Node 25. Node 20
   is too old and the tests will not even start.
2. Nothing in the window at all: check the console as described above.
3. Still nothing: reinstall from a known-good `.exe`. The previous releases are
   on the repository's Releases page.

## Collecting a useful report

The bug report button in the game is still a stub, `D24`, so do it by hand. A
report that gets fixed quickly contains:

- What the child was doing, in one sentence.
- The profile slot (1, 2 or 3) and the mini-game.
- A screenshot of the whole window.
- The red text from the **Console** tab.
- The contents of the `heroSkills_v23_p*` entry for that profile.
- The game version.

## Who to call

| Area | Owner |
|---|---|
| Themes, translations, UI text | Mateo |
| Bug reporting, trivia game, CI | Gabriel |

Every known bug mentioned here is listed in `docs/DEBT.md` with its identifier,
its impact and its estimate. If a symptom is **not** in this runbook, it is a new
one: collect the report above and say so explicitly, that is valuable.

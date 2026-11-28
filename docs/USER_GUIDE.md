# Playing the game

Level Up RPG turns six school skills into a role-playing game. A child picks a
profile, practises a skill, defeats creatures, and earns badges.

Written for teachers and parents. Nothing here needs a developer.

## The main screen

Six buttons sit around the edges.

| Where        | Button   | What it opens                     |
| ------------ | -------- | --------------------------------- |
| Top left     | gear     | Settings: profiles, volume, reset |
| Top left     | sparkles | Themes and cosmetics              |
| Top left     | letters  | Language                          |
| Top right    | lines    | Achievements and badges           |
| Top right    | arrows   | Fullscreen                        |
| Bottom right | bug      | Report a bug                      |

The hearts at the bottom are the player's health. Lose them all in a fight and
the skill loses a level, so they matter.

## Profiles

Three separate save slots, so three children can share one machine.

Open **Settings**, section **Select File**. Click a slot to switch to it, and
the pencil icon to rename it.

> **Warning.** Switching profile mid-session can mix two children's progress.
> This is a known bug (`D02`). Switch between sessions, not during one, and if
> you see progress on the wrong profile, see `RUNBOOK.md` immediately.

### Parent mode

The checkbox on a profile card marks it as a parent's. It asks for a
verification first. A parent profile unlocks the higher levels and difficulties
straight away, which is useful for demonstrating or testing, not for a child.

## The six skills

Each skill is a card on the main screen, with its own level, experience bar and
difficulty.

| Skill    | Called in game   | What the child practises                |
| -------- | ---------------- | --------------------------------------- |
| Reading  | Enchanting Table | reading words aloud or recognising them |
| Math     | Redstone         | mental arithmetic                       |
| Writing  | Crafting Table   | spelling, letter by letter              |
| Cleaning | Chest Management | sorting and organising loot             |
| Memory   | Match n' Hatch   | a pairs game                            |
| Patterns | Logic Building   | a Simon-style sequence game             |

The in-game names change with the theme; the table shows the default ones.

Click a card to start a fight. Answer correctly to hit the creature; answer
wrong and the creature hits back.

**Difficulty** runs from 1 to 7 **per skill**, so a child can be on level 5
reading and level 2 math. Raise it when answers come too easily.

> The reading exercises can use the microphone. It is unreliable and background
> noise can cost health points, so in a noisy room prefer the other skills. See
> `D21`.

## Badges and achievements

The **Achievements** drawer, top right, shows everything earned.

**Badges** come from skill levels, eight tiers: Wood at level 20, then Stone,
Gold, Iron, Emerald, Diamond, Netherite, and Obsidian at level 160. Past level
180, a Legendary badge is added every 20 levels.

**Special achievements** are the squares below, each with its progress on hover.
Three of them can never be earned right now; that is a known bug (`D15`).

## Themes

The **sparkles** button opens the theme menu. Six are available: Minecraft,
K-Pop Demon Hunters, Pokemon, Spy, Fantasy and Sci-Fi. Click one to apply it
immediately; the list scrolls.

A theme changes the background, the logo, and the names of the skills and
bosses.

> It does **not** yet change sounds, music or colours, and some artwork stays
> the same across themes. Known and tracked as `D12` and `D13`.

To add your own theme, see `docs/ADD_A_THEME.md`. It needs no programming.

## Cosmetics

Below the themes, **Border Effects** decorate the profile card: solid, gradient,
sparkle, electric, frost, fire, shadow, rainbow and others, plus a colour.
Purely decorative, and saved per profile.

## Language

The **letters** button, third from the left, opens the language list. English
and French are available; the choice is remembered.

Parts of the game are still only in English. That work is in progress (`D32`).

To add a language, see `docs/ADD_A_LANGUAGE.md`. One file, no programming.

## Sound

**Settings**, section **Audio Configuration**: one slider for music, one for
effects.

> The game is currently almost silent whatever the sliders say, a known bug
> (`D01`). It does not affect play.

## Reporting a bug

The bug button, bottom right, is **not functional yet** (`D24`). Until it is,
follow the "Collecting a useful report" section of `RUNBOOK.md`: what happened,
which profile, a screenshot, and the console output.

## Resetting a profile

**Settings**, at the bottom, **Danger Zone**, then **Delete Profile Progress**.

> This erases that profile's levels, badges and achievements. **It cannot be
> undone and there is no backup.** It only affects the profile currently
> selected, so check which one is active first.

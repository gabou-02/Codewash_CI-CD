# Adding a theme

A theme is one entry in one file. No code to write, nothing to register, no
list to keep in step. This guide assumes you are comfortable copying a block of
text and renaming things; you do not need to be a developer.

## What you need

- Images for your theme (see **Image sizes** below).
- The file `CodeWashGame/src/constants/gameData.jsx`.
- A text editor. VS Code is nicer than Notepad because it colours mistakes.

## Steps

### 1. Drop your images in

Put them in `CodeWashGame/public/assets/themes/`. You need at least one:

| Image | Used for | Required |
|---|---|---|
| background | the game's wallpaper | **yes** |
| preview | the tile in the theme menu | **yes**, can be the same file as the background |
| logo | the title at the top of the main screen | no |
| card back | the back of the cards in the memory game | no |

Anything you leave out falls back to the default theme, so a theme with just a
background already works.

### 2. Copy an existing theme block

Open `gameData.jsx`, find `export const THEME_CONFIG`, and copy one whole theme
block. The `fantasy` one is the simplest to start from. Paste it just before the
closing `};` of `THEME_CONFIG` and change the parts in the example below.

```js
  noir: {                                   // the id: lowercase, no spaces
    name: "Film Noir",                      // what players see in the menu
    preview: "assets/themes/noir.png",      // the menu tile
    style: {
      backgroundImage: `url('assets/themes/noir.png')`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    },
    assets: {
      logo: null,                           // null = this theme has no logo
      cardBack: "assets/themes/memorycard.jpg",
      mobs: {},                             // {} = keep the default creatures
    },
    skills: {
      reading: { name: "Interrogation", boss: "The Informant" },
      math: { name: "Forensics", boss: "The Accountant" },
      writing: { name: "Case Notes", boss: "The Editor" },
      cleaning: { name: "Evidence", boss: "The Fixer" },
      memory: { name: "Witnesses", boss: "The Barman" },
      patterns: { name: "Deduction", boss: "The Mastermind" },
    },
  },
```

That is the whole job. The theme appears in the menu on its own.

### 3. Rename the skills

`skills` is where a theme stops being a wallpaper. Each of the six skills gets
the name and the boss name your theme would use. Keep the six keys exactly as
they are (`reading`, `math`, `writing`, `cleaning`, `memory`, `patterns`) and
change only the text in quotes.

Leave a skill out and it keeps the default theme's wording, so you can do them
one at a time.

### 4. Change the creatures (optional)

`mobs: {}` keeps the default creatures. To replace one, name it and point at
your image:

```js
      mobs: {
        Zombie: "assets/mobs/noir/thug.png",
        Creeper: "assets/mobs/noir/stoolpigeon.png",
      },
```

Every creature you do not list keeps its default image, so you can replace them
gradually without the game ever showing a gap.

## Image sizes

Use these so nothing stretches or jumps when players switch theme:

| Image | Size | Format |
|---|---|---|
| background and preview | 1920 x 1080 | `.png` or `.jpg` |
| logo | 800 x 300, transparent background | `.png` |
| card back | 300 x 450 (portrait, 2:3) | `.jpg` |
| creature | 200 x 200, transparent background | `.png` or `.gif` |

Backgrounds are drawn with `cover`, so anything roughly 16:9 works; far from it
and the edges get cropped.

## Checking your work

From the `CodeWashGame` folder:

```bash
npm test
```

The theme tests check your work and name the problem. They fail when an image
you named does not exist, when your background is the same file as another
theme's, or when the menu and the config disagree. For example:

```
× theme "noir" > has a background image that exists on disk
  AssertionError: noir: missing assets/themes/noir.png
```

Green means your theme is complete. Then run `npm run dev` and look at it.

## Rules worth knowing

- **The id must be unique** and is what gets saved in the player's profile.
  Renaming it later loses the choice of anyone already using the theme.
- **Keep the JSON-ish punctuation**: quotes around text, a comma after every
  entry. A missing comma shows up as a blank screen; `npm test` tells you where.
- **File names are case sensitive.** `Scifi.png` and `scifi.png` are different
  files, and only one of them exists.
- **Do not delete the `minecraft` entry.** It is the default every other theme
  falls back to, which is what lets your theme be three lines long. Why it works
  that way is recorded in `docs/adr/0002-theme-resolution.md`.

## If something does not change with the theme

Then it is not wired to the theme system yet. That is known and tracked as
`D12` and `D13` in `docs/DEBT.md`: sounds, music, colours and some mini-game
artwork are still fixed. Adding a theme cannot fix those; the register says what
remains.

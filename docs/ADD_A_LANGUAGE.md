# Adding a language

You do not need to be a developer for this, and you do not need to touch any
code. One file in, one new language out.

## What you need

- The game's source folder, specifically `CodeWashGame/src/i18n/locales/`.
- A text editor. Notepad works; VS Code is nicer because it colours mistakes.
- The two-letter code of your language ([ISO 639-1 list](https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes)):
  `es` for Spanish, `de` for German, `it` for Italian, and so on.

## Steps

1. Open `CodeWashGame/src/i18n/locales/`. You will see `en.json` and `fr.json`.
2. **Copy `en.json`** and rename the copy to your language code, for example
   `es.json`. Always copy `en.json`: it is the reference and always holds every
   key.
3. Open your new file. At the top, change the `$meta` block:

   ```json
   "$meta": {
     "code": "es",
     "name": "Español"
   }
   ```

   `code` must match the file name. `name` is what players see in the language
   menu, so write it in the language itself ("Español", not "Spanish").

4. Translate **the right-hand side of each line only**. Never change the names
   on the left: those are what the game looks for.

   ```json
   "musicVolume": "Music Volume",      <- before
   "musicVolume": "Volumen de música", <- after
   ```

5. If you see `{{something}}` inside a sentence, leave it exactly as it is,
   braces included. The game replaces it with a value such as a player name or
   a level number. You may move it around in the sentence if your language
   needs a different word order.

6. Save the file. Start the game: your language is already in the language menu
   (the button at the top left of the main screen). There is nothing to
   register.

## Checking your work

From the `CodeWashGame` folder, run:

```bash
npm test
```

The language tests compare your file against `en.json`. If you forgot a line or
left one empty, the test names the exact key, for example:

```
catalog "es" > covers exactly the keys of the default language
```

Fix the key it names and run the command again. Green means your translation is
complete.

## Rules worth knowing

- **Every key must be present.** The tests fail on a missing one, on purpose: a
  half-translated game is worse than an untranslated one.
- **Nothing may be left empty.** `""` fails the tests too.
- **Keep the JSON punctuation.** Quotes around every text, a comma at the end of
  every line except the last of a block. If the game shows a blank screen after
  your change, a comma or a quote is almost certainly missing: run `npm test`
  and it will tell you the line.
- **Accents and non-Latin scripts are fine.** The files are UTF-8. Russian,
  Greek or Japanese work without any extra step.

## If something is not translated

A string still in English means it has not been extracted from the code yet, and
no locale file can fix it. Open an issue, or see `docs/DEBT.md` for what remains
to extract. The decision record behind this system is `docs/adr/0001-i18n.md`.

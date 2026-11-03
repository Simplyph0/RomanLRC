# RomanLRC

Paste or drop CJK `.lrc` lyrics and get romanized lyrics in a separate pane, live. Runs entirely in your browser and works offline: nothing is uploaded.

- **Japanese** → Hepburn romaji (kanji read via the kuromoji dictionary; particles は/を/へ read as *wa/o/e*)
- **Chinese** → pinyin (tone marks, numbers, or none)
- **Korean** → Revised Romanization (with basic linking of final consonants)
- LRC timestamps and `[ti:]`/`[ar:]` metadata are preserved (timestamps optional); enhanced word tags `<mm:ss.xx>` are stripped
- Options: interleave original lines, capitalize lines, copy, download as `.lrc`

## Use

Online: the GitHub Pages site for this repo (see the repo's *About* link).

Locally (Python 3 only; a server is needed because browsers block the dictionary load from `file://`):

```bash
python3 serve.py        # opens http://127.0.0.1:8000/
```

Everything it needs is in `vendor/`, so no internet is required after you have the folder.

## Develop

```bash
npm test                # Node 18+, no dependencies to install
```

The converter is `romanize.js` (works in browser and Node); `index.html` is the UI.

## Limitations

- Han-only lines are ambiguous between Chinese and Japanese. *Auto* treats them as Japanese if the file contains any kana; use the dropdown to force one.
- Chinese polyphonic characters are chosen by pinyin-pro's heuristics and can be wrong in lyrics.
- Japanese readings come from the dictionary and can be wrong for names and unusual kanji readings.
- Korean romanization does not model every sound change (e.g. nasalization, tensification).

## License

Public domain ([Unlicense](LICENSE)). Bundled third-party files keep their own licenses: see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

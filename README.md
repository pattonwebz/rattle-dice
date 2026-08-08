# Rattle

A dice app for tabletop games. Roll polyhedral dice and dice pools with real
3D animation, right in the browser. No build step, no dependencies, no
account. Runs as a static site on GitHub Pages.

## Features

- **Full polyhedral set** — d4, d6, d8, d10, d12, d20, and d100 (percentile
  pair), rendered as real 3D polyhedra with pips and numbers.
- **Three animation modes** (top-right settings):
  - **Full** — dice tumble across the table with 3D spin and a landing bounce.
  - **Minimal** — a single die spins in the center of the stage.
  - **None** — instant result.
  - Respects your OS `prefers-reduced-motion` setting automatically.
- **Dice expression parser** — roll anything with dice notation:
  - `2d6+3`, `1d8+2d6-1` — pools and modifiers
  - `4d6dl1` — drop lowest (ability scores)
  - `2d20kh1` / `2d20kl1` — keep highest/lowest (advantage/disadvantage)
  - `3d6r1` / `3d6rr1` — reroll once / reroll until changed
  - `2d6!` — exploding dice
  - `3d6mi3` / `3d6ma5` — min/max clamps
- **Dice tray** — one-tap rolls for each die, or select several and roll them
  together.
- **Quick rolls** — common tabletop presets (checks, advantage, 4d6 drop
  lowest, percentile, and more).
- **Natural 20 / natural 1** detection with optional crit and fumble flags.
- **Roll history** — the last 50 rolls, click any entry to reroll it.
- **Sound effects** — dice ticks and thuds (toggleable).
- Settings and history persist in your browser's local storage.

## Run locally

Any static file server works:

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000. No install step.

## Deploy to GitHub Pages

This repo is a plain static site — no build step. Deploy it from any branch
or folder:

1. Push this repository to GitHub.
2. Go to **Settings → Pages** for the repository.
3. Under **Build and deployment**, choose:
   - **Source:** Deploy from a branch
   - **Branch:** `main`, folder `/ (root)`
4. Save. GitHub Pages serves the site at
   `https://<your-username>.github.io/<repo-name>/` within a minute or two.

The `.nojekyll` file is already in place so Pages serves the files as-is.

## Project layout

```
index.html          App shell
styles.css          Design system, dark felt theme, dice styling
app.js              Dice engine, expression parser, animation, UI
dice-systems-research.md   Research notes on dice across D&D, Warhammer,
                           and other tabletop systems
```

## How the dice work

Dice are built as real polyhedra — d4 tetrahedron, d6 cube, d8 octahedron,
d10 pentagonal trapezohedron, d12 dodecahedron, d20 icosahedron — each face
a `<div>` transformed into place with `matrix3d`. The roll animation drives
`transform` and `opacity` only (GPU-friendly), and each die settles with its
result face up. Percentile rolls are a pair of d10s (tens + units), read as
00-0 → 100.

Opposite faces sum to sides+1 on the d6, d8, d10, d12, and d20, matching
standard physical dice. Randomness comes from `crypto.getRandomValues`.

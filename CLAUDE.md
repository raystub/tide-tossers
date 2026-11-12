# Tide Tossers — project brief

Tide Tossers is a 2D **swim-and-rescue** game for phones. You swim real sea creatures through scrolling reefs, break ghost nets, traps and trash to free trapped wildlife, and lead the animals you free to open water before the tide runs out. The look is **vibrant and glossy, in the spirit of Feeding Frenzy 2**: real species with saturated colour, bold outlines and big glossy eyes, in lush layered reefs. No cartoon mouths or brows, and nothing copied from Feeding Frenzy or Angry Birds.

History: v0.1–v0.4 were a kelp-sling launcher (kept playable at `/v0.4/`). v0.5 dropped the sling for full swimming. Design: `docs/DESIGN.md`. What v0.5 covers and how to test it: `docs/PROTOTYPE_SPEC.md`.

## Hard rules

- **Tech:** plain HTML + JavaScript, Phaser 3.80.1 (vendored at `vendor/phaser.min.js`, Matter.js physics built in). No bundler or build step; classic `<script>` tags in a fixed order (see `index.html`).
- **Phone first.** Touch: left thumb = floating stick, right thumb = ability. Preview the phone layout on desktop with `?mobile=1`; `?canvas=1` forces the Canvas renderer (used by the tests).
- **Physics is fixed-rate** (`PHYSICS_HZ`, stepped in `GameScene.update`), so the game runs the same on 60/90/120 Hz screens. Read velocities with `TT.vel(body)`; scale any per-step velocity edit by `TT.STEP`.
- **No TileSprites for scrolling layers** (they re-upload a canvas every frame on phones). Use the `Strip` helper in `js/scenery.js`.
- **All tuning numbers live in `js/config.js`.** Level data lives in `js/levels.js`.
- **Art** is drawn in code (`js/art.js` creatures and objects, `js/scenery.js` backgrounds and props). A PNG at `assets/species/<id>.png` listed in `assets/manifest.js` replaces the drawn creature.
- **Animals are never harmed.** Rescuers break junk, not animals. Lionfish swim away when driven off.
- **Animal facts:** general, widely known facts only, each listed in `docs/FACTS_TO_VERIFY.md` for a person to check.
- Wrap all localStorage access in try/catch.
- Commits: no Claude co-author lines.

## File layout

```
index.html, css/style.css, manifest.webmanifest, sw.js (generated), icons/, vendor/
js/config.js      tuning: physics, swimming, abilities, difficulty, gadgets
js/levels.js      level data
js/save.js        progress (localStorage key tideTossers.v3)
js/audio.js       Web Audio sound effects, ambience, vibration
js/art.js         drawn creatures, junk, nets, coral, rocks; swim-animation baking
js/water.js       waterline, tide, buoyancy, drag, currents (physics only)
js/scenery.js     parallax layers, reef props, surface, darkness, exit ring
js/player.js      swim model, team switching, the seven abilities
js/controls.js    touch stick + ability taps, mouse, keyboard
js/entities.js    junk, nets, lines, traps, coral, lionfish, impact damage
js/ocean.js       particles, the rescued school, background fish, colour return
js/tutorial.js    first-run captions and ghost finger
js/scenes/        game.js (rules + fixed-step loop), ui.js (HUD), menus.js
tests/            smoke.py, play.py + bot.js (bot plays every level), harness.py
tools/make_sw.py  regenerate sw.js after changing game files
```

## How to check your work

```
python3 tests/smoke.py          # every level loads, swims, uses its ability, zero console errors
python3 tests/play.py           # the bot must win all 8 levels (DIFF=current SPEED=3)
python3 tools/make_sw.py        # then commit; GitHub Pages serves the repo root
```

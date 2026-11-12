# Tide Tossers v0.2 — rescue prototype spec

**Goal:** test whether the new direction is fun: launch, **steer**, break junk to **free trapped animals**, and watch the scene **come back to life**, in a **realistic** look. 8 levels across two real places, 7 rescuers, reef health stars, a small field guide.

Build in milestone order (bottom of this file); keep the game playable after each milestone.

---

## 1. Screen and controls

- Logical size 1280 × 720, `Phaser.Scale.FIT`, centered; mouse and touch.
- **Aim:** press near the sling, drag back (max 160 px), release to launch. Launch speed scales with pull distance.
- **Steer (new):** after launch, while the pointer is held down, the rescuer is pushed toward the pointer (see section 3). Drains stamina.
- **Ability:** a quick tap (under 180 ms and under 10 px of movement) while the rescuer is moving fires its ability once. Desktop also: `Space`.
- **Keys:** `R` restart, `Esc` level select.
- Camera: fixed for levels up to 1280 wide; for wider levels (up to 2400) follow the rescuer, then pan back once things settle. Drag to pan while idle.

## 2. Water physics (numbers in `config.js`)

Matter.js, gravity `y = 1.0`. Each level has `waterline` (px, or `null`).

For each dynamic body whose center is below the waterline, every step:
- **Buoyancy:** upward force `mass × gravity × BUOYANCY_SCALE × buoyancy` (floats 1.3, neutral 1.0, sinks 0.6, darts 1.0).
- **Drag:** velocity × `(1 − WATER_DRAG)` (start 0.04); angular velocity × `(1 − 0.06)`. Darters take half drag; the manatee ignores drag (not in v0.2).
- **Skip:** crossing downward at under 18° below horizontal and above `SKIP_MIN_SPEED` → `vy = −vy × 0.55`, `vx × 0.9`; max 2 skips.
- **Refraction:** non-skip entry → `vx × 0.7`.
- **Splash:** particles at entry; turtle and hammerhead nudge bodies within 120 px.
- **Sediment:** when a heavy body (oil drum, cinderblock, turtle) hits the sea floor hard, spawn a brown-grey silt cloud that fades over 2 s and lowers visibility where it is.
- **Tide** (`tide: {min, max, step}`): waterline moves by `step` between shots over ~1.5 s, bouncing between min and max; HUD tide arrow.
- **Darkness** (`dark: true`): near-black overlay (alpha 0.88) with soft light around `glowSpots` (plankton patches) and a faint glow trail around anything moving underwater (bioluminescent plankton). Glow Lure removes the overlay.

## 3. Steering

- While the pointer is held after launch and stamina > 0: direction = normalized vector from rescuer to pointer; apply force `STEER_FORCE × direction × mass`. `STEER_FORCE_WATER` is about 4× `STEER_FORCE_AIR`.
- Exception: the flying fish uses water-strength steering while gliding.
- Stamina: base 1.5 s of steering per rescuer, multiplied by the rescuer's steering stat (Low 0.5, Normal 1.0, High 1.5) and the difficulty (Splash 1.5, Current 1.0, Riptide 0.75, Abyss 0.5).
- Show a thin curved stamina arc beside the rescuer while steering; fade it out when empty.
- Steering can bend a path but not reverse it: cap the turn rate at `STEER_MAX_TURN_DEG_PER_S` (start 120).

## 4. Rescuers (7 for v0.2)

| id | Rescuer | Buoyancy | Steering | Ability (one tap) |
| --- | --- | --- | --- | --- |
| `tang` | Atlantic blue tang | Neutral | Normal | Burst: velocity × 1.6 in current direction |
| `flyingfish` | Flying fish ("Finny") | Floats | Glides | Glide: cancel gravity and drag for 1.0 s; 2× damage vs plastic and glass |
| `puffer` | Pufferfish ("Puff") | Floats | Low | Inflate to 3× over 0.15 s, radial impulse within 160 px; immune to lionfish |
| `pistolshrimp` | Pistol shrimp | Sinks | Normal | Snap (underwater only): shockwave radius 140 px; heavy damage to glass and plastic, light damage to everything else, makes lionfish flee; above water it does nothing (show a small fizzle) |
| `loggerhead` | Loggerhead sea turtle | Sinks | Low | Dive: strong downward push for 0.6 s, then shoves whatever it hits with 2× mass |
| `swordfish` | Swordfish ("Spike") | Darts | Normal | Pierce: straight line at 1.8× speed, no gravity for 0.6 s; slices nets and fishing line instantly; passes through wood, plastic and tin, destroying them; stops dead on stone/concrete |
| `hammerhead` | Scalloped hammerhead | Darts | Normal | Ram: horizontal dash at 1.5× speed; 3× damage vs stone and concrete |

**Realistic drawing** (in `art.js`, used unless `assets/species/<id>.png` exists): correct body shape for each species, countershading (darker back, pale belly), accurate colors (blue tang: royal blue with a yellow tail; loggerhead: reddish-brown shell, yellow-brown skin; swordfish: dark back, silver sides, long flat bill; hammerhead: grey-bronze, wide cephalofoil; pufferfish: tan with dark spots; pistol shrimp: translucent tan with one oversized claw; flying fish: deep blue back, silver belly, long pectoral fins). Translucent fins, small dark eyes, no smiles or eyebrows. Swimming animation: tail beats faster when steering, body bends slightly.

## 5. Threats, trapped animals, coral, invasives

**Breakable threats (materials):**

| id | Threat | Look | Density | Buoyancy | HP | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `plastic` | Plastic crate / bottles | Faded blue/white plastic | 0.0012 | Floats | 30 | Breaks into small pieces |
| `glass` | Glass bottle | Green-brown, translucent | 0.002 | Neutral | 25 | Shatters |
| `wood` | Trap frame / boat plank | Weathered grey wood | 0.002 | Floats | 60 | |
| `tin` | Oil drum / tin | Rusty red-brown metal | 0.004 | Sinks | 120 | Swordfish pierces it |
| `concrete` | Cinderblock / concrete | Grey, algae-stained | 0.006 | Sinks | 220 | Hammerhead's specialty |

**Containers (hold trapped animals):**
- `net`: a ghost-net panel (static or hanging, drawn as a frayed rope mesh). HP 80; only takes damage from hits over a speed threshold, but the swordfish cuts it instantly; Net Cutter gadget removes one. When destroyed, the animals behind it are freed.
- `trap`: a wire crab trap (rectangle of thin bars with a latch). HP 100. Animals inside are freed when it breaks or when it is knocked over onto its door side (stretch, optional).

**Trapped animals** (`hatchling`, `seahorse`, `fishschool`): drawn realistically, small, gently struggling. When freed they swim off-screen with natural motion (fish school = 12–20 small fish that move as a group), then some return to swim in the background.

**Living coral** (`coral`): static, colorful brain/branching coral. Hits above `CORAL_DAMAGE_SPEED` lower reef health by 5% each (max once per second) with a small puff of fragments. It never breaks fully.

**Invasive lionfish** (`lionfish`): hovers and slowly patrols near a container. If a rescuer (except the pufferfish) touches it, the rescuer loses its ability for this shot and gets knocked back. A pistol-shrimp snap, a puffer inflation nearby, or any hit over a threshold makes it **flee off-screen** (never shown hurt) and raises reef health. Realistic look: red-brown and white stripes, long fan-like spines.

## 6. Reef health, win and lose

- Each level starts with `reefHealth = startHealth` (default 30%).
- **Up:** each freed animal +X, each threat object destroyed +Y, each lionfish driven off +Z, where X/Y/Z are set per level so a clean, efficient run reaches about 95%.
- **Down:** coral hits −5%.
- **Win:** every trapped animal freed. Then count unused rescuers (score bonus only).
- **Lose:** no rescuers left, everything settled (speed under 0.2 for 2 s, or 6 s max), and animals still trapped.
- **Stars:** 1 = all freed; 2 = reef health 70%+; 3 = 90%+.
- **Living-ocean color:** apply a Phaser `postFX.addColorMatrix()` on the main camera; saturation goes from about −0.6 at 30% health to 0 at 90%+ (lerp smoothly). On non-WebGL fall back to a grey overlay whose alpha drops as health rises.
- HUD: a reef-health bar with the percentage, top center.

## 7. Levels (8)

Level data in `js/levels.js`:

```js
{
  id: "1-1", name: "Tide Pool Tangle", world: 1, place: "Florida Keys",
  background: "keys_tidepool", width: 1280,
  waterline: 600, tide: null, dark: false, glowSpots: [],
  sling: { x: 200, y: 520 },
  queue: ["tang", "tang", "flyingfish"],
  objects: [ { k: "plastic", x: 880, y: 560, w: 60, h: 40, angle: 0 } ],
  containers: [ { k: "net", x: 950, y: 520, w: 80, h: 120, holds: [{ k: "hatchling", n: 2 }] } ],
  coral: [ { x: 1100, y: 640, w: 90, h: 60 } ],
  invasives: [],
  startHealth: 30, healthGain: { animal: 15, object: 3, invasive: 10 }
}
```

Lay out each level so it is solvable on Current with the given queue, and use steering in at least one intended solution per level.

| Level | Name | Place | Water | Queue | Teaches |
| --- | --- | --- | --- | --- | --- |
| 1-1 | Tide Pool Tangle | Florida Keys tide pool | Low | Tang ×3 | Launch; a plastic pile pinning a net with 2 hatchlings |
| 1-2 | Steady Hands | Keys seagrass shallows | Mid | Tang, Tang, Flying fish | **Steering**: the net is tucked behind a mangrove root, reachable only by curving underwater |
| 1-3 | Bottle Graveyard | Keys shallows | Mid | Pistol shrimp, Flying fish, Tang | Pistol shrimp shockwave on a glass-and-plastic heap over a trapped seahorse |
| 1-4 | Spines | Keys reef edge | Mid | Puffer, Pistol shrimp, Tang | Lionfish guarding a crab trap; living coral nearby to avoid |
| 1-5 | Stone-Crab Traps | Keys channel | Low | Loggerhead, Tang, Pistol shrimp, Hammerhead | Two sunk wire traps under concrete debris; heavy pushes and sediment clouds |
| 2-1 | Rising Tide | Galápagos lagoon | Split, tide 420–520 | Swordfish, Tang, Puffer, Hammerhead | Tide moving between shots; a fish school in a ghost net that the tide submerges |
| 2-5 | Longline | Galápagos open water | Split | Swordfish, Swordfish, Flying fish | Swordfish slicing fishing lines and nets in one steered pass; a concrete block that stops it |
| 2-9 | Lava Tube | Galápagos lava sea cave | Split, dark | Tang, Puffer, Pistol shrimp, Hammerhead | Darkness with glowing plankton; a free Glow Lure granted once with a hint |

**Backgrounds (procedural realistic):**
- **Florida Keys:** pale-blue sky with soft cumulus, turquoise shallow water fading to deeper teal, white sand floor, seagrass blades swaying, mangrove prop roots at the edges, distant low keys on the horizon.
- **Galápagos:** hazy sky, black volcanic rock shores, deeper cobalt water, sea lions resting on far rocks (silhouettes), sandy-grey floor with lava boulders.
- **Lava cave:** black basalt walls with rough edges, a pale opening to the sky (2-9 only), plankton patches as soft blue-green glows.
- Underwater for all: animated caustics on the sea floor (moving light ripple pattern), slanted sun rays near the surface, depth fog that darkens and blues the lower water.
- 3 parallax layers per background.

## 8. Difficulty

| Setting | Aim guide | Rescuers | Threat HP | Stamina | Score × |
| --- | --- | --- | --- | --- | --- |
| Splash | Full simulated path incl. skip/bend/drag | +2 (repeat the queue) | 75% | ×1.5 | 1.0 |
| Current | First 50% | As listed | 100% | ×1.0 | 1.25 |
| Riptide | First 15% | −1 (min 1) | 125% | ×0.75 | 1.5 |
| Abyss | None | −1 (min 1) | 150% | ×0.5 | 2.0 |

The aim guide simulates the shot with the same rules (about 120 steps), ignoring steering, and is drawn as dots.

## 9. Gadgets (4 for v0.2)

One per level, chosen before the first shot. Start with 3 of each; earn 1 random gadget per new 3-star result.
- **Sonar Scope:** full aim guide for the next shot.
- **Extra Kelp:** +25% launch power for the next shot.
- **Glow Lure:** removes darkness for the level (dark levels only).
- **Net Cutter:** tap one net or fishing line to remove it.

## 10. Field guide

A Field Guide screen reachable from level select. Cards for the 7 rescuers, the 3 trapped species, the lionfish, and the two places. Each card: the realistic drawing, common name, scientific name, where it lives, typical size, one well-known fact, and the main threat it faces. A card unlocks the first time that species appears in a level you clear. Keep facts general and well-known; list each fact in `docs/FACTS_TO_VERIFY.md` with the card it belongs to.

## 11. Screens

1. **Title:** "Tide Tossers" over a slow, realistic underwater scene (rays, caustics, a passing fish school); Play and Field Guide buttons.
2. **Level select:** difficulty toggle (4 pills), two rows (Florida Keys, Galápagos) of level tiles with stars and best reef health, gadget counts. All levels unlocked.
3. **Game:** HUD with rescuer queue (top-left), reef health bar (top-center), restart and menu (top-right), gadget button (bottom-left, before the first shot), tide arrow when relevant.
4. **Result:** stars, reef health %, animals freed, score, any new field-guide cards; Retry, Next, Levels.

Save to localStorage key `tideTossers.v2`: stars and best reef health per level per difficulty, last difficulty, gadget counts, unlocked field-guide cards. Wrap in try/catch.

## 12. Out of scope tonight

Lives, ads, shop, skins, pearls, the other 13 rescuers, currents, whirlpools, weather, Puzzle/Arcade modes, the big-rescue finale levels, other gadgets, music. Leave a `currents: []` field in level data, ignored.

---

## Milestones

1. **Launch + steering:** level 1-1 and 1-2 playable with the tang: aim, launch, steering with stamina, collisions, plastic breaking, a net freeing hatchlings, win/lose.
2. **Water:** waterline, buoyancy, drag, skips, refraction, splash, sediment.
3. **Rescuers and threats:** all 7 abilities, all materials, nets, traps, coral penalty, lionfish; levels 1-1 to 1-5.
4. **Reef health and living ocean:** health meter, stars, color return, freed animals swimming away and returning.
5. **Galápagos:** tide, darkness and plankton glow, Glow Lure; levels 2-1, 2-5, 2-9.
6. **Realistic art pass:** species drawings, backgrounds, caustics, rays, depth fog; asset-override loading.
7. **Difficulty, gadgets, field guide, save, screens.**
8. **Polish:** particles, subtle screen shake on heavy impacts, Web Audio sounds (splash, snap, rope tear, bubbles).

## Manual test checklist

- [ ] Page loads from a local server with no console errors, with `assets/` empty.
- [ ] Steering works with mouse and touch, is strong underwater, weak in air, and stops when stamina runs out.
- [ ] A quick tap fires the ability; holding steers; the two never trigger each other.
- [ ] Level 1-2 can be won by steering around the mangrove root.
- [ ] The pistol shrimp snap shatters glass underwater and fizzles above water.
- [ ] Lionfish disarm a rescuer on contact (except the pufferfish) and flee from the snap or puffer; they are never shown hurt.
- [ ] Hitting living coral lowers reef health; it never breaks fully.
- [ ] Freed animals swim away and some return to the background.
- [ ] The scene's color visibly returns as reef health rises.
- [ ] The swordfish slices nets and lines and stops on concrete.
- [ ] Level 2-1's tide moves between shots; level 2-9 is dark, Glow Lure lights it, and it is beatable without it.
- [ ] The 4 difficulty settings change aim guide, rescuer count, threat HP and stamina.
- [ ] Field-guide cards unlock on clearing levels, and stars, reef health and cards survive a reload.
- [ ] All 8 levels can be won on Current.
- [ ] Nothing on screen looks cartoony: no faces, smiles or googly eyes.

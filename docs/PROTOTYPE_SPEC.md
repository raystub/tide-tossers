# Tide Tossers v0.5 — what the prototype covers

v0.5 replaces the sling launcher with a full swim game. It is a phone-first browser game (installable from GitHub Pages).

## Core loop

1. The tide tosses your first rescuer into the level.
2. Swim with the stick. Arrows at the screen edge point to trapped animals.
3. Use the rescuer's ability (and switch between team members) to break nets, lines and traps.
4. Freed animals join a school that follows you. Each rescue recharges abilities and wins back tide time.
5. When everyone is free, an "open sea" current appears. Swim into it to finish, or clean up the remaining junk first for more reef health.
6. Reef health sets the stars: 1 = everyone freed, 2 = 70%+, 3 = 90%+. Smashing living coral and lionfish stings cost you.

Fail: the tide timer runs out with animals still trapped (Splash difficulty has no timer).

## In this build

- 8 scrolling levels: Florida Keys 1-1 to 1-5, Galápagos 2-1, 2-5, 2-9 (tides, currents, a dark lava tube).
- 7 rescuers and abilities: tang (dash), flying fish (leap and glide), pufferfish (puff), pistol shrimp (snap), loggerhead (shove), swordfish (pierce), hammerhead (ram).
- 4 difficulties, 4 gadgets (Bubble Shield, Extra Kelp, Glow Lure, Net Cutter), field guide, tutorial for swimming, abilities and switching.
- Engine: fixed 120 Hz physics, parallax scenery from repeating tiles, baked swim animation, offline support.

## Not in this build

Worlds 3–5, Puzzle and Arcade modes, lives, shop/cosmetics, painted art, music tracks, tidal big-rescue finales.

## Manual test checklist (phone)

- [ ] Stick appears under the left thumb, follows it, and the creature turns smoothly.
- [ ] Right-thumb tap fires the ability while the left thumb keeps steering.
- [ ] SWITCH changes rescuer; cooldown rings show on the portraits.
- [ ] Leaping out of the water arcs back in; the flying fish glides over the sandbar in 1-2.
- [ ] Freed animals follow you; the exit appears when all are free.
- [ ] Coral glows and costs 5% only when dashed into; lionfish sting unless you are the pufferfish.
- [ ] Tide timer counts down, turns red under 15 s, and the level fails at 0 with animals trapped.
- [ ] Pause opens when the app goes to the background.
- [ ] Frame rate feels smooth in a busy scene (currents level 1-5, dark level 2-9).

# Tide Tossers — design summary (full game)

Context for the build; tonight's prototype covers only part of it (see `PROTOTYPE_SPEC.md`).

**One line:** launch real sea creatures through air and water, steer them as they swim, and break apart ghost nets, traps and trash to free trapped wildlife and bring real ocean places back to life.

## What sets it apart from Angry Birds

1. **Rescue, not destruction:** you break junk, never animals. You win by freeing every trapped animal.
2. **Steering after launch:** drag to guide the rescuer mid-swim with a short stamina bar; strong underwater, weak in air.
3. **Real animal abilities:** each ability is based on a real behavior.
4. **Living ocean:** freed fish scatter and return, cleared areas regain color, storms and night levels change the scene.
5. **Field guide:** every species unlocks a card with real facts.
6. **Real places:** Florida Keys, Galápagos, Monterey Bay, Great Barrier Reef, Mariana Trench.

## Decisions

| Topic | Decision |
| --- | --- |
| Platforms | Web, iOS and Android at launch (production engine Unity 2D or Godot; prototypes in Phaser) |
| Art | Vibrant and glossy, in the spirit of Feeding Frenzy 2: real species, bold outlines, big glossy eyes, lush colourful reefs |
| Primary platform | Phones first |
| Phone controls | Slow-motion while steering, swipe-stick steering, aim from anywhere, vibration, full-width screen, ghost-finger tutorial |
| Threats | Pollution, lost fishing gear, invasive species; no villain gang |
| Launch size | Worlds 1–2 (30 levels); Worlds 3–5 free updates |
| Monetization | Free plus extras: cosmetics, optional rewarded ads, lives |
| Lives | 5; failing costs one; one refills every 20 min; replays of cleared levels are free |
| Difficulty | Splash, Current, Riptide, Abyss, chosen per level |
| Modes at launch | Campaign, Puzzle, Arcade |
| Launch gadgets | Current Compass, Sonar Scope, Extra Kelp, Bubble Shield, Anchor Weight, Echo Shell, Glow Lure, Net Cutter, Pearl Magnet |

## Core loop

Survey the scene (trapped animals, threats, waterline) → pick rescuer order → aim and launch from the Kelp Sling → steer while swimming → tap for the ability → free every trapped animal. Reef health decides stars.

## Water rules

Normal gravity in air; strong drag and weaker gravity underwater. Shallow shots skip off the surface (max 2); steep shots bend on entry. Floaters rise, sinkers drop, darters keep going straight. Plastic floats; metal and concrete sink. Currents push, vents lift, whirlpools spin. Tide levels move the waterline between shots.

## Rescuers

| Rescuer | World | Buoyancy | Steering | Ability | Real basis |
| --- | --- | --- | --- | --- | --- |
| Atlantic blue tang | 1 Florida Keys | Neutral | Normal | Quick burst (starter) | Tangs sprint in bursts |
| Flying fish ("Finny") | 1 | Floats | Glides in air | Glide ~1 s; breaks light plastic and glass | Gliding fins |
| Pufferfish ("Puff") | 1 | Floats | Low | Inflate 3×, push debris apart; immune to lionfish spines | Inflates with water |
| Pistol shrimp | 1 | Sinks | Normal | Snap shockwave shatters glass and brittle plastic nearby; underwater only | Cavitation bubble snap |
| Loggerhead sea turtle | 1 | Sinks | Low | Dives and shoves heavy objects | Strong deep diver |
| Florida manatee ("Barnacle") | 1 | Sinks, ignores drag | Very low | Huge momentum, pushes several layers | Up to ~500 kg |
| Swordfish ("Spike") | 2 Galápagos | Darts | Normal | Straight high-speed line; slices nets and lines; pierces wood, plastic, tin; not stone | Very fast swimmer |
| Scalloped hammerhead | 2 | Darts | Normal | Ram dash breaks stone and concrete | Galápagos hammerhead schools |
| Sardine school ("The Fry") | 2 | Darts | High | Splits into three | Bait balls |
| Galápagos sea lion | 2 | Neutral | Double stamina | Bounces off surfaces, tight turns | Agile swimmer |
| Sea otter | 3 Monterey Bay | Floats | Normal | Rock smash cracks trap latches | Uses rocks as tools |
| Giant Pacific octopus | 3 | Neutral | High | Squeezes through gaps; ink drives off invasive crabs | Fits through tiny gaps |
| Bottlenose dolphin | 3 | Darts | High | Echolocation reveals hidden animals | Sees with sound |
| Archerfish | 4 Great Barrier Reef | Neutral | Normal | Water jet knocks things off ledges above water | Shoots insects off leaves |
| Peacock mantis shrimp | 4 | Sinks | Low | Punch cracks the hardest casings | One of nature's fastest strikes |
| Parrotfish | 4 | Neutral | Normal | Chews dead coral rubble | Grinds coral into sand |
| Clownfish ("Dash") | 4 | Neutral | Normal | Burst; safe in anemones | Protective slime |
| Electric ray | 4 | Sinks | Low | Pulse scatters invasive species | Electric shock |
| Anglerfish | 5 Mariana Trench | Neutral | Normal | Lure lights the dark | Glowing lure |
| Vampire squid | 5 | Neutral | High | Glow burst reveals and pushes | Light flashes |

## Threats

Ghost nets (rope, tear rather than shatter), fishing line, abandoned crab/lobster traps (wire cages with latches), plastic (floats), glass bottles, oil drums and tin (sink), concrete and cinderblock debris, derelict boat hulls (drift), invasive lionfish (spines hurt rescuers) and European green crabs, crown-of-thorns starfish outbreaks. **Living coral is protected:** breaking it lowers reef health. Dead coral rubble is fair game.

**Trapped animals:** sea turtle hatchlings, seahorses, fish schools, an octopus in a trap, sea lion pups, a manta ray; each world ends with a big rescue (whale shark or humpback tangled in a huge net, freed in stages).

## Worlds

| # | Place | Waterline | Threats | New mechanic |
| --- | --- | --- | --- | --- |
| 1 | Florida Keys: beaches, tide pools, mangroves, seagrass | Mostly above water | Plastic, stone-crab traps, fishing line, lionfish | Slinging, splash, steering |
| 2 | Galápagos: volcanic shores, lagoons, lava sea caves | Split air/water | Ghost nets, longline gear, plastic | Tides; dark lava caves (2-9 to 2-11) |
| 3 | Monterey Bay: harbor and kelp forest | Docks above, hulls below | Derelict boats, crab pots, green crabs | Drifting boats, buoys, kelp |
| 4 | Great Barrier Reef | Mostly underwater | Crown-of-thorns, bleaching, plastic | Currents; living coral |
| 5 | Mariana Trench | Fully underwater, no gravity | Barrels, trawl nets | Darkness, vents |

## Living ocean

Freed animals swim away and return to the background; the scene starts dull and regains color as reef health rises; heavy objects hitting the floor raise silt clouds; storm levels push floating objects with waves; night levels make plankton glow around anything moving; seabirds and fish react to splashes.

## Scoring

Reef health meter (starts low). Up: freeing animals, removing junk, driving off invasives. Down: breaking living coral, crushing seagrass. Stars: 1 = all animals freed, 2 = 70%+, 3 = 90%+. Unused rescuers add leaderboard points. Pearls buy cosmetics.

## Difficulty

| Setting | Aim guide | Rescuers | Junk/net strength | Steering stamina | Score × |
| --- | --- | --- | --- | --- | --- |
| Splash | Full path incl. water effects | +2 | 75% | +50% | 1.0 |
| Current | First half | Standard | 100% | Normal | 1.25 |
| Riptide | Short stub | −1 | 125% | −25% | 1.5 |
| Abyss | None | −1 | 150%, invasives return | −50% | 2.0 |

## Art and audio

Real species drawn bright and glossy with bold outlines and expressive eyes (no cartoon mouths); personality from behaviour. Painted backdrops of the real places with sun rays, rippling light on the floor, and murk that deepens with depth. HUD: rescuers, stamina bar, reef health, objectives. Audio: real ambience per place (waves and gulls, sea lions, snapping-shrimp crackle, whale song).

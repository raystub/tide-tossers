# Tide Tossers — design summary (full game)

**One line:** swim real sea creatures through living reefs and down into the deep sea, break apart ghost nets, traps and trash to free trapped wildlife, and lead them to open water.

The full level-by-level plan, with sources for the science and the launch research, lives in the Claude doc "Tide Tossers: Campaign Plan (7 worlds, 42 levels)": https://claude.ai/artifact/5TBJWc3AJbPJKbGNkpXL6i. This file is the summary the code follows.

## What sets it apart

1. **Rescue, not destruction:** you break junk, never animals. You win by freeing every trapped animal.
2. **You swim the whole time:** one thumb steers, the other triggers the creature's ability.
3. **A new real animal every level:** each ability is based on a real behaviour, and the last two leads join your team when they can live there.
4. **The school you save follows you** to the open sea.
5. **A real descent:** four worlds cross the sunlit zone from warm water to cold, then three go straight down to the Challenger Deep, about 10,900 m.
6. **Living ocean:** cleared reefs regain colour, kelp regrows, tides, currents and the nightly migration move the water.
7. **Field guide with a depth chart** that fills in as you go deeper.

## Decisions

| Topic | Decision |
| --- | --- |
| Platforms | Web, iOS and Android (prototypes in Phaser; Android test build via Capacitor) |
| Core play | Full swim game (v0.5). The sling launcher (v0.1–v0.4) was dropped |
| Art | Vibrant and glossy, in the spirit of Feeding Frenzy 2: real species, bold outlines, big glossy eyes, lush layered reefs |
| Primary platform | Phones first |
| Phone controls | Left thumb: floating stick. Right thumb: ability button. Switch button for the team. Vibration |
| Campaign | 7 worlds × 6 levels = 42 levels, about 3 minutes per level |
| Team | One new lead rescuer per level, plus the leads of the two previous levels when they can live in this one |
| Pressure | Worlds 1–4: tide timer (rescues win time back). Worlds 5–7: air, light meter or dive budget instead, by lead rescuer. Splash difficulty has no limit |
| Launch size | Worlds 1–5 (30 levels). Worlds 6 and 7 as free updates |
| Threats | Pollution, lost fishing gear, invasive species; no villain gang |
| Monetization | Free plus extras: cosmetics, optional rewarded ads, lives |
| Lives | 5; failing costs one; one refills every 20 min; replays of cleared levels are free |
| Difficulty | Splash, Current, Riptide, Abyss, chosen per level |
| Modes at launch | Campaign, Puzzle, Arcade |
| Background animals | Bottlenose dolphins, clownfish and electric rays appear in backgrounds, not as rescuers |
| Launch gadgets | Current Compass, Sonar Scope, Extra Kelp, Bubble Shield, Anchor Weight, Echo Shell, Glow Lure, Net Cutter, Pearl Magnet (v0.5 builds four: Bubble Shield, Extra Kelp, Glow Lure, Net Cutter) |

### Why 30 levels at launch

Well-reviewed mobile puzzle games launched with: Cut the Rope (2010) 100 levels, Metacritic 93; Where's My Water? (2011) 80 levels in 4 worlds, 90; Monument Valley (2014) 10 long levels, 89; Angry Birds (2009) 63 levels, 80. Short physics puzzles shipped 63–100 one-shot levels; Tide Tossers levels are multi-rescue swims with a target of about 3 minutes each, so 30 gives a launch of similar size. Angry Birds and Cut the Rope both added free levels within months, which is the model for Worlds 6 and 7. Sources are linked in the Claude doc.

## Core loop

The tide tosses you in → swim to the trapped animals (edge arrows point the way) → pick the right rescuer and use its ability to break the net, line or trap → the freed animals join your school, your abilities recharge and you win back time → when everyone is free, swim into the open-sea current, or clean up the remaining junk first for more stars. Reef health decides stars.

## Worlds

| # | Place | Depth | Teaches | Big rescue (finale) | Background |
| --- | --- | --- | --- | --- | --- |
| 1 | Florida Keys | 0–20 m | Swimming, abilities, switching, lionfish | Smalltooth sawfish in a gillnet | Bottlenose dolphins |
| 2 | Great Barrier Reef and Coral Sea | 0–300 m | Gentle animals, reef recovery, currents, night | Turtles in a ghost net sinking down Osprey Reef wall | Clownfish, numbfish (electric ray) |
| 3 | Galápagos Islands | 0–300 m | Air, the first dark cave | Whale shark trailing a lost net at Darwin's Arch | Sardine bait balls |
| 4 | Monterey Bay kelp coast | 0–300 m | Kelp regrowth, wall-crawling, drifting hulls and buoys, vertical levels | Humpback whale in crab-pot lines | Bottlenose dolphins, Pacific torpedo ray |
| 5 | Monterey Canyon twilight zone | 200–1,000 m | Light meter, daily migration, marine snow | Cuvier's beaked whale in a drift gillnet | Lanternfish, siphonophores |
| 6 | Midnight zone, whale fall, vents | 1,000–3,000 m | Heat, dive budget, escorting | Buried tube-worm garden brought back | Bioluminescent jellies |
| 7 | Abyss and Mariana Trench | 4,000–10,900 m | Silt, fragile ground, pressure | The deepest plastic ever recorded and a trench ghost net | Xenophyophores, sea cucumbers |

## Levels

Lead rescuer in bold; *(built)* = exists in v0.5 under its old number.

| World 1 · Florida Keys | World 2 · Great Barrier Reef |
| --- | --- |
| 1-1 Tide Pool Tangle · **blue tang** *(built)* | 2-1 Mangrove Edge · **archerfish** |
| 1-2 Mangrove Maze · **flying fish** *(built)* | 2-2 Lagoon Bommies · **parrotfish** |
| 1-3 Bottle Graveyard · **pistol shrimp** *(built)* | 2-3 Cleaning Station · **cleaner wrasse** |
| 1-4 Spines · **pufferfish** *(built)* | 2-4 Starfish Outbreak · **giant triton** |
| 1-5 Stone-Crab Traps · **loggerhead** *(built)* | 2-5 Spawning Night · **peacock mantis shrimp** |
| 1-6 Seagrass Channel · **Florida manatee** | 2-6 Osprey Reef Wall · **chambered nautilus** |

| World 3 · Galápagos | World 4 · Monterey Bay kelp |
| --- | --- |
| 3-1 Rising Tide · **Galápagos sea lion** *(built as 2-1; renumbered, stars reset)* | 4-1 Kelp Canopy · **sea otter** |
| 3-2 Lava Shore · **marine iguana** | 4-2 Elkhorn Slough · **leopard shark** |
| 3-3 Penguin Rocks · **Galápagos penguin** | 4-3 Harbor Breakwater · **giant Pacific octopus** |
| 3-4 Longline · **swordfish** *(built as 2-5)* | 4-4 Urchin Barren · **sunflower sea star** |
| 3-5 Lava Tube · **Galápagos bullhead shark** *(built as 2-9)* | 4-5 Sand Channel · **bat ray** |
| 3-6 Darwin's Arch · **scalloped hammerhead** | 4-6 Canyon Head · **northern elephant seal** |

| World 5 · Twilight zone | World 6 · Midnight zone | World 7 · Abyss and trench |
| --- | --- | --- |
| 5-1 Dusk at the Rim · **Risso's dolphin** | 6-1 The Long Dive · **Cuvier's beaked whale** | 7-1 Abyssal Plain · **tripod fish** |
| 5-2 Scattering Layer · **lanternfish school** | 6-2 Lure of the Dark · **humpback anglerfish** | 7-2 Sea-Pig Herd · **sea pig** |
| 5-3 The Night Rise · **Humboldt squid** | 6-3 Gulper Drift · **pelican gulper eel** | 7-3 Nodule Field · **dumbo octopus** |
| 5-4 Mirror Halls · **silver hatchetfish** | 6-4 Whale Fall · **black hagfish** | 7-4 Trench Wall · **Mariana snailfish** |
| 5-5 Barreleye Window · **barreleye** | 6-5 Black Smokers · **vent crab** | 7-5 The Deep Shelf · **hadal prawn** |
| 5-6 Oxygen Minimum Zone · **vampire squid** | 6-6 Tube-Worm Garden · **vent eelpout** | 7-6 Challenger Deep · **hadal amphipod swarm** |

Abilities, real behaviours and handling for all 42 rescuers are in the Claude doc's roster.

## Systems by world

| System | From world | Summary |
| --- | --- | --- |
| Tide timer | 1 | Level clock in Worlds 1–4; rescues win time back |
| Gentle animals | 2 | Big animals block the way until calmed or helped; ramming does nothing |
| Restoration | 2 | Cleared areas grow coral, kelp or vent life back on screen; that growth raises reef health |
| Currents | 2 | Streams push you, junk and freed animals |
| Air | 1 | Air-breathers carry a breath ring that refills at the surface. World 1's loggerhead and manatee introduce it with a long breath; World 3's sea lions and penguins have shorter ones |
| Drifting hulls and buoys | 4 | Hulls drift and can be pushed; buoy lines snag animals |
| Vertical levels | 4 | Levels scroll down as well as across; a depth gauge |
| Light meter | 5 | Replaces the tide timer for non-mammals: glow fades, refills at plankton and with each rescue |
| Daily migration, marine snow | 5 | A layer of life rises and sinks during the level; falling flakes show currents |
| Heat | 6 | Vent plumes are no-go zones that lift drifting objects |
| Dive budget | 6 | Replaces the tide timer for whales: one breath for the whole level |
| Silt, delicacy | 7 | Fast swimming raises blinding silt; bumping fragile life costs reef health |
| Pressure | 7 | Only hadal natives go below about 6,000 m, so the team shrinks |

## Water rules

Rescuers swim freely underwater and follow real arcs when they leap out; speed is capped when leaving the water. Junk floats, hovers or sinks by material. Plastic floats; metal and concrete sink. Currents push, vents lift. On tide levels the waterline rises and falls continuously.

## Threats

Ghost nets, fishing line and longlines, abandoned crab and lobster traps, drift gillnets, plastic (floats), glass bottles, oil drums and tin (sink), concrete debris, derelict boat hulls and buoys (drift), lost equipment in the deep. Invasive lionfish (spines sting) and European green crabs, crown-of-thorns starfish and overgrazing purple urchins are driven off or moved, never hurt. **Living coral is protected:** breaking it lowers reef health.

## Living ocean

Freed animals follow you and swim off on a win; background schools shy away; the scene starts dull and regains colour as reef health rises; heavy objects raise silt; dark levels make plankton glow around anything moving.

## Scoring

Reef health meter (starts low). Up: freeing animals, removing junk, driving off invasives, restoring habitat. Down: breaking living coral, crushing seagrass, bumping fragile deep-sea life. Stars: 1 = all animals freed, 2 = 70%+, 3 = 90%+. Chains multiply points. Pearls buy cosmetics.

## Difficulty

| Setting | Time, air or light budget | Junk/net strength | Ability cooldown | Score × |
| --- | --- | --- | --- | --- |
| Splash | No limit | 75% | 80% | 1.0 |
| Current | Standard | 100% | 100% | 1.25 |
| Riptide | 80% | 125% | 115% | 1.5 |
| Abyss | 65% | 150% | 130% | 2.0 |

## Business model

Free to play: 5 lives, a fair once-per-level helper (earned or bought, like Angry Birds' Mighty Eagle), cosmetics, rewarded ads and a one-time remove-ads purchase. Most players should be able to finish the campaign without paying. Free seasonal events and new worlds keep players coming back; a marine-conservation partner, plush toys and books, and a premium edition on subscription platforms (as Cut the Rope did on Apple Arcade and Netflix) come later. The comparison of how Angry Birds, Cut the Rope, Where's My Water?, Monument Valley and Candy Crush Saga made money, with sources, is in the Claude doc.

## Long-term roadmap

| Phase | Content | Total levels |
| --- | --- | --- |
| Launch | Worlds 1–5, Puzzle and Arcade modes | 30 |
| Year 1 | World 6 (midnight zone), World 7 (abyss and trench) | 42 |
| Year 2 | Worlds 8–11: Hawaiian Islands, Arctic under the ice, Southern Ocean and Antarctica, Coral Triangle | 66 |
| Year 3 | Worlds 12–15: Mediterranean, Sargasso Sea, Gulf of California, Salish Sea | about 90 |

Alongside: free seasonal events, about 4 a year of 3–5 levels each. Pace assumes one new world about every three months (estimate). Scientists recognise 232 marine ecoregions in 12 realms, so places are not the limit; drawing six new animals and a backdrop per world is.

## Field guide

Every rescuer, rescued species and place unlocks a card with general, widely known facts, each listed in `docs/FACTS_TO_VERIFY.md` for a person to check. A depth chart places each species at its real depth and fills in as the player goes deeper.

## Art and audio

Real species drawn bright and glossy with bold outlines and expressive eyes (no cartoon mouths); personality from behaviour and swim animation. Layered parallax backdrops of the real places with sun rays, caustic light on the floor and murk that deepens with depth; deep worlds lit only by bioluminescence. Audio: real ambience per place (waves and gulls, sea lions, snapping-shrimp crackle, whale song, deep-sea hum).

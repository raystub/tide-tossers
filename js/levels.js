// Tide Tossers v0.5 — level data for the swim game.
// Coordinates are centres (x, y) with width/height in px. The world is 720 tall; FLOOR_Y = 680 is the sea floor.
//   start:      where the tide tosses your first rescuer in (above the surface).
//   team:       rescuers you can switch between.
//   time:       seconds of tide on Current difficulty (other difficulties scale it; Splash has no limit).
//   exit:       where the open-sea current appears once every animal is free.
//   statics:    unbreakable scenery (look: rock | root | lava).
//   objects:    breakable junk (k = material id).
//   containers: net | line | trap, each holding trapped animals. hang: true draws a rope up to a surface buoy.
//   coral:      protected living coral.   invasives: lionfish patrolling around (x, y).
//   currents:   zones that push everything inside: fx, fy in px per (1/60 s)^2.
//   tide:       { min, max } waterline range; the water rises and falls continuously.
//   decor:      [{ x, y, w, h, look }] rock shapes drawn behind the action (no collision)
//   seagrass:   [{ x, w }] living seagrass meadows on the floor. Junk crashing into them, or a charge through them, costs reef health.
//   containers may have stages: n (a big rescue: the net must be torn n times) and holds big animals.
window.TT = window.TT || {};

// The campaign: five worlds of six levels, going deeper. `plan` names every slot, so unbuilt levels show as "coming soon".
TT.WORLDS = [
  { n: 1, name: 'Florida Keys', depth: '0–20 m', card: 'place_keys', background: 'keys',
    plan: ['Tide Pool Tangle', 'Mangrove Maze', 'Bottle Graveyard', 'Spines', 'Stone-Crab Traps', 'Seagrass Channel'] },
  { n: 2, name: 'Great Barrier Reef', depth: '0–300 m', card: 'place_gbr', background: 'keys',
    plan: ['Mangrove Edge', 'Lagoon Bommies', 'Cleaning Station', 'Starfish Outbreak', 'Spawning Night', 'Osprey Reef Wall'] },
  { n: 3, name: 'Galápagos Islands', depth: '0–300 m', card: 'place_galapagos', background: 'galapagos',
    plan: ['Rising Tide', 'Lava Shore', 'Penguin Rocks', 'Longline', 'Lava Tube', 'Darwin\'s Pillars'] },
  { n: 4, name: 'Monterey Bay Kelp', depth: '0–300 m', card: 'place_monterey', background: 'kelp',
    plan: ['Kelp Canopy', 'Elkhorn Slough', 'Harbor Breakwater', 'Urchin Barren', 'Sand Channel', 'Canyon Head'] },
  { n: 5, name: 'Twilight Zone', depth: '200–1,000 m', card: 'place_twilight', background: 'cave',
    plan: ['Dusk at the Rim', 'Scattering Layer', 'The Night Rise', 'Mirror Halls', 'Barreleye Window', 'Oxygen Minimum Zone'] }
];
TT.worldByN = function (n) { for (var i = 0; i < TT.WORLDS.length; i++) if (TT.WORLDS[i].n === n) return TT.WORLDS[i]; return TT.WORLDS[0]; };

(function () {
  TT.LEVELS = [
    {
      id: '1-1', name: 'Tide Pool Tangle', world: 1, place: 'Florida Keys', background: 'keys',
      width: 2800, waterline: 190, start: { x: 170, y: 40 }, team: ['tang'], time: 80, exit: { x: 2680, y: 420 },
      statics: [
        { x: 920, y: 615, w: 240, h: 130, look: 'rock' },
        { x: 1620, y: 640, w: 160, h: 80, look: 'rock' },
        { x: 2250, y: 590, w: 170, h: 180, look: 'rock' }
      ],
      objects: [
        { k: 'plastic', x: 560, y: 195, w: 60, h: 40 },
        { k: 'plastic', x: 640, y: 195, w: 50, h: 34 },
        { k: 'glass', x: 1440, y: 560, w: 18, h: 60 },
        { k: 'plastic', x: 1840, y: 195, w: 56, h: 38 },
        { k: 'glass', x: 2420, y: 500, w: 18, h: 60 },
        { k: 'plastic', x: 2560, y: 195, w: 60, h: 40 }
      ],
      containers: [
        { k: 'net', x: 1250, y: 605, w: 84, h: 150, holds: [{ k: 'hatchling', n: 2 }] },
        { k: 'net', x: 1930, y: 400, w: 74, h: 130, hang: true, holds: [{ k: 'seahorse', n: 1 }] },
        { k: 'net', x: 2480, y: 610, w: 90, h: 140, holds: [{ k: 'fishschool', n: 1 }] }
      ],
      coral: [{ x: 1100, y: 640, w: 130, h: 80 }, { x: 1780, y: 640, w: 130, h: 80 }],
      invasives: [], startHealth: 30,
      hint: 'Swim to the ghost nets and dash into them to free the animals inside.'
    },
    {
      id: '1-2', name: 'Mangrove Maze', world: 1, place: 'Florida Keys', background: 'keys',
      width: 3200, waterline: 200, start: { x: 170, y: 50 }, team: ['sheepshead', 'tang'], time: 110, exit: { x: 3080, y: 430 },
      statics: [
        { x: 700, y: 290, w: 46, h: 460, look: 'root' },
        { x: 980, y: 310, w: 46, h: 500, look: 'root' },
        { x: 840, y: 650, w: 200, h: 60, look: 'rock' },
        { x: 1900, y: 520, w: 130, h: 340, look: 'rock' },    // oyster bar: swim over it
        { x: 2150, y: 300, w: 46, h: 480, look: 'root' }
      ],
      objects: [
        { k: 'plastic', x: 840, y: 205, w: 60, h: 40 },
        { k: 'glass', x: 1180, y: 520, w: 18, h: 60 },
        { k: 'tin', x: 1480, y: 640, w: 44, h: 80 },
        { k: 'plastic', x: 2300, y: 205, w: 60, h: 40 },
        { k: 'wood', x: 2500, y: 205, w: 120, h: 24 },
        { k: 'tin', x: 2760, y: 640, w: 44, h: 80 }
      ],
      containers: [
        { k: 'net', x: 1330, y: 610, w: 80, h: 140, holds: [{ k: 'reddrum', n: 1 }] },
        { k: 'net', x: 1600, y: 380, w: 74, h: 130, hang: true, holds: [{ k: 'seahorse', n: 1 }] },
        { k: 'trap', x: 2350, y: 645, w: 100, h: 70, holds: [{ k: 'fishschool', n: 1 }] },
        { k: 'net', x: 2880, y: 390, w: 74, h: 130, hang: true, holds: [{ k: 'reddrum', n: 1 }] }
      ],
      coral: [{ x: 1150, y: 640, w: 130, h: 80 }, { x: 2620, y: 640, w: 130, h: 80 }],
      invasives: [], startHealth: 30,
      hint: 'Sheepshead have strong teeth that look surprisingly human: CRUNCH cracks traps, cans and nets up close. Switch to the tang for speed.'
    },
    {
      id: '1-3', name: 'Bottle Graveyard', world: 1, place: 'Florida Keys', background: 'keys',
      width: 3000, waterline: 190, start: { x: 170, y: 40 }, team: ['pistolshrimp', 'tang'], time: 100, exit: { x: 2880, y: 420 },
      statics: [{ x: 700, y: 630, w: 200, h: 100, look: 'rock' }, { x: 1560, y: 610, w: 180, h: 140, look: 'rock' }],
      objects: [
        { k: 'glass', x: 1040, y: 650, w: 18, h: 60 }, { k: 'glass', x: 1066, y: 650, w: 18, h: 60 },
        { k: 'glass', x: 1214, y: 650, w: 18, h: 60 }, { k: 'glass', x: 1240, y: 650, w: 18, h: 60 },
        { k: 'plastic', x: 1140, y: 578, w: 150, h: 34 },
        { k: 'glass', x: 1100, y: 540, w: 18, h: 44 }, { k: 'glass', x: 1180, y: 540, w: 18, h: 44 },
        { k: 'tin', x: 1900, y: 640, w: 44, h: 80 }, { k: 'tin', x: 2080, y: 640, w: 44, h: 80 },
        { k: 'glass', x: 1960, y: 500, w: 18, h: 60 }, { k: 'glass', x: 2020, y: 500, w: 18, h: 60 },
        { k: 'plastic', x: 1700, y: 195, w: 56, h: 38 },
        { k: 'plastic', x: 2600, y: 585, w: 110, h: 44 }, { k: 'plastic', x: 2600, y: 545, w: 80, h: 36 },
        { k: 'glass', x: 2520, y: 650, w: 18, h: 60 }, { k: 'glass', x: 2680, y: 650, w: 18, h: 60 }
      ],
      containers: [
        { k: 'net', x: 1140, y: 638, w: 96, h: 84, holds: [{ k: 'seahorse', n: 1 }] },
        { k: 'net', x: 1990, y: 605, w: 84, h: 150, holds: [{ k: 'hatchling', n: 2 }] },
        { k: 'trap', x: 2600, y: 645, w: 100, h: 70, holds: [{ k: 'fishschool', n: 1 }] }
      ],
      coral: [{ x: 1350, y: 640, w: 130, h: 80 }, { x: 2250, y: 640, w: 130, h: 80 }],
      invasives: [], startHealth: 30,
      hint: 'The pistol shrimp\'s snap shatters glass and plastic all around it.'
    },
    {
      id: '1-4', name: 'Spines', world: 1, place: 'Florida Keys', background: 'keys',
      width: 3000, waterline: 190, start: { x: 170, y: 40 }, team: ['puffer', 'tang'], time: 110, exit: { x: 2880, y: 420 },
      statics: [{ x: 820, y: 600, w: 180, h: 160, look: 'rock' }, { x: 1700, y: 260, w: 46, h: 420, look: 'root' }],
      objects: [
        { k: 'plastic', x: 1420, y: 660, w: 40, h: 40 }, { k: 'plastic', x: 600, y: 195, w: 56, h: 38 },
        { k: 'glass', x: 2140, y: 560, w: 18, h: 60 }, { k: 'tin', x: 1480, y: 640, w: 44, h: 80 }
      ],
      containers: [
        { k: 'trap', x: 1280, y: 645, w: 100, h: 70, holds: [{ k: 'fishschool', n: 1 }] },
        { k: 'net', x: 2020, y: 605, w: 84, h: 150, holds: [{ k: 'hatchling', n: 2 }] },
        { k: 'net', x: 2620, y: 380, w: 74, h: 130, hang: true, holds: [{ k: 'seahorse', n: 1 }] }
      ],
      coral: [{ x: 1060, y: 640, w: 130, h: 80 }, { x: 1620, y: 640, w: 130, h: 80 }, { x: 2250, y: 640, w: 130, h: 80 }],
      invasives: [{ k: 'lionfish', x: 1280, y: 540, patrol: 110 }, { k: 'lionfish', x: 1960, y: 450, patrol: 90 }, { k: 'lionfish', x: 2600, y: 520, patrol: 120 }],
      startHealth: 25,
      hint: 'Lionfish spines sting. The pufferfish is immune, and its puff drives them away.'
    },
    {
      id: '1-5', name: 'Stone-Crab Traps', world: 1, place: 'Florida Keys', background: 'keys',
      width: 3300, waterline: 190, start: { x: 170, y: 40 }, team: ['loggerhead', 'puffer', 'pistolshrimp'], time: 130, exit: { x: 3180, y: 420 },
      statics: [{ x: 760, y: 620, w: 220, h: 120, look: 'rock' }, { x: 2330, y: 600, w: 200, h: 160, look: 'rock' }],
      currents: [{ x: 1650, y: 440, w: 520, h: 480, fx: -0.3, fy: 0 }],
      objects: [
        { k: 'concrete', x: 1120, y: 590, w: 70, h: 40 },
        { k: 'tin', x: 1300, y: 640, w: 44, h: 80 },
        { k: 'concrete', x: 2020, y: 590, w: 70, h: 40 },
        { k: 'concrete', x: 2600, y: 590, w: 70, h: 40 },
        { k: 'plastic', x: 1500, y: 195, w: 56, h: 38 }, { k: 'plastic', x: 2480, y: 195, w: 50, h: 34 }
      ],
      containers: [
        { k: 'trap', x: 1120, y: 645, w: 100, h: 70, holds: [{ k: 'seahorse', n: 1 }] },
        { k: 'trap', x: 2020, y: 645, w: 100, h: 70, holds: [{ k: 'hatchling', n: 2 }] },
        { k: 'trap', x: 2600, y: 645, w: 100, h: 70, holds: [{ k: 'fishschool', n: 1 }] },
        { k: 'net', x: 1650, y: 380, w: 74, h: 130, hang: true, holds: [{ k: 'seahorse', n: 1 }] },
        { k: 'net', x: 2960, y: 605, w: 84, h: 150, holds: [{ k: 'hatchling', n: 2 }] }
      ],
      coral: [{ x: 1450, y: 640, w: 130, h: 80 }, { x: 2180, y: 640, w: 130, h: 80 }],
      invasives: [], startHealth: 30,
      hint: 'Concrete weighs the traps down: shove it off with the turtle, then shove the traps open. Turtles breathe air, so surface when the ring runs low.'
    },
    {
      id: '1-6', name: 'Seagrass Channel', world: 1, place: 'Florida Keys', background: 'keys',
      width: 3700, waterline: 200, start: { x: 170, y: 50 }, team: ['manatee', 'loggerhead', 'puffer'], time: 160, exit: { x: 3580, y: 430 },
      statics: [
        { x: 960, y: 570, w: 200, h: 220, look: 'rock' },      // ledge with a concrete block on top
        { x: 2240, y: 610, w: 170, h: 140, look: 'rock' }
      ],
      seagrass: [{ x: 600, w: 380 }, { x: 1330, w: 420 }, { x: 1900, w: 300 }, { x: 2720, w: 380 }],
      currents: [{ x: 2100, y: 440, w: 700, h: 480, fx: -0.22, fy: 0 }],
      objects: [
        { k: 'plastic', x: 700, y: 205, w: 56, h: 38 }, { k: 'plastic', x: 1650, y: 205, w: 60, h: 40 },
        { k: 'concrete', x: 930, y: 440, w: 70, h: 40 },
        { k: 'tin', x: 1690, y: 640, w: 44, h: 80 },
        { k: 'glass', x: 2190, y: 520, w: 18, h: 60 },
        { k: 'tin', x: 2560, y: 640, w: 44, h: 80 }, { k: 'plastic', x: 2980, y: 205, w: 56, h: 38 }
      ],
      containers: [
        { k: 'net', x: 1590, y: 605, w: 84, h: 150, holds: [{ k: 'hatchling', n: 2 }] },
        { k: 'net', x: 1880, y: 360, w: 74, h: 130, hang: true, holds: [{ k: 'seahorse', n: 1 }] },
        { k: 'trap', x: 2440, y: 645, w: 100, h: 70, holds: [{ k: 'fishschool', n: 1 }] },
        { k: 'net', x: 3220, y: 560, w: 250, h: 150, stages: 3, hang: true, holds: [{ k: 'sawfish', n: 1 }] }
      ],
      coral: [{ x: 2080, y: 640, w: 120, h: 76 }],
      invasives: [{ k: 'lionfish', x: 2440, y: 520, patrol: 100 }],
      startHealth: 30,
      hint: 'Seagrass is precious: don\'t knock junk onto it. The manatee\'s push is slow but unstoppable. Air-breathers must come up for air.'
    },
    {
      id: '2-1', name: 'Mangrove Edge', world: 2, place: 'Great Barrier Reef', background: 'keys',
      width: 3300, waterline: 220, start: { x: 170, y: 60 }, team: ['archerfish', 'loggerhead'], time: 140, exit: { x: 3180, y: 450 },
      statics: [
        { x: 650, y: 320, w: 46, h: 440, look: 'root' }, { x: 1150, y: 330, w: 46, h: 460, look: 'root' },
        { x: 1700, y: 320, w: 46, h: 440, look: 'root' }, { x: 2300, y: 330, w: 46, h: 460, look: 'root' },
        { x: 2750, y: 640, w: 200, h: 80, look: 'rock' }
      ],
      objects: [
        { k: 'plastic', x: 760, y: 150, w: 54, h: 36, pinned: true }, { k: 'glass', x: 1260, y: 140, w: 18, h: 56, pinned: true },
        { k: 'plastic', x: 1820, y: 160, w: 56, h: 38, pinned: true }, { k: 'plastic', x: 2420, y: 150, w: 54, h: 36, pinned: true },
        { k: 'tin', x: 1450, y: 640, w: 44, h: 80 }, { k: 'plastic', x: 2050, y: 225, w: 60, h: 40 }
      ],
      containers: [
        { k: 'net', x: 900, y: 600, w: 84, h: 150, holds: [{ k: 'fishschool', n: 1 }] },
        { k: 'net', x: 1450, y: 400, w: 74, h: 120, holds: [{ k: 'hatchling', n: 2 }] },
        { k: 'trap', x: 2000, y: 645, w: 100, h: 70, holds: [{ k: 'clownfish', n: 2 }] },
        { k: 'net', x: 2550, y: 420, w: 74, h: 120, holds: [{ k: 'seahorse', n: 1 }] },
        { k: 'trap', x: 2950, y: 645, w: 100, h: 70, holds: [{ k: 'fishschool', n: 1 }] }
      ],
      coral: [{ x: 1250, y: 640, w: 120, h: 76 }, { x: 2600, y: 640, w: 120, h: 76 }], invasives: [], startHealth: 30,
      hint: 'Plastic is snagged in the mangroves above the water. The archerfish JETS water to knock it down: aim up and tap. The loggerhead shoves traps open.'
    },
    {
      id: '2-2', name: 'Lagoon Bommies', world: 2, place: 'Great Barrier Reef', background: 'keys', bleached: true,
      width: 3400, waterline: 190, start: { x: 170, y: 50 }, team: ['parrotfish', 'archerfish', 'loggerhead'], time: 150, exit: { x: 3280, y: 440 },
      statics: [{ x: 900, y: 590, w: 200, h: 180, look: 'rock' }, { x: 1800, y: 580, w: 220, h: 200, look: 'rock' }, { x: 2700, y: 590, w: 200, h: 180, look: 'rock' }],
      objects: [
        { k: 'rubble', x: 880, y: 470, w: 90, h: 50 }, { k: 'rubble', x: 1780, y: 450, w: 100, h: 54 }, { k: 'rubble', x: 1860, y: 450, w: 70, h: 44 },
        { k: 'rubble', x: 2700, y: 470, w: 90, h: 50 }, { k: 'rubble', x: 1300, y: 650, w: 80, h: 50 }, { k: 'rubble', x: 2300, y: 650, w: 80, h: 50 },
        { k: 'plastic', x: 1500, y: 195, w: 56, h: 38 }
      ],
      containers: [
        { k: 'net', x: 1150, y: 600, w: 84, h: 150, holds: [{ k: 'clownfish', n: 2 }] },
        { k: 'net', x: 1450, y: 360, w: 74, h: 130, hang: true, holds: [{ k: 'fishschool', n: 1 }] },
        { k: 'trap', x: 2100, y: 645, w: 100, h: 70, holds: [{ k: 'hatchling', n: 2 }] },
        { k: 'net', x: 3000, y: 600, w: 84, h: 150, holds: [{ k: 'clownfish', n: 2 }] }
      ],
      coral: [{ x: 700, y: 640, w: 130, h: 80 }, { x: 1050, y: 640, w: 110, h: 76 }, { x: 1600, y: 640, w: 130, h: 80 }, { x: 2500, y: 640, w: 130, h: 80 }, { x: 2900, y: 640, w: 110, h: 76 }],
      invasives: [], startHealth: 25,
      hint: 'This lagoon is bleached and smothered in rubble and algae. The parrotfish GRINDS it away, and the coral gets its colour back as the reef recovers.'
    },
    {
      id: '2-3', name: 'Cleaning Station', world: 2, place: 'Great Barrier Reef', background: 'keys',
      width: 3500, waterline: 190, start: { x: 170, y: 50 }, team: ['wrasse', 'parrotfish', 'archerfish'], time: 150, exit: { x: 3380, y: 440 },
      statics: [
        { x: 1300, y: 300, w: 160, h: 280, look: 'rock' }, { x: 1300, y: 630, w: 160, h: 120, look: 'rock' },
        { x: 2400, y: 290, w: 160, h: 280, look: 'rock' }, { x: 2400, y: 630, w: 160, h: 120, look: 'rock' }
      ],
      // big manta rays waiting at the cleaning stations fill the gaps until they've been cleaned
      gentle: [{ k: 'manta', x: 1300, y: 505, len: 240 }, { k: 'manta', x: 2400, y: 500, len: 240, flip: true }],
      currents: [{ x: 1850, y: 440, w: 700, h: 480, fx: 0.25, fy: 0 }],
      objects: [
        { k: 'rubble', x: 800, y: 650, w: 80, h: 50 }, { k: 'plastic', x: 900, y: 195, w: 56, h: 38 },
        { k: 'tin', x: 1900, y: 640, w: 44, h: 80 }, { k: 'plastic', x: 2900, y: 195, w: 56, h: 38 }
      ],
      containers: [
        { k: 'net', x: 900, y: 600, w: 84, h: 150, holds: [{ k: 'clownfish', n: 2 }] },
        { k: 'line', x: 1800, y: 430, w: 6, h: 460, gentle: true, holds: [{ k: 'manta', n: 1 }] },
        { k: 'net', x: 2900, y: 600, w: 84, h: 150, holds: [{ k: 'fishschool', n: 1 }] },
        { k: 'net', x: 3150, y: 380, w: 74, h: 130, hang: true, holds: [{ k: 'hatchling', n: 1 }] }
      ],
      coral: [{ x: 650, y: 640, w: 120, h: 76 }, { x: 2650, y: 640, w: 120, h: 76 }], invasives: [], startHealth: 30,
      hint: 'Mantas visit cleaning stations. They are too big to push, so the cleaner wrasse CLEANS them and they glide aside. Only the wrasse can free the tangled manta.'
    },
    {
      id: '2-4', name: 'Starfish Outbreak', world: 2, place: 'Great Barrier Reef', background: 'keys',
      width: 3500, waterline: 190, start: { x: 170, y: 50 }, team: ['triton', 'wrasse', 'parrotfish'], time: 160, exit: { x: 3380, y: 440 },
      statics: [{ x: 1700, y: 600, w: 200, h: 160, look: 'rock' }],
      objects: [{ k: 'rubble', x: 1150, y: 650, w: 80, h: 50 }, { k: 'plastic', x: 1400, y: 195, w: 56, h: 38 }, { k: 'rubble', x: 2400, y: 650, w: 80, h: 50 }, { k: 'glass', x: 2900, y: 650, w: 18, h: 60 }],
      containers: [
        { k: 'net', x: 1000, y: 380, w: 74, h: 130, hang: true, holds: [{ k: 'clownfish', n: 2 }] },
        { k: 'net', x: 1950, y: 600, w: 84, h: 150, holds: [{ k: 'fishschool', n: 1 }] },
        { k: 'net', x: 2650, y: 380, w: 74, h: 130, hang: true, holds: [{ k: 'hatchling', n: 2 }] },
        { k: 'net', x: 3150, y: 600, w: 84, h: 150, holds: [{ k: 'clownfish', n: 1 }] }
      ],
      coral: [{ x: 700, y: 640, w: 130, h: 80 }, { x: 1300, y: 640, w: 130, h: 80 }, { x: 2200, y: 640, w: 130, h: 80 }, { x: 2800, y: 640, w: 130, h: 80 }],
      invasives: [{ k: 'cots', x: 700, y: 590 }, { k: 'cots', x: 1300, y: 590 }, { k: 'cots', x: 1340, y: 600 }, { k: 'cots', x: 2200, y: 590 }, { k: 'cots', x: 2800, y: 590 }, { k: 'cots', x: 2770, y: 600 }],
      startHealth: 35,
      hint: 'Crown-of-thorns starfish are eating the coral and draining reef health. They move away from the scent of their predator, the giant triton: swim close and tap. Their spines sting everything else.'
    },
    {
      id: '2-5', name: 'Spawning Night', world: 2, place: 'Great Barrier Reef', background: 'keys', dark: true,
      width: 3400, waterline: 190, start: { x: 170, y: 60 }, team: ['mantis', 'triton', 'wrasse'], time: 160, exit: { x: 3280, y: 440 },
      glowSpots: [{ x: 700, y: 600 }, { x: 1200, y: 600 }, { x: 1700, y: 450 }, { x: 2200, y: 600 }, { x: 2700, y: 600 }, { x: 3280, y: 440 }],
      statics: [{ x: 1500, y: 610, w: 180, h: 140, look: 'rock' }, { x: 2450, y: 600, w: 180, h: 160, look: 'rock' }],
      objects: [
        { k: 'concrete', x: 950, y: 590, w: 70, h: 40 }, { k: 'concrete', x: 1950, y: 590, w: 70, h: 40 }, { k: 'tin', x: 1360, y: 640, w: 44, h: 80 },
        { k: 'concrete', x: 2950, y: 590, w: 70, h: 40 }, { k: 'glass', x: 2250, y: 650, w: 18, h: 60 }
      ],
      containers: [
        { k: 'trap', x: 950, y: 645, w: 100, h: 70, holds: [{ k: 'clownfish', n: 2 }] },
        { k: 'trap', x: 1950, y: 645, w: 100, h: 70, holds: [{ k: 'fishschool', n: 1 }] },
        { k: 'net', x: 2250, y: 380, w: 74, h: 130, hang: true, holds: [{ k: 'hatchling', n: 2 }] },
        { k: 'trap', x: 2950, y: 645, w: 100, h: 70, holds: [{ k: 'clownfish', n: 1 }] }
      ],
      coral: [{ x: 700, y: 640, w: 130, h: 80 }, { x: 1200, y: 640, w: 120, h: 76 }, { x: 2700, y: 640, w: 130, h: 80 }],
      invasives: [{ k: 'cots', x: 700, y: 590 }, { k: 'cots', x: 2700, y: 590 }],
      startHealth: 30,
      hint: 'On spawning night the corals release their eggs and sperm together. The mantis shrimp PUNCHES: one strike cracks concrete and traps. Keep the starfish off the coral.'
    },
    {
      id: '2-6', name: 'Osprey Reef Wall', world: 2, place: 'Great Barrier Reef', background: 'keys',
      width: 3700, waterline: 190, start: { x: 170, y: 50 }, team: ['nautilus', 'mantis', 'triton'], time: 170, exit: { x: 3580, y: 430 },
      statics: [
        { x: 700, y: 560, w: 260, h: 240, look: 'rock' }, { x: 1500, y: 520, w: 240, h: 320, look: 'rock' },
        { x: 2300, y: 560, w: 260, h: 240, look: 'rock' }
      ],
      // strong currents sweep along the wall, and a ghost net with turtles in it is sinking toward the deep
      currents: [{ x: 1100, y: 330, w: 800, h: 260, fx: 0.32, fy: 0 }, { x: 1900, y: 330, w: 800, h: 260, fx: -0.3, fy: 0.08 }],
      objects: [{ k: 'concrete', x: 1000, y: 620, w: 40, h: 120 }, { k: 'tin', x: 1850, y: 640, w: 44, h: 80 }, { k: 'plastic', x: 2600, y: 195, w: 56, h: 38 }, { k: 'concrete', x: 2700, y: 590, w: 70, h: 40 }],
      containers: [
        { k: 'trap', x: 1100, y: 645, w: 100, h: 70, holds: [{ k: 'clownfish', n: 2 }] },
        { k: 'net', x: 1900, y: 380, w: 74, h: 130, hang: true, holds: [{ k: 'fishschool', n: 1 }] },
        { k: 'trap', x: 2700, y: 645, w: 100, h: 70, holds: [{ k: 'hatchling', n: 2 }] },
        { k: 'net', x: 3250, y: 300, w: 300, h: 160, stages: 3, sink: 7, sinkTo: 560, holds: [{ k: 'loggerhead', n: 2 }] }
      ],
      coral: [{ x: 1250, y: 640, w: 120, h: 76 }, { x: 3000, y: 640, w: 120, h: 76 }],
      invasives: [{ k: 'cots', x: 1250, y: 590 }, { k: 'cots', x: 3000, y: 590 }],
      startHealth: 30,
      hint: 'A ghost net with two turtles is sinking down the wall! Tear it three times. The nautilus BUOYS straight up or down, the mantis shrimp punches.'
    },
    {
      id: '3-1', name: 'Rising Tide', world: 3, place: 'Galápagos Islands', background: 'galapagos',
      width: 3100, waterline: 250, tide: { min: 170, max: 330 }, start: { x: 170, y: 60 }, team: ['sealion', 'swordfish'], time: 115, exit: { x: 2980, y: 460 },
      statics: [
        { x: 820, y: 560, w: 150, h: 240, look: 'lava' },
        { x: 1500, y: 150, w: 220, h: 300, look: 'lava' },      // overhang: blocks the surface route
        { x: 1500, y: 640, w: 160, h: 80, look: 'lava' },
        { x: 2180, y: 590, w: 140, h: 180, look: 'lava' }
      ],
      objects: [
        { k: 'plastic', x: 620, y: 255, w: 56, h: 38 }, { k: 'plastic', x: 1180, y: 255, w: 60, h: 40 },
        { k: 'glass', x: 1260, y: 560, w: 18, h: 60 },
        { k: 'concrete', x: 1900, y: 620, w: 40, h: 120 },
        { k: 'wood', x: 1820, y: 255, w: 120, h: 24 },
        { k: 'tin', x: 2760, y: 570, w: 44, h: 80 }, { k: 'plastic', x: 2620, y: 255, w: 56, h: 38 }
      ],
      containers: [
        { k: 'net', x: 1120, y: 330, w: 74, h: 130, hang: true, holds: [{ k: 'fishschool', n: 1 }] },
        { k: 'net', x: 1990, y: 605, w: 84, h: 150, holds: [{ k: 'hatchling', n: 2 }] },
        { k: 'net', x: 2400, y: 340, w: 74, h: 130, hang: true, holds: [{ k: 'hatchling', n: 1 }] },
        { k: 'trap', x: 2760, y: 645, w: 100, h: 70, holds: [{ k: 'seahorse', n: 1 }] }
      ],
      coral: [], invasives: [], startHealth: 30,
      hint: 'Sea lions SPIN: a twisting dash that bounces off rock. Swordfish slice nets on contact. The tide rises and falls, and sea lions need air.'
    },
    {
      id: '3-2', name: 'Lava Shore', world: 3, place: 'Galápagos Islands', background: 'galapagos',
      width: 3300, waterline: 230, start: { x: 170, y: 60 }, team: ['iguana', 'sealion'], time: 150, exit: { x: 3180, y: 460 },
      statics: [
        { x: 700, y: 330, w: 170, h: 220, look: 'lava' },
        { x: 1250, y: 600, w: 200, h: 160, look: 'lava' },
        { x: 1700, y: 360, w: 150, h: 260, look: 'lava' },
        { x: 2350, y: 590, w: 220, h: 180, look: 'lava' },
        { x: 2800, y: 340, w: 160, h: 220, look: 'lava' }
      ],
      // waves surge in and out along the shore
      currents: [{ x: 1000, y: 380, w: 900, h: 300, fx: 0.55, fy: 0, surge: true }, { x: 2500, y: 380, w: 900, h: 300, fx: 0.55, fy: 0, surge: true }],
      objects: [
        { k: 'plastic', x: 500, y: 235, w: 56, h: 38 }, { k: 'plastic', x: 1450, y: 235, w: 60, h: 40 },
        { k: 'tin', x: 1060, y: 640, w: 44, h: 80 }, { k: 'wood', x: 2050, y: 235, w: 120, h: 24 },
        { k: 'glass', x: 2600, y: 650, w: 18, h: 60 }, { k: 'plastic', x: 3000, y: 235, w: 56, h: 38 }
      ],
      containers: [
        { k: 'net', x: 860, y: 420, w: 74, h: 120, holds: [{ k: 'fishschool', n: 1 }] },
        { k: 'net', x: 1500, y: 610, w: 84, h: 140, holds: [{ k: 'hatchling', n: 2 }] },
        { k: 'net', x: 1880, y: 420, w: 74, h: 120, holds: [{ k: 'fishschool', n: 1 }] },
        { k: 'trap', x: 2620, y: 645, w: 100, h: 70, holds: [{ k: 'hatchling', n: 1 }] },
        { k: 'net', x: 2980, y: 600, w: 110, h: 150, holds: [{ k: 'sealion', n: 1 }] }
      ],
      coral: [], invasives: [], startHealth: 30,
      hint: 'Waves surge in and out. The marine iguana GRIPS: it holds still against the surge and scrapes junk and nets loose. Iguanas breathe air.'
    },
    {
      id: '3-3', name: 'Penguin Rocks', world: 3, place: 'Galápagos Islands', background: 'galapagos',
      width: 3400, waterline: 200, start: { x: 170, y: 50 }, team: ['penguin', 'iguana', 'sealion'], time: 150, exit: { x: 3280, y: 440 },
      statics: [
        { x: 600, y: 560, w: 110, h: 240, look: 'lava' }, { x: 900, y: 260, w: 110, h: 360, look: 'lava' },
        { x: 1250, y: 560, w: 110, h: 240, look: 'lava' }, { x: 1600, y: 260, w: 110, h: 360, look: 'lava' },
        { x: 1950, y: 560, w: 110, h: 240, look: 'lava' }, { x: 2300, y: 260, w: 110, h: 360, look: 'lava' },
        { x: 2650, y: 560, w: 110, h: 240, look: 'lava' }
      ],
      // the cold Cromwell Current wells up from below, which is why penguins can live here
      currents: [{ x: 1600, y: 560, w: 1600, h: 240, fx: 0, fy: -0.18 }],
      objects: [
        { k: 'plastic', x: 760, y: 205, w: 56, h: 38 }, { k: 'plastic', x: 1420, y: 205, w: 56, h: 38 }, { k: 'plastic', x: 2120, y: 205, w: 56, h: 38 },
        { k: 'glass', x: 1080, y: 650, w: 18, h: 60 }, { k: 'tin', x: 2480, y: 640, w: 44, h: 80 }
      ],
      containers: [
        { k: 'net', x: 760, y: 470, w: 70, h: 110, holds: [{ k: 'fishschool', n: 1 }] },
        { k: 'net', x: 1080, y: 470, w: 70, h: 110, holds: [{ k: 'penguin', n: 1 }] },
        { k: 'net', x: 1420, y: 470, w: 70, h: 110, holds: [{ k: 'fishschool', n: 1 }] },
        { k: 'net', x: 1780, y: 470, w: 70, h: 110, holds: [{ k: 'penguin', n: 1 }] },
        { k: 'net', x: 2120, y: 470, w: 70, h: 110, holds: [{ k: 'hatchling', n: 1 }] },
        { k: 'net', x: 2480, y: 470, w: 70, h: 110, holds: [{ k: 'penguin', n: 1 }] },
        { k: 'trap', x: 3000, y: 645, w: 100, h: 70, holds: [{ k: 'fishschool', n: 1 }] }
      ],
      coral: [], invasives: [], startHealth: 30,
      hint: 'Weave between the rocks. The penguin BURSTS: a quick dart that recharges fast. It has the shortest breath, so surface often.'
    },
    {
      id: '3-4', name: 'Longline', world: 3, place: 'Galápagos Islands', background: 'galapagos',
      width: 3600, waterline: 180, start: { x: 170, y: 40 }, team: ['swordfish', 'flyingfish', 'penguin'], time: 100, exit: { x: 3480, y: 420 },
      statics: [{ x: 520, y: 610, w: 200, h: 140, look: 'lava' }, { x: 2760, y: 600, w: 180, h: 160, look: 'lava' }],
      currents: [
        { x: 1300, y: 440, w: 700, h: 480, fx: -0.34, fy: 0 },
        { x: 2300, y: 330, w: 500, h: 260, fx: 0.3, fy: 0 }
      ],
      objects: [
        { k: 'wood', x: 3000, y: 185, w: 130, h: 26 }, { k: 'wood', x: 3140, y: 185, w: 130, h: 26 },
        { k: 'plastic', x: 1900, y: 185, w: 56, h: 38 },
        { k: 'concrete', x: 2480, y: 620, w: 60, h: 120 }
      ],
      containers: [
        { k: 'line', x: 900, y: 430, w: 6, h: 460, holds: [{ k: 'fishschool', n: 1 }] },
        { k: 'line', x: 1300, y: 430, w: 6, h: 460, holds: [{ k: 'fishschool', n: 1 }] },
        { k: 'line', x: 1700, y: 430, w: 6, h: 460, holds: [{ k: 'fishschool', n: 1 }] },
        { k: 'line', x: 2100, y: 430, w: 6, h: 460, holds: [{ k: 'fishschool', n: 1 }] },
        { k: 'net', x: 3300, y: 300, w: 80, h: 120, hang: true, holds: [{ k: 'hatchling', n: 2 }] }
      ],
      coral: [], invasives: [], startHealth: 30,
      hint: 'Cut every longline, then get past the driftwood boom: pierce it, or leap over with the flying fish.'
    },
    {
      id: '3-5', name: 'Lava Tube', world: 3, place: 'Galápagos Islands', background: 'cave',
      width: 3300, waterline: 150, dark: true, start: { x: 170, y: 220 }, team: ['bullhead', 'swordfish', 'penguin'], time: 150, exit: { x: 3180, y: 430 },
      glowSpots: [{ x: 620, y: 560 }, { x: 1150, y: 300 }, { x: 1700, y: 600 }, { x: 2250, y: 330 }, { x: 2750, y: 560 }, { x: 3180, y: 430 }],
      statics: [
        { x: 1650, y: 50, w: 3300, h: 100, look: 'lava' },      // cave roof
        { x: 800, y: 540, w: 120, h: 280, look: 'lava' },
        { x: 1250, y: 260, w: 120, h: 340, look: 'lava' },
        { x: 1750, y: 560, w: 120, h: 240, look: 'lava' },
        { x: 2200, y: 250, w: 120, h: 320, look: 'lava' }
      ],
      objects: [
        { k: 'plastic', x: 1000, y: 655, w: 50, h: 50 }, { k: 'glass', x: 1060, y: 650, w: 18, h: 60 },
        { k: 'concrete', x: 2450, y: 590, w: 70, h: 40 },
        { k: 'tin', x: 1960, y: 640, w: 44, h: 80 }
      ],
      containers: [
        { k: 'net', x: 1500, y: 605, w: 84, h: 150, holds: [{ k: 'hatchling', n: 2 }] },
        { k: 'trap', x: 2450, y: 645, w: 100, h: 70, holds: [{ k: 'seahorse', n: 1 }] },
        { k: 'net', x: 2900, y: 605, w: 84, h: 150, holds: [{ k: 'fishschool', n: 1 }] }
      ],
      coral: [], invasives: [], startHealth: 30, grantGlow: true,
      hint: 'It\'s dark in the lava tube. The bullhead shark hugs the bottom, and its CRUSH cracks traps and concrete. Glowing plankton lights anything that moves.'
    },
    {
      id: '3-6', name: 'Darwin\'s Pillars', world: 3, place: 'Galápagos Islands', background: 'galapagos',
      width: 3900, waterline: 190, start: { x: 170, y: 50 }, team: ['hammerhead', 'bullhead', 'swordfish'], time: 170, exit: { x: 3780, y: 430 },
      // Darwin's Arch fell in 2021; its two stone pillars still stand (in the background, so you swim past them)
      decor: [{ x: 1320, y: 400, w: 120, h: 560, look: 'lava' }, { x: 1600, y: 410, w: 120, h: 540, look: 'lava' }],
      statics: [
        { x: 2500, y: 610, w: 200, h: 140, look: 'lava' }
      ],
      currents: [{ x: 900, y: 440, w: 700, h: 480, fx: -0.3, fy: 0 }, { x: 2200, y: 440, w: 900, h: 480, fx: 0.25, fy: 0.05 }],
      objects: [
        { k: 'concrete', x: 900, y: 620, w: 40, h: 120 }, { k: 'tin', x: 1100, y: 640, w: 44, h: 80 },
        { k: 'plastic', x: 1800, y: 195, w: 56, h: 38 }, { k: 'wood', x: 2050, y: 195, w: 120, h: 24 },
        { k: 'concrete', x: 2900, y: 590, w: 70, h: 40 }, { k: 'plastic', x: 3500, y: 195, w: 56, h: 38 }
      ],
      containers: [
        { k: 'trap', x: 1000, y: 645, w: 100, h: 70, holds: [{ k: 'fishschool', n: 1 }] },
        { k: 'line', x: 1800, y: 430, w: 6, h: 460, holds: [{ k: 'fishschool', n: 1 }] },
        { k: 'line', x: 2100, y: 430, w: 6, h: 460, holds: [{ k: 'fishschool', n: 1 }] },
        { k: 'trap', x: 2900, y: 645, w: 100, h: 70, holds: [{ k: 'hatchling', n: 2 }] },
        { k: 'net', x: 3420, y: 470, w: 330, h: 170, stages: 3, hang: true, holds: [{ k: 'whaleshark', n: 1 }] }
      ],
      coral: [], invasives: [], startHealth: 30,
      hint: 'Darwin\'s Arch fell into the sea in 2021, leaving two pillars. A whale shark is trailing a lost net! Tear it three times to set it free. Hammerheads RAM, bullheads CRUSH concrete, swordfish slice lines.'
    },
    // ---------- World 4: Monterey Bay ----------
    {
      id: '4-1', name: 'Kelp Canopy', world: 4, place: 'Monterey Bay', background: 'kelp',
      width: 3000, waterline: 180, start: { x: 170, y: 40 }, team: ['otter'], time: 130, exit: { x: 2880, y: 420 },
      kelp: [{ x: 800, w: 260 }, { x: 1700, w: 320 }, { x: 2450, w: 220 }],
      statics: [{ x: 1250, y: 620, w: 160, h: 120, look: 'rock' }],
      objects: [
        { k: 'plastic', x: 1050, y: 185, w: 56, h: 38 }, { k: 'glass', x: 1450, y: 640, w: 18, h: 60 },
        { k: 'tin', x: 2100, y: 640, w: 44, h: 80 }, { k: 'plastic', x: 2650, y: 185, w: 56, h: 38 }
      ],
      containers: [
        { k: 'trap', x: 600, y: 645, w: 100, h: 70, holds: [{ k: 'rockfish', n: 2 }] },
        { k: 'net', x: 1250, y: 330, w: 74, h: 130, hang: true, holds: [{ k: 'otter', n: 1 }] },
        { k: 'trap', x: 2000, y: 645, w: 100, h: 70, holds: [{ k: 'rockfish', n: 2 }] },
        { k: 'net', x: 2650, y: 605, w: 84, h: 150, holds: [{ k: 'fishschool', n: 1 }] }
      ],
      coral: [], invasives: [], startHealth: 30,
      hint: 'Giant kelp grows in tall forests here. The sea otter slips through the kelp and bangs crab pots open with a ROCK. Otters breathe air, so come up when the ring runs low.'
    },
    {
      id: '4-2', name: 'Elkhorn Slough', world: 4, place: 'Monterey Bay', background: 'kelp',
      width: 3200, waterline: 240, tide: { min: 180, max: 300 }, start: { x: 170, y: 60 }, team: ['leopardshark', 'otter'], time: 140, exit: { x: 3080, y: 470 },
      objects: [
        { k: 'plastic', x: 900, y: 245, w: 56, h: 38 }, { k: 'tin', x: 1500, y: 640, w: 44, h: 80, buried: true },
        { k: 'glass', x: 2300, y: 650, w: 18, h: 60 }, { k: 'plastic', x: 2700, y: 245, w: 56, h: 38 }
      ],
      containers: [
        { k: 'trap', x: 750, y: 645, w: 100, h: 70, holds: [{ k: 'rockfish', n: 1 }] },
        { k: 'trap', x: 1350, y: 645, w: 100, h: 70, buried: true, holds: [{ k: 'rockfish', n: 2 }] },
        { k: 'net', x: 1950, y: 605, w: 84, h: 150, holds: [{ k: 'fishschool', n: 1 }] },
        { k: 'trap', x: 2550, y: 645, w: 100, h: 70, buried: true, holds: [{ k: 'otter', n: 1 }] }
      ],
      coral: [], startHealth: 30,
      invasives: [{ k: 'greencrab', x: 1100, y: 662, patrol: 60, size: 56 }, { k: 'greencrab', x: 2250, y: 662, patrol: 60, size: 56 }],
      hint: 'Leopard sharks gather in this shallow slough. Their SENSE finds traps buried in the mud. Invasive green crabs pinch: the sea otter eats crabs, so its ROCK sends them scuttling.'
    },
    {
      id: '4-3', name: 'Harbor Breakwater', world: 4, place: 'Monterey Bay', background: 'kelp',
      width: 3400, waterline: 190, start: { x: 170, y: 50 }, team: ['octopus', 'leopardshark', 'otter'], time: 150, exit: { x: 3280, y: 430 },
      statics: [
        { x: 1000, y: 600, w: 220, h: 160, look: 'rock' }, { x: 1180, y: 640, w: 140, h: 80, look: 'rock' },
        { x: 2300, y: 600, w: 240, h: 160, look: 'rock' }
      ],
      kelp: [{ x: 1700, w: 240 }],
      objects: [
        { k: 'tin', x: 700, y: 640, w: 44, h: 80 }, { k: 'plastic', x: 1400, y: 195, w: 56, h: 38 },
        { k: 'wood', x: 2000, y: 195, w: 110, h: 24 }, { k: 'glass', x: 2800, y: 650, w: 18, h: 60, buried: true }
      ],
      containers: [
        { k: 'trap', x: 1450, y: 645, w: 100, h: 70, holds: [{ k: 'rockfish', n: 2 }] },
        { k: 'net', x: 2000, y: 340, w: 74, h: 130, hang: true, holds: [{ k: 'fishschool', n: 1 }] },
        { k: 'trap', x: 2650, y: 645, w: 100, h: 70, buried: true, holds: [{ k: 'rockfish', n: 2 }] },
        { k: 'net', x: 3000, y: 605, w: 84, h: 150, holds: [{ k: 'otter', n: 1 }] }
      ],
      coral: [], startHealth: 30,
      invasives: [{ k: 'greencrab', x: 1600, y: 662, patrol: 50, size: 56 }, { k: 'greencrab', x: 2850, y: 662, patrol: 50, size: 56 }, { k: 'greencrab', x: 3150, y: 662, patrol: 40, size: 56 }],
      hint: 'Octopuses hide in the rocks of the breakwater. The octopus squirts INK to send crabs away and pries traps open with its arms.'
    },
    {
      id: '4-4', name: 'Urchin Barren', world: 4, place: 'Monterey Bay', background: 'kelp',
      width: 3400, waterline: 190, start: { x: 170, y: 50 }, team: ['sunstar', 'octopus', 'leopardshark'], time: 160, exit: { x: 3280, y: 430 },
      kelp: [{ x: 3000, w: 260 }],
      statics: [{ x: 1900, y: 620, w: 180, h: 120, look: 'rock' }],
      objects: [
        { k: 'plastic', x: 1000, y: 195, w: 56, h: 38 }, { k: 'tin', x: 1600, y: 640, w: 44, h: 80 },
        { k: 'glass', x: 2500, y: 650, w: 18, h: 60 }
      ],
      containers: [
        { k: 'trap', x: 900, y: 645, w: 100, h: 70, holds: [{ k: 'rockfish', n: 2 }] },
        { k: 'net', x: 1500, y: 340, w: 74, h: 130, hang: true, holds: [{ k: 'otter', n: 1 }] },
        { k: 'trap', x: 2250, y: 645, w: 100, h: 70, buried: true, holds: [{ k: 'rockfish', n: 1 }] },
        { k: 'net', x: 2750, y: 605, w: 84, h: 150, holds: [{ k: 'fishschool', n: 1 }] }
      ],
      coral: [], startHealth: 15,
      invasives: [
        { k: 'purpleurchin', x: 650, y: 660, patrol: 20, size: 50 }, { k: 'purpleurchin', x: 1200, y: 660, patrol: 20, size: 50 },
        { k: 'purpleurchin', x: 1700, y: 660, patrol: 20, size: 50 }, { k: 'purpleurchin', x: 2450, y: 660, patrol: 20, size: 50 },
        { k: 'greencrab', x: 2050, y: 662, patrol: 50, size: 56 }
      ],
      hint: 'Too many purple urchins have eaten this kelp forest down to bare rock. Sunflower sea stars eat urchins: its GRIP pries them off and the kelp starts to come back.'
    },
    {
      id: '4-5', name: 'Sand Channel', world: 4, place: 'Monterey Bay', background: 'kelp',
      width: 3500, waterline: 190, start: { x: 170, y: 50 }, team: ['batray', 'sunstar', 'octopus'], time: 160, exit: { x: 3380, y: 430 },
      kelp: [{ x: 600, w: 220 }, { x: 3100, w: 220 }],
      currents: [{ x: 1800, y: 560, w: 1400, h: 240, fx: 0.2, fy: 0 }],
      objects: [
        { k: 'tin', x: 1100, y: 640, w: 44, h: 80, buried: true }, { k: 'glass', x: 1600, y: 650, w: 18, h: 60, buried: true },
        { k: 'plastic', x: 2000, y: 195, w: 56, h: 38 }, { k: 'concrete', x: 2500, y: 650, w: 70, h: 40, buried: true }
      ],
      containers: [
        { k: 'trap', x: 950, y: 645, w: 100, h: 70, buried: true, holds: [{ k: 'rockfish', n: 2 }] },
        { k: 'net', x: 1450, y: 605, w: 84, h: 150, holds: [{ k: 'fishschool', n: 1 }] },
        { k: 'trap', x: 2000, y: 645, w: 100, h: 70, buried: true, holds: [{ k: 'rockfish', n: 1 }] },
        { k: 'trap', x: 2700, y: 645, w: 100, h: 70, buried: true, holds: [{ k: 'otter', n: 1 }] }
      ],
      coral: [], startHealth: 25,
      invasives: [{ k: 'purpleurchin', x: 3150, y: 660, patrol: 20, size: 50 }, { k: 'greencrab', x: 1750, y: 662, patrol: 60, size: 56 }],
      hint: 'Bat rays flap their wings to dig up clams from the sand. Its DIG uncovers buried traps and junk, and breaks them open.'
    },
    {
      id: '4-6', name: 'Canyon Head', world: 4, place: 'Monterey Bay', background: 'kelp',
      width: 3900, waterline: 190, start: { x: 170, y: 50 }, team: ['eseal', 'batray', 'octopus'], time: 180, exit: { x: 3780, y: 430 },
      kelp: [{ x: 700, w: 240 }],
      statics: [{ x: 1300, y: 610, w: 200, h: 140, look: 'rock' }],
      objects: [
        { k: 'tin', x: 1050, y: 640, w: 44, h: 80 }, { k: 'plastic', x: 1700, y: 195, w: 56, h: 38 },
        { k: 'concrete', x: 2000, y: 650, w: 70, h: 40, buried: true }, { k: 'wood', x: 3000, y: 195, w: 110, h: 24 }
      ],
      containers: [
        { k: 'trap', x: 950, y: 645, w: 100, h: 70, holds: [{ k: 'rockfish', n: 2 }] },
        { k: 'trap', x: 1800, y: 645, w: 100, h: 70, buried: true, holds: [{ k: 'otter', n: 1 }] },
        { k: 'net', x: 2300, y: 605, w: 84, h: 150, holds: [{ k: 'fishschool', n: 1 }] },
        { k: 'net', x: 3250, y: 400, w: 340, h: 160, stages: 3, hang: true, holds: [{ k: 'humpback', n: 1 }] }
      ],
      coral: [], startHealth: 30,
      invasives: [{ k: 'greencrab', x: 1550, y: 662, patrol: 50, size: 56 }, { k: 'greencrab', x: 2650, y: 662, patrol: 60, size: 56 }],
      hint: 'A humpback whale is caught in crab-pot lines! Tear the lines three times to free it. Elephant seals are deep divers: the seal\'s PLUNGE hits like a battering ram.'
    }
  ];

  TT.levelById = function (id) {
    var lists = [TT.LEVELS, TT.PUZZLES || []];
    for (var k = 0; k < lists.length; k++) for (var i = 0; i < lists[k].length; i++) if (lists[k][i].id === id) return lists[k][i];
    return null;
  };
  TT.levelsInWorld = function (n) { return TT.LEVELS.filter(function (l) { return l.world === n; }); };
})();

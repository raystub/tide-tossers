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
window.TT = window.TT || {};

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
      width: 3200, waterline: 200, start: { x: 170, y: 50 }, team: ['tang', 'flyingfish'], time: 110, exit: { x: 3080, y: 430 },
      statics: [
        { x: 700, y: 290, w: 46, h: 460, look: 'root' },
        { x: 980, y: 310, w: 46, h: 500, look: 'root' },
        { x: 840, y: 650, w: 200, h: 60, look: 'rock' },
        { x: 1900, y: 395, w: 130, h: 590, look: 'rock' }     // sandbar wall: top is 100 px above the water
      ],
      objects: [
        { k: 'plastic', x: 840, y: 205, w: 60, h: 40 },
        { k: 'glass', x: 1180, y: 520, w: 18, h: 60 },
        { k: 'plastic', x: 1500, y: 205, w: 54, h: 36 },
        { k: 'plastic', x: 2200, y: 205, w: 60, h: 40 },
        { k: 'glass', x: 2500, y: 560, w: 18, h: 60 },
        { k: 'plastic', x: 2700, y: 205, w: 60, h: 40 }, { k: 'plastic', x: 2770, y: 205, w: 50, h: 36 }
      ],
      containers: [
        { k: 'net', x: 1330, y: 610, w: 80, h: 140, holds: [{ k: 'seahorse', n: 1 }] },
        { k: 'net', x: 1600, y: 380, w: 74, h: 130, hang: true, holds: [{ k: 'fishschool', n: 1 }] },
        { k: 'net', x: 2350, y: 605, w: 84, h: 150, holds: [{ k: 'hatchling', n: 2 }] },
        { k: 'net', x: 2880, y: 390, w: 74, h: 130, hang: true, holds: [{ k: 'seahorse', n: 1 }] }
      ],
      coral: [{ x: 1150, y: 640, w: 130, h: 80 }, { x: 2620, y: 640, w: 130, h: 80 }],
      invasives: [], startHealth: 30,
      hint: 'Switch to the flying fish and leap over the sandbar to reach the lagoon.'
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
      width: 3300, waterline: 190, start: { x: 170, y: 40 }, team: ['loggerhead', 'hammerhead', 'tang'], time: 120, exit: { x: 3180, y: 420 },
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
      hint: 'Concrete weighs the traps down. The hammerhead\'s ram cracks it; the turtle shoves traps open.'
    },
    {
      id: '2-1', name: 'Rising Tide', world: 2, place: 'Galápagos Islands', background: 'galapagos',
      width: 3100, waterline: 250, tide: { min: 170, max: 330 }, start: { x: 170, y: 60 }, team: ['swordfish', 'tang'], time: 115, exit: { x: 2980, y: 460 },
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
      hint: 'The tide rises and falls. Swordfish slice nets on contact, and their pierce darts straight through junk.'
    },
    {
      id: '2-5', name: 'Longline', world: 2, place: 'Galápagos Islands', background: 'galapagos',
      width: 3600, waterline: 180, start: { x: 170, y: 40 }, team: ['swordfish', 'flyingfish'], time: 100, exit: { x: 3480, y: 420 },
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
      id: '2-9', name: 'Lava Tube', world: 2, place: 'Galápagos Islands', background: 'cave',
      width: 3300, waterline: 150, dark: true, start: { x: 170, y: 220 }, team: ['tang', 'puffer', 'pistolshrimp', 'hammerhead'], time: 150, exit: { x: 3180, y: 430 },
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
      coral: [], invasives: [{ k: 'lionfish', x: 2000, y: 420, patrol: 80 }, { k: 'lionfish', x: 2880, y: 440, patrol: 90 }], startHealth: 30, grantGlow: true,
      hint: 'It\'s dark in the lava tube. Glowing plankton lights anything that moves. Try the Glow Lure.'
    }
  ];

  TT.levelById = function (id) {
    for (var i = 0; i < TT.LEVELS.length; i++) if (TT.LEVELS[i].id === id) return TT.LEVELS[i];
    return null;
  };
})();

// Tide Tossers v0.2 — level data.
// Coordinates are centres (x, y) with width/height in px. FLOOR_Y = 680.
// statics: unbreakable scenery bodies (look: rock | root | lava).
// objects: breakable junk (k = material id). containers: net | line | trap, each holding trapped animals.
// coral: protected living coral. invasives: lionfish patrolling around (x, y).
// currents: reserved for later builds (ignored in v0.2).
window.TT = window.TT || {};

(function () {
  // Reusable sling rocks
  var lowRock = { x: 190, y: 620, w: 160, h: 120, look: 'rock' };   // top at 560
  var midRock = { x: 170, y: 560, w: 220, h: 240, look: 'rock' };   // top at 440
  var tallRock = { x: 170, y: 545, w: 220, h: 270, look: 'lava' };  // top at 410

  TT.LEVELS = [
    {
      id: '1-1', name: 'Tide Pool Tangle', world: 1, place: 'Florida Keys', background: 'keys_tidepool',
      width: 1280, waterline: 600, tide: null, dark: false, glowSpots: [], currents: [],
      sling: { x: 190, y: 500 }, statics: [lowRock],
      queue: ['tang', 'tang', 'tang'],
      objects: [
        { k: 'plastic', x: 850, y: 660, w: 60, h: 40 },
        { k: 'plastic', x: 852, y: 620, w: 54, h: 40 },
        { k: 'glass', x: 1060, y: 650, w: 18, h: 60 }
      ],
      containers: [{ k: 'net', x: 960, y: 610, w: 70, h: 140, holds: [{ k: 'hatchling', n: 2 }] }],
      coral: [{ x: 1170, y: 655, w: 90, h: 50 }],
      invasives: [], startHealth: 30,
      hint: 'Drag back from the sling and let go. Break the ghost net to free the hatchlings.'
    },
    {
      id: '1-2', name: 'Steady Hands', world: 1, place: 'Florida Keys', background: 'keys_seagrass',
      width: 1280, waterline: 450, tide: null, dark: false, glowSpots: [], currents: [],
      sling: { x: 170, y: 385 }, statics: [midRock,
        { x: 640, y: 340, w: 46, h: 440, look: 'root' },
        { x: 980, y: 515, w: 380, h: 30, look: 'rock' }],
      queue: ['tang', 'tang', 'flyingfish'],
      objects: [
        { k: 'plastic', x: 880, y: 660, w: 50, h: 40 },
        { k: 'glass', x: 1110, y: 650, w: 18, h: 60 }
      ],
      containers: [{ k: 'net', x: 1000, y: 615, w: 70, h: 130, holds: [{ k: 'hatchling', n: 2 }] }],
      coral: [{ x: 1220, y: 655, w: 80, h: 50 }],
      invasives: [], startHealth: 30,
      hint: 'After launch, HOLD and drag to steer. Swim under the mangrove root to reach the net.'
    },
    {
      id: '1-3', name: 'Bottle Graveyard', world: 1, place: 'Florida Keys', background: 'keys_seagrass',
      width: 1280, waterline: 450, tide: null, dark: false, glowSpots: [], currents: [],
      sling: { x: 170, y: 385 }, statics: [midRock],
      queue: ['pistolshrimp', 'flyingfish', 'tang'],
      objects: [
        { k: 'glass', x: 895, y: 575, w: 18, h: 50 },
        { k: 'glass', x: 920, y: 575, w: 18, h: 50 },
        { k: 'glass', x: 945, y: 575, w: 18, h: 50 },
        { k: 'glass', x: 970, y: 575, w: 18, h: 50 },
        { k: 'plastic', x: 932, y: 530, w: 120, h: 36 },
        { k: 'plastic', x: 845, y: 650, w: 50, h: 60 },
        { k: 'plastic', x: 1020, y: 650, w: 50, h: 60 }
      ],
      containers: [{ k: 'net', x: 932, y: 640, w: 90, h: 80, holds: [{ k: 'seahorse', n: 1 }] }],
      coral: [{ x: 1180, y: 655, w: 90, h: 50 }],
      invasives: [], startHealth: 30,
      hint: 'Tap while the pistol shrimp is underwater: its snap shatters glass and plastic.'
    },
    {
      id: '1-4', name: 'Spines', world: 1, place: 'Florida Keys', background: 'keys_reef',
      width: 1280, waterline: 450, tide: null, dark: false, glowSpots: [], currents: [],
      sling: { x: 170, y: 385 }, statics: [midRock],
      queue: ['puffer', 'pistolshrimp', 'tang'],
      objects: [{ k: 'plastic', x: 1060, y: 660, w: 40, h: 40 }],
      containers: [{ k: 'trap', x: 960, y: 645, w: 100, h: 70, holds: [{ k: 'fishschool', n: 1 }] }],
      coral: [{ x: 820, y: 655, w: 90, h: 50 }, { x: 1130, y: 655, w: 90, h: 50 }],
      invasives: [{ k: 'lionfish', x: 960, y: 555, patrol: 90 }], startHealth: 25,
      hint: 'Lionfish spines knock out a rescuer\'s ability. The pufferfish is immune; a snap scares them off. Avoid the living coral.'
    },
    {
      id: '1-5', name: 'Stone-Crab Traps', world: 1, place: 'Florida Keys', background: 'keys_channel',
      width: 1280, waterline: 600, tide: null, dark: false, glowSpots: [], currents: [],
      sling: { x: 190, y: 500 }, statics: [lowRock],
      queue: ['loggerhead', 'tang', 'pistolshrimp', 'hammerhead'],
      objects: [
        { k: 'concrete', x: 900, y: 590, w: 60, h: 40 },
        { k: 'tin', x: 1010, y: 640, w: 44, h: 80 },
        { k: 'concrete', x: 1120, y: 590, w: 60, h: 40 },
        { k: 'plastic', x: 1205, y: 650, w: 40, h: 50 }
      ],
      containers: [
        { k: 'trap', x: 900, y: 645, w: 100, h: 70, holds: [{ k: 'seahorse', n: 1 }] },
        { k: 'trap', x: 1120, y: 645, w: 100, h: 70, holds: [{ k: 'hatchling', n: 2 }] }
      ],
      coral: [], invasives: [], startHealth: 30,
      hint: 'Heavy rescuers shove junk; the hammerhead\'s ram cracks concrete.'
    },
    {
      id: '2-1', name: 'Rising Tide', world: 2, place: 'Galápagos Islands', background: 'galapagos_lagoon',
      width: 1280, waterline: 520, tide: { min: 420, max: 520, step: 50 }, dark: false, glowSpots: [], currents: [],
      sling: { x: 170, y: 355 }, statics: [tallRock, { x: 960, y: 640, w: 140, h: 80, look: 'lava' }],
      queue: ['swordfish', 'tang', 'puffer', 'hammerhead'],
      objects: [
        { k: 'plastic', x: 870, y: 660, w: 40, h: 40 },
        { k: 'glass', x: 1040, y: 650, w: 18, h: 60 },
        { k: 'concrete', x: 1100, y: 620, w: 40, h: 120 }
      ],
      containers: [
        { k: 'net', x: 960, y: 540, w: 70, h: 120, holds: [{ k: 'fishschool', n: 1 }] },
        { k: 'net', x: 1190, y: 620, w: 60, h: 120, holds: [{ k: 'hatchling', n: 2 }] }
      ],
      coral: [], invasives: [], startHealth: 30,
      hint: 'The tide rises and falls between shots. Swordfish slice nets on contact.'
    },
    {
      id: '2-5', name: 'Longline', world: 2, place: 'Galápagos Islands', background: 'galapagos_open',
      width: 1800, waterline: 430, tide: null, dark: false, glowSpots: [], currents: [],
      sling: { x: 170, y: 355 }, statics: [tallRock],
      queue: ['swordfish', 'swordfish', 'flyingfish'],
      objects: [
        { k: 'plastic', x: 1350, y: 425, w: 50, h: 30 },
        { k: 'concrete', x: 1460, y: 620, w: 60, h: 120 }
      ],
      containers: [
        { k: 'line', x: 760, y: 560, w: 6, h: 240, holds: [{ k: 'fishschool', n: 1 }] },
        { k: 'line', x: 1000, y: 560, w: 6, h: 240, holds: [{ k: 'fishschool', n: 1 }] },
        { k: 'line', x: 1240, y: 560, w: 6, h: 240, holds: [{ k: 'fishschool', n: 1 }] },
        { k: 'net', x: 1620, y: 450, w: 80, h: 110, holds: [{ k: 'hatchling', n: 1 }] }
      ],
      coral: [], invasives: [], startHealth: 30,
      hint: 'Steer a swordfish underwater to cut every longline in one pass. Concrete stops it dead, so go over it to reach the drifting net.'
    },
    {
      id: '2-9', name: 'Lava Tube', world: 2, place: 'Galápagos Islands', background: 'lava_cave',
      width: 1280, waterline: 450, tide: null, dark: true, currents: [],
      glowSpots: [{ x: 700, y: 560 }, { x: 1000, y: 500 }, { x: 1180, y: 620 }],
      sling: { x: 170, y: 385 }, statics: [midRock, { x: 850, y: 55, w: 900, h: 110, look: 'lava' }],
      queue: ['tang', 'puffer', 'pistolshrimp', 'hammerhead'],
      objects: [
        { k: 'plastic', x: 880, y: 655, w: 50, h: 50 },
        { k: 'concrete', x: 1170, y: 590, w: 60, h: 40 }
      ],
      containers: [
        { k: 'net', x: 1000, y: 615, w: 70, h: 130, holds: [{ k: 'hatchling', n: 2 }] },
        { k: 'trap', x: 1170, y: 645, w: 90, h: 70, holds: [{ k: 'seahorse', n: 1 }] }
      ],
      coral: [], invasives: [], startHealth: 30, grantGlow: true,
      hint: 'It\'s dark in the lava tube. Glowing plankton lights anything that moves. Try the Glow Lure.'
    }
  ];

  TT.levelById = function (id) {
    for (var i = 0; i < TT.LEVELS.length; i++) if (TT.LEVELS[i].id === id) return TT.LEVELS[i];
    return null;
  };
})();

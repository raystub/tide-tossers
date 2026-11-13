// Tide Tossers — Puzzle mode: small rooms with a fixed number of moves. Every ability use is one move;
// swimming into things does no damage here, so each rescue has to be planned. No tide timer.
//   moves: ability uses allowed.   par: moves for three stars (par + 1 = two stars).
//   hp: strength multiplier for nets and junk (0.8 by default, so one good hit breaks a net).
// Same level format as js/levels.js otherwise.
window.TT = window.TT || {};

TT.PUZZLES = [
  {
    id: 'P1', name: 'First Moves', puzzle: true, world: 1, background: 'keys',
    width: 1800, waterline: 190, start: { x: 170, y: 50 }, team: ['tang'], moves: 5, par: 3, exit: { x: 1700, y: 420 },
    statics: [{ x: 1000, y: 630, w: 180, h: 100, look: 'rock' }],
    objects: [{ k: 'plastic', x: 600, y: 195, w: 56, h: 38 }],
    containers: [
      { k: 'net', x: 650, y: 605, w: 84, h: 150, holds: [{ k: 'hatchling', n: 2 }] },
      { k: 'net', x: 1100, y: 380, w: 74, h: 130, hang: true, holds: [{ k: 'seahorse', n: 1 }] },
      { k: 'net', x: 1500, y: 605, w: 84, h: 150, holds: [{ k: 'fishschool', n: 1 }] }
    ],
    coral: [{ x: 850, y: 640, w: 120, h: 76 }], invasives: [], startHealth: 40,
    hint: 'Every dash is a move. Line up each net before you dash: three nets, three dashes.'
  },
  {
    id: 'P2', name: 'Line Pairs', puzzle: true, world: 1, background: 'keys',
    width: 1900, waterline: 190, start: { x: 170, y: 50 }, team: ['pistolshrimp', 'tang'], moves: 6, par: 3, exit: { x: 1800, y: 420 },
    statics: [{ x: 1250, y: 640, w: 160, h: 80, look: 'rock' }],
    objects: [{ k: 'glass', x: 560, y: 650, w: 18, h: 60 }, { k: 'glass', x: 1600, y: 650, w: 18, h: 60 }],
    containers: [
      { k: 'line', x: 640, y: 430, w: 6, h: 460, holds: [{ k: 'fishschool', n: 1 }] },
      { k: 'line', x: 730, y: 430, w: 6, h: 460, holds: [{ k: 'fishschool', n: 1 }] },
      { k: 'line', x: 1500, y: 430, w: 6, h: 460, holds: [{ k: 'fishschool', n: 1 }] },
      { k: 'line', x: 1590, y: 430, w: 6, h: 460, holds: [{ k: 'fishschool', n: 1 }] },
      { k: 'net', x: 1060, y: 380, w: 74, h: 130, hang: true, holds: [{ k: 'seahorse', n: 1 }] }
    ],
    coral: [], invasives: [], startHealth: 40,
    hint: 'A pistol-shrimp snap between two lines cuts both. Save the tang\'s dash for the net.'
  },
  {
    id: 'P3', name: 'Over the Bar', puzzle: true, world: 1, background: 'keys',
    width: 2100, waterline: 200, start: { x: 170, y: 50 }, team: ['tang', 'flyingfish'], moves: 6, par: 4, exit: { x: 2000, y: 420 },
    statics: [{ x: 1000, y: 395, w: 130, h: 590, look: 'rock' }],
    objects: [{ k: 'plastic', x: 1300, y: 205, w: 56, h: 38 }],
    containers: [
      { k: 'net', x: 600, y: 605, w: 84, h: 150, holds: [{ k: 'hatchling', n: 2 }] },
      { k: 'net', x: 1400, y: 605, w: 84, h: 150, holds: [{ k: 'seahorse', n: 1 }] },
      { k: 'net', x: 1800, y: 390, w: 74, h: 130, hang: true, holds: [{ k: 'fishschool', n: 1 }] }
    ],
    coral: [{ x: 1600, y: 640, w: 120, h: 76 }], invasives: [], startHealth: 40,
    hint: 'The sandbar blocks the way. One leap gets you over; spend the rest on dashes.'
  },
  {
    id: 'P4', name: 'Spine Guard', puzzle: true, world: 1, background: 'keys',
    width: 1900, waterline: 190, start: { x: 170, y: 50 }, team: ['puffer', 'tang'], moves: 7, par: 3, exit: { x: 1800, y: 420 },
    statics: [{ x: 500, y: 630, w: 160, h: 100, look: 'rock' }],
    objects: [],
    containers: [
      { k: 'net', x: 1000, y: 605, w: 84, h: 150, holds: [{ k: 'hatchling', n: 2 }] },
      { k: 'net', x: 1300, y: 605, w: 84, h: 150, holds: [{ k: 'seahorse', n: 1 }] }
    ],
    coral: [{ x: 1600, y: 640, w: 120, h: 76 }],
    invasives: [{ k: 'lionfish', x: 1080, y: 500, patrol: 50 }, { k: 'lionfish', x: 1220, y: 470, patrol: 50 }],
    startHealth: 40,
    hint: 'One puff between the two lionfish drives both away. Then a dash for each net.'
  },
  {
    id: 'P5', name: 'Concrete Boxes', puzzle: true, world: 1, background: 'keys',
    width: 2000, waterline: 190, start: { x: 170, y: 50 }, team: ['hammerhead', 'loggerhead'], moves: 6, par: 4, exit: { x: 1900, y: 420 },
    statics: [{ x: 1150, y: 620, w: 160, h: 120, look: 'rock' }],
    objects: [
      { k: 'concrete', x: 760, y: 620, w: 40, h: 120 }, { k: 'concrete', x: 900, y: 620, w: 40, h: 120 }, { k: 'concrete', x: 830, y: 540, w: 120, h: 40 },
      { k: 'concrete', x: 1510, y: 620, w: 40, h: 120 }, { k: 'concrete', x: 1650, y: 620, w: 40, h: 120 }, { k: 'concrete', x: 1580, y: 540, w: 120, h: 40 }
    ],
    containers: [
      { k: 'trap', x: 830, y: 645, w: 100, h: 70, holds: [{ k: 'fishschool', n: 1 }] },
      { k: 'trap', x: 1580, y: 645, w: 100, h: 70, holds: [{ k: 'hatchling', n: 2 }] }
    ],
    coral: [], invasives: [], startHealth: 40,
    hint: 'Each trap is boxed in by concrete. Ram one slab away, then break the trap: two moves per box.'
  },
  {
    id: 'P6', name: 'One Big Push', puzzle: true, world: 1, background: 'keys',
    width: 2100, waterline: 200, start: { x: 170, y: 50 }, team: ['manatee', 'loggerhead'], moves: 4, par: 2, exit: { x: 2000, y: 420 },
    statics: [],
    seagrass: [{ x: 900, w: 700 }, { x: 1750, w: 300 }],
    objects: [],
    containers: [
      { k: 'net', x: 700, y: 430, w: 74, h: 130, holds: [{ k: 'hatchling', n: 1 }] },
      { k: 'net', x: 850, y: 430, w: 74, h: 130, holds: [{ k: 'seahorse', n: 1 }] },
      { k: 'net', x: 1000, y: 430, w: 74, h: 130, holds: [{ k: 'fishschool', n: 1 }] },
      { k: 'net', x: 1700, y: 360, w: 74, h: 130, hang: true, holds: [{ k: 'hatchling', n: 2 }] }
    ],
    coral: [], invasives: [], startHealth: 40,
    hint: 'Nothing stops a manatee\'s push. Line up the three nets and push once. Stay off the seagrass.'
  }
];

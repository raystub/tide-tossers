// Tide Tossers — Arcade mode: endless waves in one arena. Each wave scatters new nets, lines and traps
// (and, later, concrete and lionfish) into open slots; clearing it adds time. The run ends when the clock does.
window.TT = window.TT || {};

TT.Arcade = (function () {
  var C = TT.CFG;
  // Open spots in the arena and what can go there (coral and rocks below some of them leave room only for hanging nets and lines).
  var SLOTS = [
    { x: 450, t: ['net', 'trap', 'hang', 'line'] }, { x: 700, t: ['hang', 'line'] }, { x: 830, t: ['net', 'trap', 'hang'] },
    { x: 1200, t: ['net', 'trap', 'hang', 'line'] }, { x: 1450, t: ['hang', 'line'] }, { x: 1660, t: ['net', 'trap', 'hang', 'line'] },
    { x: 1900, t: ['hang', 'line'] }, { x: 2100, t: ['net', 'trap', 'hang', 'line'] }, { x: 2250, t: ['hang', 'line'] },
    { x: 2420, t: ['net', 'trap', 'hang', 'line'] }
  ];
  var HOLDS = [[{ k: 'hatchling', n: 2 }], [{ k: 'hatchling', n: 1 }], [{ k: 'seahorse', n: 1 }], [{ k: 'fishschool', n: 1 }]];

  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  return {
    level: function () {
      var W = C.ARCADE_LEVEL_WIDTH;
      return {
        id: 'arcade', name: 'Arcade', world: 1, background: 'keys', arcade: true,
        width: W, waterline: 190, start: { x: 170, y: 40 }, team: ['tang', 'pistolshrimp', 'hammerhead', 'puffer'],
        time: C.ARCADE_START_TIME, exit: { x: W - 120, y: 420 },
        statics: [{ x: 1000, y: 605, w: 180, h: 150, look: 'rock' }, { x: 1900, y: 620, w: 160, h: 120, look: 'rock' }],
        coral: [{ x: 700, y: 640, w: 130, h: 80 }, { x: 1450, y: 640, w: 130, h: 80 }, { x: 2250, y: 640, w: 130, h: 80 }],
        objects: [], containers: [], invasives: [], startHealth: 50,
        hint: 'Free every animal in the wave before the clock runs out. Each new wave adds time.'
      };
    },
    // Wave n: more containers, tougher junk, then lionfish and a big rescue every fifth wave.
    wave: function (n, level, playerPos) {
      var out = { containers: [], objects: [], invasives: [], blurb: '' };
      var count = Math.min(7, 2 + Math.floor((n + 1) / 2));
      var free = shuffle(SLOTS.filter(function (s) { return Math.abs(s.x - playerPos.x) > 240; }));
      if (n % 5 === 0) {
        // a big rescue on the floor at whichever end is farther away
        var bx = Math.abs(450 - playerPos.x) > Math.abs(2420 - playerPos.x) ? 450 : 2420;
        out.containers.push({ k: 'net', x: bx, y: 590, w: 220, h: 140, stages: 2, holds: [{ k: 'sawfish', n: 1 }] });
        free = free.filter(function (s) { return Math.abs(s.x - bx) > 200; });
        count--; out.blurb = 'A sawfish is caught in a gillnet!';
      }
      var traps = 0;
      for (var i = 0; i < count && i < free.length; i++) {
        var s = free[i], t = pick(s.t), holds = pick(HOLDS);
        if (t === 'net') out.containers.push({ k: 'net', x: s.x, y: 605, w: 84, h: 150, holds: holds });
        else if (t === 'trap') { out.containers.push({ k: 'trap', x: s.x, y: 645, w: 100, h: 70, holds: holds }); traps++;
          if (n >= 3) out.objects.push({ k: 'concrete', x: s.x, y: 590, w: 70, h: 40 }); }
        else if (t === 'hang') out.containers.push({ k: 'net', x: s.x, y: 340 + Math.round(Math.random() * 60), w: 74, h: 130, hang: true, holds: holds });
        else out.containers.push({ k: 'line', x: s.x, y: 430, w: 6, h: 460, holds: [{ k: 'fishschool', n: 1 }] });
      }
      // floating plastic and the odd bottle or drum
      var junk = 1 + Math.min(4, Math.floor(n / 2));
      for (var j = 0; j < junk; j++) {
        var x = 300 + Math.random() * (level.width - 500);
        if (Math.abs(x - playerPos.x) < 150) x += 300;
        var k = pick(n < 3 ? ['plastic', 'plastic', 'glass'] : ['plastic', 'glass', 'tin', 'wood']);
        if (k === 'plastic' || k === 'wood') out.objects.push({ k: k, x: x, y: level.waterline + 5, w: k === 'wood' ? 110 : 56, h: k === 'wood' ? 24 : 38 });
        else out.objects.push({ k: k, x: x, y: 520, w: k === 'tin' ? 44 : 18, h: k === 'tin' ? 80 : 60 });
      }
      var lions = n >= 3 ? Math.min(3, Math.floor((n - 1) / 2)) : 0;
      for (var l = 0; l < lions && l < out.containers.length; l++) {
        var c = out.containers[l];
        out.invasives.push({ k: 'lionfish', x: c.x + 60, y: 500, patrol: 70 });
      }
      if (!out.blurb) out.blurb = lions ? 'Watch out for lionfish.' : traps && n >= 3 ? 'Concrete is weighing down the traps.' : out.containers.length + ' rescues to make.';
      return out;
    }
  };
})();

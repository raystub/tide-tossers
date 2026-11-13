// Tide Tossers v0.5 — progress saved in localStorage (the game works without it).
// Storage key v3: the swim game's results aren't comparable with the old sling game's, so stars start fresh;
// field-guide cards, gadgets and settings are carried over from v2 once.
window.TT = window.TT || {};

TT.Save = (function () {
  var KEY = 'tideTossers.v3', OLD_KEY = 'tideTossers.v2';
  var data = null;

  function blank() {
    var g = {};
    Object.keys(TT.CFG.GADGETS).forEach(function (k) { g[k] = TT.CFG.GADGET_START_COUNT; });
    return { levels: {}, difficulty: 'current', gadgets: g, guide: {}, glowGranted: {}, seenHints: {}, tut: {}, haptics: true, muted: false,
      world: 1, arcade: { wave: 0, score: 0 }, ids: 2 };
  }

  function read(key) {
    try { var raw = window.localStorage.getItem(key); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  }

  function load() {
    if (data) return data;
    data = blank();
    var parsed = read(KEY);
    if (parsed) {
      var b = blank();
      data = Object.assign(b, parsed);
      data.gadgets = Object.assign(b.gadgets, parsed.gadgets || {});
      data.arcade = Object.assign(b.arcade, parsed.arcade || {});
      if (!parsed.ids) migrateIds();
    } else {
      var old = read(OLD_KEY);
      if (old) {
        data.guide = old.guide || {};
        data.haptics = old.haptics !== false;
        var og = old.gadgets || {};
        ['kelp', 'glow', 'netcutter'].forEach(function (k) { if (typeof og[k] === 'number') data.gadgets[k] = og[k]; });
        if (typeof og.sonar === 'number') data.gadgets.bubble = og.sonar;
        persist();
      }
    }
    return data;
  }

  // v0.6 renumbered the Galápagos levels into World 3; carry their stars across.
  function migrateIds() {
    var map = { '2-1': '3-1', '2-5': '3-4', '2-9': '3-5' };
    ['levels', 'glowGranted', 'seenHints'].forEach(function (k) {
      var o = data[k] || {}, out = {};
      Object.keys(o).forEach(function (id) { out[map[id] || id] = o[id]; });
      data[k] = out;
    });
    data.ids = 2;
    persist();
  }

  function persist() {
    try { window.localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* storage blocked: play without saving */ }
  }

  return {
    get: function () { return load(); },
    save: persist,
    difficulty: function () { var d = load().difficulty; return TT.CFG.DIFFICULTY[d] ? d : 'current'; },
    setDifficulty: function (d) { load().difficulty = d; persist(); },
    levelResult: function (levelId, diff) {
      var l = load().levels[levelId];
      return (l && l[diff]) || null;
    },
    // best result on any difficulty (used to unlock the next level)
    cleared: function (levelId) { var l = load().levels[levelId]; return !!l && Object.keys(l).length > 0; },
    recordResult: function (levelId, diff, stars, health, score, time) {
      var d = load();
      d.levels[levelId] = d.levels[levelId] || {};
      var prev = d.levels[levelId][diff] || { stars: 0, health: 0, score: 0, time: 0 };
      var improvedTo3 = stars === 3 && prev.stars < 3;
      d.levels[levelId][diff] = {
        stars: Math.max(prev.stars, stars),
        health: Math.max(prev.health, health),
        score: Math.max(prev.score, score),
        time: prev.time ? Math.min(prev.time, time) : time
      };
      persist();
      return { newThreeStar: improvedTo3 };
    },
    gadgetCount: function (k) { return load().gadgets[k] || 0; },
    useGadget: function (k) { var d = load(); if (d.gadgets[k] > 0) { d.gadgets[k]--; persist(); return true; } return false; },
    addGadget: function (k) { var d = load(); d.gadgets[k] = (d.gadgets[k] || 0) + 1; persist(); },
    unlockCards: function (ids) {
      var d = load(); var fresh = [];
      ids.forEach(function (id) { if (!d.guide[id]) { d.guide[id] = true; fresh.push(id); } });
      if (fresh.length) persist();
      return fresh;
    },
    cardUnlocked: function (id) { return !!load().guide[id]; },
    glowGranted: function (levelId) { return !!load().glowGranted[levelId]; },
    markGlowGranted: function (levelId) { load().glowGranted[levelId] = true; persist(); },
    hintSeen: function (levelId) { return !!load().seenHints[levelId]; },
    markHintSeen: function (levelId) { load().seenHints[levelId] = true; persist(); },
    tutDone: function (k) { return !!(load().tut || {})[k]; },
    markTut: function (k) { var d = load(); d.tut = d.tut || {}; d.tut[k] = true; persist(); },
    haptics: function () { return load().haptics !== false; },
    setHaptics: function (on) { load().haptics = !!on; persist(); },
    // a level is open when everything before it in its world is cleared (or UNLOCK_ALL is on)
    levelOpen: function (level) {
      if (TT.CFG.UNLOCK_ALL) return true;
      var list = level.puzzle ? TT.PUZZLES : TT.levelsInWorld(level.world), i = list.indexOf(level);
      if (i <= 0) return level.puzzle || level.world === 1 || this.worldDone(level.world - 1);
      return this.cleared(list[i - 1].id);
    },
    worldDone: function (n) { var self = this, l = TT.levelsInWorld(n); return l.length > 0 && l.every(function (x) { return self.cleared(x.id); }); },
    worldStars: function (n, diff) { var self = this; return TT.levelsInWorld(n).reduce(function (a, l) { var r = self.levelResult(l.id, diff); return a + (r ? r.stars : 0); }, 0); },
    world: function () { return load().world || 1; },
    setWorld: function (n) { load().world = n; persist(); },
    arcadeBest: function () { return load().arcade; },
    recordArcade: function (wave, score) {
      var a = load().arcade, better = wave > a.wave || (wave === a.wave && score > a.score);
      if (better) { a.wave = wave; a.score = score; persist(); }
      return better;
    },
    muted: function () { return !!load().muted; },
    setMuted: function (m) { load().muted = !!m; persist(); }
  };
})();

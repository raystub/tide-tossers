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
    return { levels: {}, difficulty: 'current', gadgets: g, guide: {}, glowGranted: {}, seenHints: {}, tut: {}, haptics: true, muted: false };
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
    muted: function () { return !!load().muted; },
    setMuted: function (m) { load().muted = !!m; persist(); }
  };
})();

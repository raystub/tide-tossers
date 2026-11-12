// Tide Tossers v0.2 — progress saved in localStorage (works without it).
window.TT = window.TT || {};

TT.Save = (function () {
  var KEY = 'tideTossers.v2';
  var data = null;

  function blank() {
    var g = {};
    Object.keys(TT.CFG.GADGETS).forEach(function (k) { g[k] = TT.CFG.GADGET_START_COUNT; });
    return { levels: {}, difficulty: 'current', gadgets: g, guide: {}, glowGranted: {}, seenHints: {}, tut: {},
      steerMode: TT.MOBILE ? 'swipe' : 'point', haptics: true };
  }

  function load() {
    if (data) return data;
    data = blank();
    try {
      var raw = window.localStorage.getItem(KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        var b = blank();
        data = Object.assign(b, parsed);
        data.gadgets = Object.assign(b.gadgets, parsed.gadgets || {});
      }
    } catch (e) { /* storage blocked: play without saving */ }
    return data;
  }

  function persist() {
    try { window.localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* ignore */ }
  }

  return {
    get: function () { return load(); },
    save: persist,
    difficulty: function () { return load().difficulty || 'current'; },
    setDifficulty: function (d) { load().difficulty = d; persist(); },
    levelResult: function (levelId, diff) {
      var l = load().levels[levelId];
      return (l && l[diff]) || null;
    },
    recordResult: function (levelId, diff, stars, health, score) {
      var d = load();
      d.levels[levelId] = d.levels[levelId] || {};
      var prev = d.levels[levelId][diff] || { stars: 0, health: 0, score: 0 };
      var improvedTo3 = stars === 3 && prev.stars < 3;
      d.levels[levelId][diff] = {
        stars: Math.max(prev.stars, stars),
        health: Math.max(prev.health, health),
        score: Math.max(prev.score, score)
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
    steerMode: function () { return load().steerMode || (TT.MOBILE ? 'swipe' : 'point'); },
    setSteerMode: function (m) { load().steerMode = m; persist(); },
    haptics: function () { return load().haptics !== false; },
    setHaptics: function (on) { load().haptics = !!on; persist(); }
  };
})();

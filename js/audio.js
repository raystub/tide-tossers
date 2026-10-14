// Tide Tossers v0.2 — tiny Web Audio sound effects (no audio files).
window.TT = window.TT || {};

TT.Sfx = (function () {
  var ctx = null, master = null, muted = false;
  function ensure() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return ctx; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.35; master.connect(ctx.destination); } catch (e) { ctx = null; }
    return ctx;
  }
  function noise(dur) {
    var len = Math.max(1, Math.floor(ctx.sampleRate * dur)), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    var src = ctx.createBufferSource(); src.buffer = buf; return src;
  }
  function env(node, t, a, peak, dec) {
    var g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec);
    node.connect(g); g.connect(master); return g;
  }
  function tone(type, f0, f1, dur, peak) {
    var t = ctx.currentTime, o = ctx.createOscillator(); o.type = type;
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    env(o, t, 0.01, peak || 0.3, dur); o.start(t); o.stop(t + dur + 0.05);
  }
  function filtered(dur, type, f0, f1, peak) {
    var t = ctx.currentTime, n = noise(dur), f = ctx.createBiquadFilter(); f.type = type;
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
    n.connect(f); env(f, t, 0.008, peak || 0.4, dur); n.start(t); n.stop(t + dur + 0.05);
  }
  var sounds = {
    launch: function () { filtered(0.25, 'bandpass', 900, 300, 0.25); },
    splash: function () { filtered(0.5, 'lowpass', 2400, 300, 0.5); tone('sine', 300, 120, 0.25, 0.12); },
    skip: function () { filtered(0.15, 'highpass', 3000, 1200, 0.25); },
    snap: function () { filtered(0.06, 'highpass', 6000, 2000, 0.9); tone('sine', 180, 60, 0.18, 0.3); },
    burst: function () { tone('sine', 500, 900, 0.12, 0.15); },
    whoosh: function () { filtered(0.4, 'bandpass', 400, 1800, 0.3); },
    puff: function () { tone('sine', 140, 60, 0.3, 0.35); filtered(0.2, 'lowpass', 900, 200, 0.2); },
    crack: function () { filtered(0.12, 'bandpass', 2200, 800, 0.4); },
    glass: function () { tone('triangle', 2600, 1800, 0.18, 0.12); filtered(0.15, 'highpass', 5000, 3000, 0.25); },
    tear: function () { filtered(0.35, 'bandpass', 1400, 600, 0.35); },
    thud: function () { tone('sine', 110, 50, 0.2, 0.35); },
    coral: function () { tone('triangle', 260, 180, 0.15, 0.2); },
    free: function () { tone('sine', 660, 990, 0.25, 0.12); setTimeout(function () { if (ctx) tone('sine', 880, 1320, 0.3, 0.1); }, 120); },
    flee: function () { filtered(0.3, 'bandpass', 700, 1500, 0.2); },
    win: function () { [523, 659, 784, 1046].forEach(function (f, i) { setTimeout(function () { if (ctx) tone('sine', f, f, 0.35, 0.14); }, i * 140); }); },
    lose: function () { tone('sine', 330, 220, 0.6, 0.15); }
  };
  return {
    unlock: function () { ensure(); },
    play: function (name) { if (muted || !ensure() || !sounds[name]) return; try { sounds[name](); } catch (e) { /* ignore */ } },
    setMuted: function (m) { muted = m; },
    isMuted: function () { return muted; }
  };
})();

// Vibration (Android browsers; iPhones need the installed app). Throttled so impacts don't buzz constantly.
TT.Haptics = (function () {
  var last = 0;
  var can = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
  return {
    available: function () { return can; },
    buzz: function (pattern) {
      if (!can || !TT.Save.haptics()) return;
      var now = Date.now(); if (now - last < 70) return; last = now;
      try { navigator.vibrate(pattern); } catch (e) { /* ignore */ }
    }
  };
})();

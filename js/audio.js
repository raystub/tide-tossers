// Tide Tossers v0.5 — Web Audio sound effects and a soft generative ambience (no audio files).
window.TT = window.TT || {};

TT.Sfx = (function () {
  var ctx = null, master = null, muted = null, amb = null, ambTimer = null;
  function isMuted() { if (muted === null) muted = TT.Save.muted(); return muted; }
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
  function env(node, t, a, peak, dec, out) {
    var g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec);
    node.connect(g); g.connect(out || master); return g;
  }
  function tone(type, f0, f1, dur, peak, delay) {
    var t = ctx.currentTime + (delay || 0), o = ctx.createOscillator(); o.type = type;
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    env(o, t, 0.01, peak || 0.3, dur); o.start(t); o.stop(t + dur + 0.05);
  }
  function filtered(dur, type, f0, f1, peak) {
    var t = ctx.currentTime, n = noise(dur), f = ctx.createBiquadFilter(); f.type = type;
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
    n.connect(f); env(f, t, 0.008, peak || 0.4, dur); n.start(t); n.stop(t + dur + 0.05);
  }
  var SCALE = [392, 440, 523, 587, 659, 784, 880, 1046]; // G major pentatonic-ish, for chains
  var sounds = {
    splash: function () { filtered(0.5, 'lowpass', 2400, 300, 0.5); tone('sine', 300, 120, 0.25, 0.12); },
    breach: function () { filtered(0.3, 'highpass', 1800, 3600, 0.3); },
    snap: function () { filtered(0.06, 'highpass', 6000, 2000, 0.9); tone('sine', 180, 60, 0.18, 0.3); },
    dash: function () { filtered(0.22, 'bandpass', 500, 2200, 0.32); tone('sine', 420, 760, 0.12, 0.1); },
    whoosh: function () { filtered(0.4, 'bandpass', 400, 1800, 0.3); },
    puff: function () { tone('sine', 140, 60, 0.3, 0.35); filtered(0.2, 'lowpass', 900, 200, 0.2); },
    crack: function () { filtered(0.12, 'bandpass', 2200, 800, 0.4); },
    glass: function () { tone('triangle', 2600, 1800, 0.18, 0.12); filtered(0.15, 'highpass', 5000, 3000, 0.25); },
    tear: function () { filtered(0.35, 'bandpass', 1400, 600, 0.35); },
    thud: function () { tone('sine', 110, 50, 0.2, 0.35); },
    coral: function () { tone('triangle', 260, 180, 0.15, 0.2); },
    sting: function () { tone('sawtooth', 520, 140, 0.25, 0.14); },
    shield: function () { tone('sine', 900, 1500, 0.2, 0.12); },
    swap: function () { tone('sine', 520, 780, 0.1, 0.12); filtered(0.12, 'highpass', 2500, 4000, 0.12); },
    ready: function () { tone('sine', 880, 1175, 0.08, 0.05); },
    tick: function () { tone('square', 1200, 1200, 0.03, 0.05); },
    // n = chain length: each link plays one step higher
    free: function (n) { var i = Math.min(SCALE.length - 2, Math.max(0, (n || 1) - 1)); tone('sine', SCALE[i], SCALE[i] * 1.5, 0.25, 0.14); tone('sine', SCALE[i + 1], SCALE[i + 1] * 1.5, 0.3, 0.1, 0.11); },
    flee: function () { filtered(0.3, 'bandpass', 700, 1500, 0.2); },
    exit: function () { [659, 784, 988].forEach(function (f, i) { tone('sine', f, f, 0.3, 0.1, i * 0.09); }); },
    win: function () { [523, 659, 784, 1046].forEach(function (f, i) { tone('sine', f, f, 0.38, 0.14, i * 0.14); }); },
    lose: function () { tone('sine', 330, 220, 0.6, 0.15); }
  };

  // Ambience: a low filtered-noise "underwater" bed plus sparse soft notes.
  function startAmbience() {
    if (amb || isMuted() || !ensure()) return;
    try {
      var n = noise(4); n.loop = true;
      var f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 320;
      var g = ctx.createGain(); g.gain.value = 0.0001; g.gain.exponentialRampToValueAtTime(0.5, ctx.currentTime + 2);
      n.connect(f); f.connect(g); g.connect(master); n.start();
      amb = { n: n, g: g };
      var notes = [196, 220, 262, 294, 330, 392];
      ambTimer = setInterval(function () {
        if (!ctx || isMuted() || ctx.state !== 'running' || Math.random() < 0.45) return;
        var fr = notes[Math.floor(Math.random() * notes.length)] * (Math.random() < 0.3 ? 2 : 1);
        tone('sine', fr, fr, 2.2, 0.035);
      }, 1700);
    } catch (e) { amb = null; }
  }
  function stopAmbience() {
    if (ambTimer) { clearInterval(ambTimer); ambTimer = null; }
    if (amb) { try { amb.n.stop(); } catch (e) { /* ignore */ } amb = null; }
  }

  return {
    unlock: function () { if (ensure()) startAmbience(); },
    play: function (name, arg) { if (isMuted() || !ensure() || !sounds[name]) return; try { sounds[name](arg); } catch (e) { /* ignore */ } },
    setMuted: function (m) { muted = !!m; TT.Save.setMuted(muted); if (muted) stopAmbience(); else if (ctx) startAmbience(); },
    isMuted: isMuted
  };
})();

// Vibration (Android browsers; iPhones don't support it). Throttled so impacts don't buzz constantly.
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

// Tide Tossers v0.5 — scenery: everything you see that isn't a game object.
// Built for wide scrolling levels: every background layer is a small repeating tile (max 1024 px) that scrolls at
// its own rate (parallax), so a 3600 px level costs the same memory as a 1300 px one. Layers, back to front:
//   sky + distant shore · water depth gradient · far reef haze · light rays · mid reef · sand floor ·
//   reef-garden props (swaying) · caustic light · [game objects] · surface waves · foreground silhouettes · darkness.
window.TT = window.TT || {};

(function () {
  var TILE = 1024, PS = 1.5;   // prop supersampling, so props stay crisp under the camera zoom
  var H = TT.Art.h, rng = H.rng, canvas = H.canvas, lin = H.lin, rad = H.rad, stylize = H.stylize;

  var PAL = {
    keys: {
      sky: ['#48b4f0', '#aee3fb', '#e8f8ff'], water: ['#49d6d8', '#1aa6c6', '#0c6f9f', '#0a4a7c'],
      far: 'rgba(120,214,226,0.55)', far2: 'rgba(64,170,200,0.75)', mid: '#127a9e', mid2: '#0e648a',
      sand: ['#f7e9bd', '#e6cf93', '#c9ae74'], ray: 'rgba(255,255,235,', glow: '#bff6ff'
    },
    galapagos: {
      sky: ['#3f8fd6', '#9fd0f2', '#e2f2fb'], water: ['#3cc2dc', '#1489b8', '#0b5890', '#082f5e'],
      far: 'rgba(96,180,214,0.55)', far2: 'rgba(46,128,172,0.78)', mid: '#124f78', mid2: '#0c3d62',
      sand: ['#b9ad90', '#8f856d', '#6a6252'], ray: 'rgba(235,250,255,', glow: '#bfeaff'
    },
    cave: {
      sky: ['#05121c', '#07202e', '#0a2c3e'], water: ['#135a78', '#0c3f5c', '#07263f', '#030f1c'],
      far: 'rgba(30,96,124,0.6)', far2: 'rgba(16,64,90,0.85)', mid: '#0a2a40', mid2: '#071d2e',
      sand: ['#5a5b62', '#3e3f46', '#2a2b31'], ray: 'rgba(160,230,255,', glow: '#7fe9ff'
    }
  };

  // ---------- small drawing helpers ----------
  // Draw something that may straddle the tile edge: once in place and once wrapped.
  function wrap(ctx, x, halfW, fn) {
    fn(x);
    if (x - halfW < 0) fn(x + TILE);
    if (x + halfW > TILE) fn(x - TILE);
  }
  // A periodic "hill line": sum of sines whose periods divide the tile width, so the tile repeats seamlessly.
  function hills(r, n, amp) {
    var parts = [];
    for (var i = 0; i < n; i++) parts.push({ k: 1 + i + Math.floor(r() * 2), a: amp / (1 + i * 0.8) * (0.6 + r() * 0.6), p: r() * 6.28 });
    return function (x) { var y = 0; for (var j = 0; j < parts.length; j++) y += Math.sin(x / TILE * 6.28318 * parts[j].k + parts[j].p) * parts[j].a; return y; };
  }
  function blob(ctx, x, y, w, h, r, bump) {
    ctx.beginPath();
    var n = 14;
    for (var i = 0; i <= n; i++) {
      var a = Math.PI + i / n * Math.PI, rr = 1 + (r() - 0.5) * (bump || 0.25);
      ctx.lineTo(x + Math.cos(a) * w / 2 * rr, y + Math.sin(a) * h * rr);
    }
    ctx.closePath();
  }
  function branchy(ctx, x, y, len, ang, wd, r, spread, shrink) {
    if (len < 5 || wd < 0.8) return;
    var x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
    ctx.lineWidth = wd; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke();
    branchy(ctx, x2, y2, len * shrink, ang - spread * (0.6 + r() * 0.7), wd * 0.74, r, spread, shrink);
    branchy(ctx, x2, y2, len * shrink, ang + spread * (0.6 + r() * 0.7), wd * 0.74, r, spread, shrink);
    if (r() < 0.3) branchy(ctx, x2, y2, len * shrink * 0.8, ang + (r() - 0.5) * 0.3, wd * 0.6, r, spread, shrink);
  }
  function frond(ctx, x, y, hgt, lean, wd, r) {
    ctx.beginPath(); ctx.moveTo(x - wd, y);
    ctx.bezierCurveTo(x - wd + lean * 0.3, y - hgt * 0.4, x + lean - wd * 0.3, y - hgt * 0.8, x + lean, y - hgt);
    ctx.bezierCurveTo(x + lean + wd * 0.5, y - hgt * 0.75, x + wd + lean * 0.3, y - hgt * 0.4, x + wd, y);
    ctx.closePath(); ctx.fill();
  }

  // ---------- background tiles ----------
  function drawSky(ctx, w, h, fam) {
    var P = PAL[fam], r = rng(fam.length * 7 + 3);
    ctx.fillStyle = lin(ctx, 0, 0, 0, h, [[0, P.sky[0]], [0.6, P.sky[1]], [1, P.sky[2]]]); ctx.fillRect(0, 0, w, h);
    if (fam === 'cave') {   // rock roof instead of sky
      ctx.fillStyle = '#04090e';
      for (var i = 0; i < 40; i++) { ctx.globalAlpha = 0.25 + r() * 0.3; ctx.beginPath(); ctx.ellipse(r() * w, r() * h, 30 + r() * 80, 10 + r() * 24, 0, 0, 7); ctx.fill(); }
      ctx.globalAlpha = 1; return;
    }
    // sun glow
    ctx.fillStyle = rad(ctx, w * 0.72, h * 0.25, 0, 260, [[0, 'rgba(255,255,230,0.75)'], [0.25, 'rgba(255,250,220,0.3)'], [1, 'rgba(255,250,220,0)']]);
    ctx.fillRect(0, 0, w, h);
    // puffy clouds (wrapped so the tile repeats)
    for (var c = 0; c < 7; c++) {
      var cx = r() * w, cy = h * (0.12 + r() * 0.5), s = 0.6 + r() * 0.9;
      wrap(ctx, cx, 150 * s, function (x) {
        for (var p = 0; p < 6; p++) {
          var px = x + (p - 2.5) * 34 * s, py = cy - Math.sin(p / 5 * Math.PI) * 20 * s, pr = (26 + Math.sin(p * 2.1 + c) * 8) * s;
          ctx.fillStyle = rad(ctx, px - pr * 0.2, py - pr * 0.3, pr * 0.1, pr, [[0, 'rgba(255,255,255,0.98)'], [0.75, 'rgba(244,250,255,0.9)'], [1, 'rgba(214,234,248,0)']]);
          ctx.beginPath(); ctx.arc(px, py, pr, 0, 7); ctx.fill();
        }
      });
    }
  }
  // Distant shoreline strip that sits on the waterline.
  function drawShore(ctx, w, h, fam) {
    var r = rng(fam.length * 13 + 1), hl = hills(r, 3, h * 0.14);
    if (fam === 'cave') return;
    var cols = fam === 'keys' ? ['#5fae8a', '#3f8f6f', '#2f7a5e'] : ['#6b6f78', '#4a4d57', '#34363f'];
    for (var L = 0; L < 2; L++) {
      ctx.fillStyle = lin(ctx, 0, 0, 0, h, [[0, cols[L]], [1, cols[L + 1]]]);
      ctx.globalAlpha = L === 0 ? 0.55 : 0.9;
      ctx.beginPath(); ctx.moveTo(0, h);
      for (var x = 0; x <= w; x += 6) ctx.lineTo(x, h * (0.62 + L * 0.2) - hl(x + L * 311) * (L ? 0.6 : 1));
      ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (fam === 'keys') {   // low mangrove clumps along the shore
      for (var t = 0; t < 10; t++) {
        var tx = r() * w, ty = h * 0.9, ts = 0.6 + r() * 0.5;
        wrap(ctx, tx, 70, function (x) {
          for (var k = 0; k < 6; k++) {
            var bx = x + (k - 2.5) * 16 * ts, by = ty - (10 + 9 * Math.sin(k * 1.7 + t)) * ts;
            ctx.fillStyle = '#3f8a68'; ctx.beginPath(); ctx.ellipse(bx, by, 17 * ts, 12 * ts, 0, 0, 7); ctx.fill();
            ctx.fillStyle = 'rgba(150,214,160,0.55)'; ctx.beginPath(); ctx.ellipse(bx - 4 * ts, by - 4 * ts, 9 * ts, 5 * ts, 0, 0, 7); ctx.fill();
          }
        });
      }
    }
    ctx.fillStyle = lin(ctx, 0, h - 14, 0, h, [[0, 'rgba(255,255,255,0)'], [1, 'rgba(255,255,255,0.55)']]); ctx.fillRect(0, h - 14, w, 14); // haze at the waterline
  }
  // Far and mid reef silhouettes. `near` = the closer, darker, more detailed layer.
  function drawReefLayer(ctx, w, h, fam, near) {
    var P = PAL[fam], r = rng((near ? 500 : 100) + fam.length), hl = hills(r, 4, h * (near ? 0.13 : 0.17));
    var base = h * (near ? 0.62 : 0.42);
    // ground swell
    ctx.fillStyle = near ? lin(ctx, 0, base - 60, 0, h, [[0, P.mid], [1, P.mid2]]) : lin(ctx, 0, base - 80, 0, h, [[0, P.far], [1, P.far2]]);
    ctx.beginPath(); ctx.moveTo(0, h);
    for (var x = 0; x <= w; x += 6) ctx.lineTo(x, base + hl(x));
    ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
    var n = near ? 16 : 12;
    for (var i = 0; i < n; i++) {
      var px = (i + r() * 0.8) * w / n, gy = base + hl(px) + 6, s = (near ? 0.8 : 1.15) * (0.7 + r() * 0.7), kind = Math.floor(r() * 4);
      ctx.fillStyle = ctx.strokeStyle = near ? (r() < 0.5 ? P.mid : P.mid2) : P.far2;
      ctx.globalAlpha = near ? 0.96 : 0.8; ctx.lineCap = 'round';
      (function (px, gy, s, kind) {
        wrap(ctx, px, 130 * s, function (x) {
          if (fam === 'cave' || (fam === 'galapagos' && kind < 2)) {   // basalt spires and stacks
            var bw = (40 + r() * 50) * s, bh = (90 + r() * 150) * s;
            ctx.beginPath(); ctx.moveTo(x - bw, gy + 20);
            ctx.lineTo(x - bw * 0.7, gy - bh * 0.5); ctx.lineTo(x - bw * 0.25, gy - bh * 0.92); ctx.lineTo(x + bw * 0.1, gy - bh);
            ctx.lineTo(x + bw * 0.5, gy - bh * 0.7); ctx.lineTo(x + bw * 0.85, gy - bh * 0.3); ctx.lineTo(x + bw, gy + 20); ctx.closePath(); ctx.fill();
          } else if (kind === 0) {          // branching coral tree
            branchy(ctx, x, gy, 50 * s, -Math.PI / 2, 11 * s, r, 0.45, 0.74);
          } else if (kind === 1) {          // sea fan
            ctx.beginPath(); ctx.moveTo(x, gy); ctx.ellipse(x, gy - 70 * s, 60 * s, 70 * s, 0, Math.PI * 0.5, Math.PI * 2.5); ctx.fill();
          } else if (kind === 2) {          // kelp / sea-grass fronds
            for (var f = 0; f < 5; f++) frond(ctx, x + (f - 2) * 14 * s, gy + 8, (110 + r() * 110) * s, (r() - 0.5) * 60 * s, 7 * s, r);
          } else {                          // rounded coral heads
            for (var b = 0; b < 3; b++) { ctx.beginPath(); ctx.ellipse(x + (b - 1) * 40 * s, gy + 4, (36 + r() * 20) * s, (40 + r() * 30) * s, 0, Math.PI, 0); ctx.fill(); }
          }
        });
      })(px, gy, s, kind);
    }
    ctx.globalAlpha = 1;
    // depth haze: fade the top of the layer into the water
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = lin(ctx, 0, 0, 0, h * 0.55, [[0, 'rgba(0,0,0,' + (near ? 0.5 : 0.75) + ')'], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(0, 0, w, h * 0.55);
    ctx.globalCompositeOperation = 'source-over';
  }
  function drawSand(ctx, w, h, fam) {
    var P = PAL[fam], r = rng(900 + fam.length), hl = hills(r, 3, 3);
    ctx.fillStyle = lin(ctx, 0, 0, 0, h, [[0, P.sand[0]], [0.35, P.sand[1]], [1, P.sand[2]]]);
    ctx.beginPath(); ctx.moveTo(0, h);
    for (var x = 0; x <= w; x += 8) ctx.lineTo(x, 8 + hl(x));
    ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.clip();
    // ripples
    ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 2;
    for (var row = 0; row < 4; row++) {
      ctx.beginPath();
      for (var x2 = 0; x2 <= w; x2 += 8) { var y = 20 + row * 13 + Math.sin(x2 / TILE * 6.28318 * (5 + row) + row) * 3; if (x2) ctx.lineTo(x2, y); else ctx.moveTo(x2, y); }
      ctx.stroke();
    }
    // speckles, pebbles and shells
    for (var i = 0; i < 260; i++) { ctx.fillStyle = 'rgba(' + (r() < 0.5 ? '255,255,255' : '90,70,40') + ',' + (0.12 + r() * 0.2) + ')'; ctx.fillRect(r() * w, 12 + r() * (h - 12), 1.5 + r() * 2, 1.5 + r() * 2); }
    for (var p = 0; p < 16; p++) {
      var px = 20 + r() * (w - 40), py = 22 + r() * (h - 36), pr = 3 + r() * 5;
      ctx.fillStyle = fam === 'keys' ? ['#f5c9b0', '#ffffff', '#d9b98a', '#f2a07a'][Math.floor(r() * 4)] : ['#55565c', '#77787e', '#3c3d42'][Math.floor(r() * 3)];
      ctx.beginPath(); ctx.ellipse(px, py, pr, pr * 0.65, r() * 3, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(px - pr * 0.25, py - pr * 0.2, pr * 0.4, pr * 0.2, 0, 0, 7); ctx.fill();
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2; ctx.beginPath();
    for (var x3 = 0; x3 <= w; x3 += 8) { if (x3) ctx.lineTo(x3, 8 + hl(x3)); else ctx.moveTo(x3, 8 + hl(x3)); }
    ctx.stroke();
  }
  function drawRay(ctx, w, h, fam) {
    var c = PAL[fam].ray;
    var g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, c + '0)'); g.addColorStop(0.5, c + '1)'); g.addColorStop(1, c + '0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'destination-in';
    ctx.fillStyle = lin(ctx, 0, 0, 0, h, [[0, 'rgba(0,0,0,0)'], [0.05, 'rgba(0,0,0,0.9)'], [0.5, 'rgba(0,0,0,0.4)'], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
  }
  // Surface strip: bright crest on top, soft light band underneath. Periodic so it tiles.
  function drawWave(ctx, w, h) {
    var crest = function (x) { return 12 + Math.sin(x / w * 6.28318 * 2) * 3 + Math.sin(x / w * 6.28318 * 5 + 1.3) * 1.6; };
    ctx.fillStyle = lin(ctx, 0, 8, 0, h, [[0, 'rgba(235,255,255,0.55)'], [0.3, 'rgba(190,245,255,0.22)'], [1, 'rgba(190,245,255,0)']]);
    ctx.beginPath(); ctx.moveTo(0, h);
    for (var x = 0; x <= w; x += 4) ctx.lineTo(x, crest(x));
    ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.beginPath();
    for (var x2 = 0; x2 <= w; x2 += 4) { if (x2) ctx.lineTo(x2, crest(x2)); else ctx.moveTo(x2, crest(x2)); }
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for (var i = 0; i < 9; i++) { var fx = (i * 0.113 + 0.05) % 1 * w; ctx.beginPath(); ctx.ellipse(fx, crest(fx) - 2, 5 + (i % 3) * 2, 2, 0, 0, 7); ctx.fill(); }
  }

  // ---------- reef-garden props ----------
  // Each returns { w, h, sway } and draws into a ctx already scaled to display px, origin at top-left of (w, h).
  var PROPS = {
    brain: { w: 120, h: 84, draw: function (ctx, w, h, r, hue) {
      var cols = [['#ffe27a', '#d59a2a'], ['#ffb88c', '#d8643a'], ['#b8f08c', '#4fa24a']][hue % 3];
      ctx.fillStyle = rad(ctx, w * 0.42, h * 0.35, 4, w * 0.6, [[0, cols[0]], [1, cols[1]]]);
      blob(ctx, w / 2, h, w * 0.96, h * 0.94, r, 0.1); ctx.fill();
      ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(120,70,20,0.45)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (var i = 0; i < 9; i++) { ctx.beginPath(); var y = h * (0.2 + i * 0.1); for (var x = 0; x <= w; x += 6) { var yy = y + Math.sin(x * 0.16 + i * 1.7) * 5 - Math.sin(x / w * Math.PI) * 10; if (x) ctx.lineTo(x, yy); else ctx.moveTo(x, yy); } ctx.stroke(); }
      ctx.restore();
    } },
    tubes: { w: 110, h: 150, sway: 0.02, draw: function (ctx, w, h, r, hue) {
      var cols = [['#c88cff', '#7a3fc0'], ['#ffd45e', '#e08a1e'], ['#ff8fb0', '#d0406e']][hue % 3];
      for (var i = 0; i < 5; i++) {
        var x = w * (0.16 + i * 0.17) + (r() - 0.5) * 6, th = h * (0.5 + r() * 0.48), tw = 20 + r() * 8;
        ctx.fillStyle = lin(ctx, x - tw / 2, 0, x + tw / 2, 0, [[0, cols[1]], [0.35, cols[0]], [1, cols[1]]]);
        ctx.beginPath(); ctx.moveTo(x - tw * 0.4, h); ctx.lineTo(x - tw / 2, h - th); ctx.lineTo(x + tw / 2, h - th); ctx.lineTo(x + tw * 0.4, h); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(40,10,60,0.55)'; ctx.beginPath(); ctx.ellipse(x, h - th, tw / 2, 5, 0, 0, 7); ctx.fill();
        ctx.strokeStyle = cols[0]; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, h - th, tw / 2, 5, 0, 0, 7); ctx.stroke();
      }
    } },
    fan: { w: 150, h: 170, sway: 0.035, draw: function (ctx, w, h, r, hue) {
      var col = ['#b46cf0', '#ff7a8a', '#ffa64d'][hue % 3];
      ctx.strokeStyle = col; ctx.lineCap = 'round';
      for (var i = 0; i < 13; i++) {
        var a = -Math.PI / 2 + (i / 12 - 0.5) * 1.9, len = h * (0.78 + Math.sin(i / 12 * Math.PI) * 0.18);
        ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(w / 2, h);
        ctx.quadraticCurveTo(w / 2 + Math.cos(a) * len * 0.5 + (r() - 0.5) * 10, h + Math.sin(a) * len * 0.5, w / 2 + Math.cos(a) * len, h + Math.sin(a) * len); ctx.stroke();
      }
      ctx.lineWidth = 1.6; ctx.globalAlpha = 0.75;
      for (var k = 1; k < 9; k++) { ctx.beginPath(); ctx.arc(w / 2, h, h * 0.1 * k, Math.PI * 1.02 + 0.45, Math.PI * 1.98 - 0.45); ctx.stroke(); }
      ctx.globalAlpha = 1;
    } },
    staghorn: { w: 150, h: 130, draw: function (ctx, w, h, r, hue) {
      ctx.strokeStyle = ['#ff9a5c', '#ffd27a', '#ff7e9a'][hue % 3]; ctx.lineCap = 'round';
      branchy(ctx, w * 0.5, h, h * 0.3, -Math.PI / 2, 15, r, 0.5, 0.76);
      branchy(ctx, w * 0.3, h, h * 0.22, -Math.PI / 2 - 0.3, 11, r, 0.5, 0.74);
      branchy(ctx, w * 0.72, h, h * 0.24, -Math.PI / 2 + 0.3, 11, r, 0.5, 0.74);
    } },
    anemone: { w: 110, h: 80, sway: 0.06, draw: function (ctx, w, h, r, hue) {
      var cols = [['#ff9ad0', '#ff5aa6'], ['#9af0e6', '#3cc2b6'], ['#ffe08a', '#ffb23c']][hue % 3];
      ctx.fillStyle = '#8a4a6a'; ctx.beginPath(); ctx.ellipse(w / 2, h - 8, w * 0.3, 12, 0, 0, 7); ctx.fill();
      ctx.lineCap = 'round';
      for (var i = 0; i < 22; i++) {
        var a = -Math.PI / 2 + (i / 21 - 0.5) * 2.4, len = h * (0.55 + r() * 0.3);
        ctx.strokeStyle = i % 2 ? cols[0] : cols[1]; ctx.lineWidth = 7;
        ctx.beginPath(); ctx.moveTo(w / 2 + (i / 21 - 0.5) * w * 0.4, h - 12);
        ctx.quadraticCurveTo(w / 2 + Math.cos(a) * len * 0.6, h - 12 + Math.sin(a) * len * 0.5, w / 2 + Math.cos(a) * len * 0.95 + (r() - 0.5) * 8, h - 12 + Math.sin(a) * len); ctx.stroke();
        ctx.fillStyle = '#ffffff'; ctx.globalAlpha = 0.8; ctx.beginPath(); ctx.arc(w / 2 + Math.cos(a) * len * 0.95, h - 12 + Math.sin(a) * len, 3, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
      }
    } },
    grass: { w: 120, h: 150, sway: 0.09, draw: function (ctx, w, h, r, hue) {
      for (var i = 0; i < 12; i++) {
        ctx.fillStyle = ['#3fbf6a', '#2c9a58', '#6ad080'][i % 3];
        frond(ctx, w * (0.12 + r() * 0.76), h, h * (0.5 + r() * 0.48), (r() - 0.5) * 50, 4.5 + r() * 2, r);
      }
    } },
    kelp: { w: 100, h: 260, sway: 0.07, draw: function (ctx, w, h, r, hue) {
      var col = ['#a9952e', '#7d8f2a', '#b7862e'][hue % 3];
      for (var s = 0; s < 3; s++) {
        var x0 = w * (0.3 + s * 0.2), top = h * (0.05 + r() * 0.2);
        ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0, h);
        for (var y = h; y >= top; y -= 12) ctx.lineTo(x0 + Math.sin(y * 0.035 + s * 2) * 12, y);
        ctx.stroke();
        ctx.fillStyle = col;
        for (var y2 = h - 20; y2 >= top; y2 -= 22) {
          var lx = x0 + Math.sin(y2 * 0.035 + s * 2) * 12, side = (Math.round(y2 / 22) % 2) ? 1 : -1;
          ctx.save(); ctx.translate(lx, y2); ctx.rotate(side * (0.9 + r() * 0.3)); ctx.beginPath(); ctx.ellipse(0, -16, 6, 18, 0, 0, 7); ctx.fill(); ctx.restore();
        }
      }
    } },
    boulder: { w: 150, h: 100, draw: function (ctx, w, h, r, hue) {
      var lava = hue === 9;
      ctx.fillStyle = lin(ctx, 0, 0, 0, h, lava ? [[0, '#5a5c66'], [1, '#22232a']] : [[0, '#c7b99a'], [1, '#7d7260']]);
      blob(ctx, w / 2, h, w * 0.96, h * 0.92, r, 0.3); ctx.fill();
      ctx.save(); ctx.clip();
      ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.beginPath(); ctx.ellipse(w * 0.36, h * 0.3, w * 0.3, h * 0.2, -0.3, 0, 7); ctx.fill();
      for (var i = 0; i < 14; i++) { ctx.fillStyle = 'rgba(0,0,0,' + (0.08 + r() * 0.12) + ')'; ctx.beginPath(); ctx.arc(r() * w, h * (0.3 + r() * 0.7), 3 + r() * 9, 0, 7); ctx.fill(); }
      ctx.fillStyle = lava ? 'rgba(220,120,60,0.8)' : 'rgba(110,190,110,0.7)';
      for (var k = 0; k < 9; k++) { ctx.beginPath(); ctx.arc(r() * w, h * (0.12 + r() * 0.3), 4 + r() * 6, 0, 7); ctx.fill(); }
      ctx.restore();
    } },
    cups: { w: 110, h: 60, draw: function (ctx, w, h, r, hue) {   // orange cup corals (Galápagos)
      for (var i = 0; i < 9; i++) {
        var x = w * (0.1 + r() * 0.8), y = h * (0.5 + r() * 0.4), s = 9 + r() * 7;
        ctx.fillStyle = rad(ctx, x, y, 1, s, [[0, '#ffe07a'], [0.5, '#ff9a2a'], [1, '#d85a14']]); ctx.beginPath(); ctx.arc(x, y, s, 0, 7); ctx.fill();
        ctx.strokeStyle = '#fff0b0'; ctx.lineWidth = 1.6;
        for (var t = 0; t < 10; t++) { var a = t / 10 * 6.28; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * s * 0.4, y + Math.sin(a) * s * 0.4); ctx.lineTo(x + Math.cos(a) * s * 1.15, y + Math.sin(a) * s * 1.15); ctx.stroke(); }
      }
    } },
    urchin: { w: 70, h: 60, draw: function (ctx, w, h, r, hue) {
      ctx.strokeStyle = hue % 2 ? '#3a2a4a' : '#7a3a2a'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (var t = 0; t < 22; t++) { var a = Math.PI + t / 21 * Math.PI; ctx.beginPath(); ctx.moveTo(w / 2, h - 12); ctx.lineTo(w / 2 + Math.cos(a) * w * 0.48, h - 12 + Math.sin(a) * h * 0.78); ctx.stroke(); }
      ctx.fillStyle = hue % 2 ? '#2a1d38' : '#5a2a1e'; ctx.beginPath(); ctx.ellipse(w / 2, h - 12, 16, 13, 0, 0, 7); ctx.fill();
    } },
    star: { w: 60, h: 44, draw: function (ctx, w, h, r, hue) {
      ctx.fillStyle = ['#ff8a4a', '#ff5a6a', '#ffc24a'][hue % 3]; ctx.beginPath();
      for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i / 10 * 6.283, rr = i % 2 ? 9 : 24; ctx.lineTo(w / 2 + Math.cos(a) * rr, h * 0.55 + Math.sin(a) * rr * 0.72); }
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.6)'; for (var k = 0; k < 5; k++) { var a2 = -Math.PI / 2 + k / 5 * 6.283; ctx.beginPath(); ctx.arc(w / 2 + Math.cos(a2) * 11, h * 0.55 + Math.sin(a2) * 8, 1.8, 0, 7); ctx.fill(); }
    } },
    glowtube: { w: 90, h: 110, sway: 0.03, draw: function (ctx, w, h, r, hue) {   // cave tube worms with glowing crowns
      for (var i = 0; i < 6; i++) {
        var x = w * (0.14 + i * 0.145), th = h * (0.4 + r() * 0.5);
        ctx.strokeStyle = '#3a4650'; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, h); ctx.lineTo(x + (r() - 0.5) * 8, h - th); ctx.stroke();
        ctx.fillStyle = rad(ctx, x, h - th, 1, 14, [[0, '#e8ffff'], [0.4, '#6ff0ff'], [1, 'rgba(60,200,255,0)']]); ctx.beginPath(); ctx.arc(x, h - th, 14, 0, 7); ctx.fill();
      }
    } }
  };
  var PROP_SETS = {
    keys: ['brain', 'tubes', 'fan', 'staghorn', 'anemone', 'grass', 'grass', 'star', 'boulder', 'fan', 'tubes'],
    galapagos: ['boulder', 'kelp', 'cups', 'urchin', 'kelp', 'star', 'boulder', 'grass', 'cups'],
    cave: ['boulder', 'glowtube', 'urchin', 'boulder', 'glowtube', 'cups']
  };
  function propTexture(scene, name, hue, fam, dark) {
    var key = 'prop_' + name + '_' + hue + (dark ? '_fg' : '') + (fam === 'cave' ? '_c' : '');
    var def = PROPS[name], pad = 8;
    return canvas(scene, key, (def.w + pad * 2) * PS, (def.h + pad) * PS, function (ctx, cw, ch) {
      ctx.save(); ctx.scale(PS, PS); ctx.translate(pad, pad);
      def.draw(ctx, def.w, def.h, rng(name.length * 31 + hue * 7), (name === 'boulder' && fam !== 'keys') ? 9 : hue);
      ctx.restore();
      if (dark) {   // foreground silhouette: flat dark shape
        ctx.globalCompositeOperation = 'source-in'; ctx.fillStyle = fam === 'cave' ? '#010509' : '#04263a'; ctx.fillRect(0, 0, cw, ch);
        ctx.globalCompositeOperation = 'source-over';
      } else {
        stylize(ctx, cw, ch, { sat: 1.15, outline: 2, color: 'rgba(10,70,100,0.8)' });
        // push the garden back: a wash of water colour so it reads as background, not something to hit
        if (fam !== 'cave') { ctx.globalCompositeOperation = 'source-atop'; ctx.fillStyle = fam === 'keys' ? 'rgba(24,150,186,0.36)' : 'rgba(18,96,150,0.42)'; ctx.fillRect(0, 0, cw, ch); ctx.globalCompositeOperation = 'source-over'; }
        if (fam === 'cave' && name !== 'glowtube') { ctx.globalCompositeOperation = 'source-atop'; ctx.fillStyle = 'rgba(4,20,36,0.55)'; ctx.fillRect(0, 0, cw, ch); ctx.globalCompositeOperation = 'source-over'; }
      }
    });
  }

  // ---------- shared textures ----------
  function ensureTextures(scene, fam) {
    canvas(scene, 'sky_' + fam, TILE, 400, function (c, w, h) { drawSky(c, w, h, fam); });
    canvas(scene, 'shore_' + fam, TILE, 130, function (c, w, h) { drawShore(c, w, h, fam); });
    canvas(scene, 'depth_' + fam, 4, 256, function (c, w, h) { var P = PAL[fam].water; c.fillStyle = lin(c, 0, 0, 0, h, [[0, P[0]], [0.3, P[1]], [0.7, P[2]], [1, P[3]]]); c.fillRect(0, 0, w, h); });
    canvas(scene, 'far_' + fam, TILE, 460, function (c, w, h) { drawReefLayer(c, w, h, fam, false); });
    canvas(scene, 'mid_' + fam, TILE, 360, function (c, w, h) { drawReefLayer(c, w, h, fam, true); });
    canvas(scene, 'sand_' + fam, TILE, 80, function (c, w, h) { drawSand(c, w, h, fam); });
    canvas(scene, 'ray_' + fam, 160, 512, function (c, w, h) { drawRay(c, w, h, fam); });
    canvas(scene, 'wave', 256, 72, drawWave);
    canvas(scene, 'streak', 48, 6, function (c, w, h) { var g = c.createLinearGradient(0, 0, w, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.7, 'rgba(255,255,255,0.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 1, w, h - 2); });
    canvas(scene, 'exit_ring', 220, 220, function (c, w) {
      var cx = w / 2;
      c.fillStyle = rad(c, cx, cx, 10, cx, [[0, 'rgba(160,255,230,0.5)'], [0.55, 'rgba(90,240,210,0.18)'], [1, 'rgba(90,240,210,0)']]); c.fillRect(0, 0, w, w);
      c.lineCap = 'round';
      for (var i = 0; i < 3; i++) {
        c.strokeStyle = 'rgba(200,255,240,' + (0.9 - i * 0.2) + ')'; c.lineWidth = 7 - i * 1.5;
        for (var s = 0; s < 3; s++) { var a0 = s * 2.094 + i * 0.6; c.beginPath(); c.arc(cx, cx, 44 + i * 22, a0, a0 + 1.4); c.stroke(); }
      }
    });
    canvas(scene, 'buoy', 44, 52, function (c, w, h) {
      c.fillStyle = lin(c, 0, 0, w, 0, [[0, '#ff6a3c'], [0.4, '#ff9a6a'], [1, '#c8381a']]); c.beginPath(); c.ellipse(w / 2, h * 0.52, w * 0.42, h * 0.42, 0, 0, 7); c.fill();
      c.fillStyle = '#ffffff'; c.fillRect(w * 0.1, h * 0.44, w * 0.8, h * 0.16);
      c.strokeStyle = '#06283a'; c.lineWidth = 3; c.beginPath(); c.ellipse(w / 2, h * 0.52, w * 0.42, h * 0.42, 0, 0, 7); c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.ellipse(w * 0.36, h * 0.3, 6, 4, -0.5, 0, 7); c.fill();
    });
  }

  // Build the layer stack. `view` = { w, h } of the visible world; returns the layer objects.
  function buildLayers(scene, fam, worldW, view, opts) {
    ensureTextures(scene, fam);
    var C = TT.CFG, L = { fam: fam, props: [], rays: [] }, vw = view.w + 80, r = rng(opts.seed || 1);
    L.sky = scene.add.tileSprite(0, 0, vw, 400, 'sky_' + fam).setOrigin(0, 1).setDepth(0);
    L.shore = scene.add.tileSprite(0, 0, vw, 130, 'shore_' + fam).setOrigin(0, 1).setDepth(0.2);
    L.depth = scene.add.image(0, 0, 'depth_' + fam).setOrigin(0, 0).setDepth(1);
    L.far = scene.add.tileSprite(0, C.FLOOR_Y + 30, vw, 460, 'far_' + fam).setOrigin(0, 1).setDepth(1.2);
    for (var i = 0; i < 7; i++) {
      var ray = scene.add.image(0, 0, 'ray_' + fam).setOrigin(0.5, 0).setDepth(1.4).setBlendMode(Phaser.BlendModes.ADD);
      ray.ttU = (i + r() * 0.7) / 7; ray.ttPh = r() * 6.28; ray.ttW = 0.7 + r() * 1.1;
      ray.setRotation(-0.32 + r() * 0.12);
      L.rays.push(ray);
    }
    L.mid = scene.add.tileSprite(0, C.FLOOR_Y + 30, vw, 360, 'mid_' + fam).setOrigin(0, 1).setDepth(1.6);
    L.sand = scene.add.tileSprite(0, C.FLOOR_Y - 12, worldW + 400, 80, 'sand_' + fam).setOrigin(0, 0).setDepth(2).setX(-200);
    // reef garden along the floor (behind the action), seeded so a level always looks the same
    var set = PROP_SETS[fam], x = -60, avoid = opts.avoid || [];
    while (x < worldW + 60) {
      x += 60 + r() * 110;
      var name = set[Math.floor(r() * set.length)], hue = Math.floor(r() * 3), def = PROPS[name];
      var blocked = avoid.some(function (a) { return Math.abs(a.x - x) < a.w / 2 + def.w * 0.4; });
      if (blocked) continue;
      var s = 0.75 + r() * 0.6, key = propTexture(scene, name, hue, fam, false);
      var img = scene.add.image(x, C.FLOOR_Y + 2 + r() * 8, key).setOrigin(0.5, 1).setScale(s / PS).setDepth(2.4 + r() * 0.2);
      if (r() < 0.5) img.setFlipX(true);
      if (def.sway) { img.ttSway = def.sway; img.ttPh = r() * 6.28; }
      L.props.push(img);
    }
    L.caustics = scene.add.tileSprite(0, C.FLOOR_Y - 150, vw, 220, 'caustics').setOrigin(0, 0).setDepth(2.8).setBlendMode(Phaser.BlendModes.ADD).setAlpha(fam === 'cave' ? 0.05 : 0.16);
    // foreground silhouettes: big, dark, out of focus, scroll faster than the world
    L.fg = [];
    if (!opts.noForeground) {
      var fx = 300 + r() * 400;
      while (fx < worldW * 1.25) {
        var fname = fam === 'keys' ? ['grass', 'staghorn', 'grass', 'fan'][Math.floor(r() * 4)] : (r() < 0.5 ? 'grass' : 'boulder');
        var fdef = PROPS[fname], fs = 1.6 + r() * 0.5, show = 90 + r() * 70;   // how many px poke up into view
        var fimg = scene.add.image(fx, C.HEIGHT + fdef.h * fs - show, propTexture(scene, fname, 0, fam, true)).setOrigin(0.5, 1).setScale(fs / PS).setDepth(14).setAlpha(0.5).setScrollFactor(1.25, 1);
        if (fdef.sway) { fimg.ttSway = fdef.sway * 0.5; fimg.ttPh = r() * 6.28; }
        L.fg.push(fimg);
        fx += 800 + r() * 800;
      }
    }
    // surface: two wave strips sliding against each other
    L.wave = scene.add.tileSprite(0, 0, vw, 72, 'wave').setOrigin(0, 0).setDepth(15);
    L.wave2 = scene.add.tileSprite(0, 0, vw, 72, 'wave').setOrigin(0, 0).setDepth(14.9).setAlpha(0.5).setFlipX(true);
    L.view = view;
    return L;
  }

  // Position the camera-attached layers. vx, vy = top-left of the visible world.
  function placeLayers(L, vx, vy, waterY, t) {
    var C = TT.CFG, x0 = vx - 40, vw = L.view.w + 80;
    L.sky.setPosition(x0, waterY + 4); L.sky.tilePositionX = vx * 0.08 + t * 3;
    L.shore.setPosition(x0, waterY + 3); L.shore.tilePositionX = vx * 0.16;
    L.depth.setPosition(x0, waterY).setDisplaySize(vw, C.HEIGHT - waterY + 40);
    L.far.x = x0; L.far.tilePositionX = vx * 0.3;
    L.mid.x = x0; L.mid.tilePositionX = vx * 0.6;
    L.caustics.x = x0; L.caustics.tilePositionX = vx + t * 14; L.caustics.tilePositionY = t * 5;
    L.wave.setPosition(x0, waterY - 12); L.wave.tilePositionX = vx + t * 26;
    L.wave2.setPosition(x0, waterY - 9); L.wave2.tilePositionX = -(vx - t * 17);
    for (var i = 0; i < L.rays.length; i++) {
      var ray = L.rays[i], span = vw + 300, px = ((ray.ttU * span - vx * 0.25) % span + span) % span;
      ray.setPosition(x0 - 150 + px, waterY + 2);
      ray.setScale(ray.ttW, (C.HEIGHT - waterY) / 512 * 1.05);
      ray.setAlpha((L.fam === 'cave' ? 0.05 : 0.14) * (0.6 + 0.4 * Math.sin(t * 0.7 + ray.ttPh)));
    }
    for (var p = 0; p < L.props.length; p++) { var im = L.props[p]; if (im.ttSway && im.x > vx - 160 && im.x < vx + vw + 160) im.rotation = Math.sin(t * 1.4 + im.ttPh) * im.ttSway; }
    for (var f = 0; f < L.fg.length; f++) { var fi = L.fg[f]; if (fi.ttSway) fi.rotation = Math.sin(t * 1.1 + fi.ttPh) * fi.ttSway; }
  }

  // ---------- in-level scenery ----------
  TT.Scenery = function (scene, level, water) {
    var C = TT.CFG, cam = scene.cameras.main, fam = level.background;
    this.scene = scene; this.level = level; this.water = water;
    var view = this.view = { w: Math.ceil(C.WIDTH / cam.zoom), h: Math.ceil(C.HEIGHT / cam.zoom) };
    var avoid = (level.statics || []).concat(level.coral || []).concat(level.containers || []).map(function (s) { return { x: s.x, w: (s.w || 60) + 30 }; });
    var seed = 0; for (var i = 0; i < level.id.length; i++) seed = seed * 31 + level.id.charCodeAt(i);
    this.L = buildLayers(scene, fam, level.width, view, { seed: seed, avoid: avoid });
    if (level.dark) this.L.sky.setVisible(false);

    // drifting specks ("marine snow") around the camera
    this.snow = scene.add.particles(0, 0, 'dot', {
      lifespan: 6000, speedX: { min: -14, max: 6 }, speedY: { min: 3, max: 16 }, scale: { min: 0.05, max: 0.14 },
      alpha: { start: 0.5, end: 0 }, frequency: 90, tint: level.dark ? 0x8fe9ff : 0xffffff,
      emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(-view.w / 2 - 80, -view.h / 2, view.w + 160, view.h) }
    }).setDepth(13);

    // currents: streaks flowing through each zone
    this.currentFx = (level.currents || []).map(function (c) {
      var sp = Math.sqrt(c.fx * c.fx + c.fy * c.fy), ang = Math.atan2(c.fy, c.fx) * 180 / Math.PI;
      return scene.add.particles(c.x, c.y, 'streak', {
        lifespan: 1500, speed: { min: 260 * sp / 0.3, max: 420 * sp / 0.3 }, angle: ang, rotate: ang, scaleX: { min: 0.8, max: 2 }, scaleY: 0.8,
        alpha: { start: 0.5, end: 0 }, frequency: 45, blendMode: 'ADD',
        emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(-c.w / 2, -c.h / 2, c.w, c.h) }
      }).setDepth(12);
    });

    if (level.dark) {
      this.darkRT = scene.add.renderTexture(0, 0, view.w + 120, view.h + 120).setOrigin(0, 0).setDepth(18);
      this.stamp = scene.make.image({ key: 'light_brush', add: false });
      this.glows = (level.glowSpots || []).map(function (s) {
        return scene.add.image(s.x, s.y, 'light_brush').setBlendMode(Phaser.BlendModes.ADD).setTint(0x4fe9ff).setAlpha(0.35).setScale(0.7).setDepth(18.6);
      });
    }
  };

  TT.Scenery.prototype.update = function (t) {
    var g = this.scene, cam = g.cameras.main, v = cam.worldView;
    placeLayers(this.L, v.x, v.y, this.water.y, t);
    this.snow.setPosition(v.centerX, Math.max(v.centerY, this.water.y + this.view.h / 2));
    if (this.darkRT) {
      var rt = this.darkRT, lit = g.lit;
      rt.setVisible(!lit);
      for (var i = 0; i < this.glows.length; i++) this.glows[i].setScale(0.7 + 0.06 * Math.sin(t * 1.5 + i)).setVisible(!lit);
      if (!lit) {
        rt.setPosition(v.x - 60, v.y - 60); rt.clear(); rt.fill(0x000000, TT.CFG.DARK_ALPHA);
        for (var k = 0; k < g.lights.length; k++) {
          var L = g.lights[k];
          this.stamp.setPosition(L.x - rt.x, L.y - rt.y).setScale((L.r * 2) / 256).setAlpha(L.a === undefined ? 1 : L.a);
          rt.erase(this.stamp);
        }
      }
    }
  };

  // A still backdrop for the menus (same layers, no camera).
  TT.Scenery.backdrop = function (scene, fam, waterY) {
    var C = TT.CFG, L = buildLayers(scene, fam, C.WIDTH, { w: C.WIDTH, h: C.HEIGHT }, { seed: 77, noForeground: true });
    var o = { t: 0 };
    placeLayers(L, 0, 0, waterY, 0);
    scene.events.on('update', function (time, delta) { o.t += delta / 1000; placeLayers(L, o.t * 12, 0, waterY, o.t); });
    scene.events.once('shutdown', function () { scene.events.off('update'); });
    return L;
  };

  // The open-sea current that ends the level once everyone is free.
  TT.Scenery.exitRing = function (scene, x, y) {
    ensureTextures(scene, scene.level.background);
    var ring = scene.add.image(x, y, 'exit_ring').setDepth(7).setBlendMode(Phaser.BlendModes.ADD).setVisible(false);
    var label = scene.add.text(x, y - 96, 'OPEN SEA', { fontFamily: TT.UI.display, fontStyle: '800', fontSize: '20px', color: '#c8fff0', stroke: '#06283a', strokeThickness: 5 }).setOrigin(0.5).setDepth(7).setVisible(false);
    var shown = false;
    return { x: x, y: y, update: function (t, open) {
      if (open && !shown) { shown = true; ring.setVisible(true).setScale(0.2); label.setVisible(true); scene.tweens.add({ targets: ring, scale: 1, duration: 500, ease: 'Back.easeOut' }); scene.fx.ring(x, y, 140, 0x9ff7e0); }
      if (!open) return;
      ring.rotation = t * 1.2; ring.setAlpha(0.75 + 0.25 * Math.sin(t * 3));
      label.y = y - 96 + Math.sin(t * 2) * 4;
      if (Math.random() < 0.25) scene.fx.sparkle(x + (Math.random() - 0.5) * 120, y + (Math.random() - 0.5) * 120);
    } };
  };

  // Hanging nets: a rope up to a buoy bobbing on the surface.
  TT.Scenery.attachRope = function (scene, ent) {
    ensureTextures(scene, scene.level.background);
    ent.rope = scene.add.graphics().setDepth(7.1);
    ent.buoy = scene.add.image(ent.x, 0, 'buoy').setDepth(15.1);
    ent.ropeY = -999;
    var destroy = ent.rope.destroy.bind(ent.rope);
    ent.rope.destroy = function () { ent.buoy.destroy(); destroy(); };
  };
  TT.Scenery.drawRope = function (c, waterY) {
    var top = c.sprite.y - c.h / 2;
    c.buoy.setPosition(c.x, waterY - 6 + Math.sin(c.sprite.scene.clock * 2 + c.x) * 2);
    if (Math.abs(waterY - c.ropeY) < 0.5) return;
    c.ropeY = waterY;
    var g = c.rope; g.clear();
    if (waterY < top) { g.lineStyle(5, 0x3a2f1e, 1); g.lineBetween(c.x, top, c.x, waterY); g.lineStyle(2, 0xb99a62, 1); g.lineBetween(c.x - 1, top, c.x - 1, waterY); }
  };
})();

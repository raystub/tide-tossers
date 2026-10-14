// Tide Tossers v0.2 — procedural, realistic-leaning art drawn with Canvas 2D.
// Every species faces RIGHT. Textures are drawn at 2x and displayed at half scale.
// If assets/manifest.js lists a PNG for a key, BootScene loads it and we skip drawing that key.
window.TT = window.TT || {};

TT.Art = (function () {
  var S = 2; // supersampling

  // ---------- helpers ----------
  function rng(seed) { // mulberry32
    var t = seed >>> 0;
    return function () {
      t += 0x6D2B79F5; var r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }
  function canvas(scene, key, w, h, draw) {
    if (scene.textures.exists(key)) return key;
    var tex = scene.textures.createCanvas(key, Math.ceil(w), Math.ceil(h));
    var ctx = tex.getContext();
    draw(ctx, w, h);
    tex.refresh();
    return key;
  }
  function lin(ctx, x0, y0, x1, y1, stops) {
    var g = ctx.createLinearGradient(x0, y0, x1, y1);
    stops.forEach(function (s) { g.addColorStop(s[0], s[1]); });
    return g;
  }
  function rad(ctx, x, y, r0, r1, stops) {
    var g = ctx.createRadialGradient(x, y, r0, x, y, r1);
    stops.forEach(function (s) { g.addColorStop(s[0], s[1]); });
    return g;
  }
  // Big glossy eyes (bright, game-y look) without cartoon mouths or brows.
  function eye(ctx, x, y, r) {
    r *= 1.4;
    ctx.fillStyle = 'rgba(252,250,238,0.97)';
    ctx.beginPath(); ctx.arc(x, y, r * 1.18, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(10,22,34,0.55)'; ctx.lineWidth = Math.max(1, r * 0.16); ctx.stroke();
    ctx.fillStyle = '#0a0d14';
    ctx.beginPath(); ctx.arc(x + r * 0.1, y, r * 0.86, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.96)';
    ctx.beginPath(); ctx.arc(x + r * 0.32, y - r * 0.32, r * 0.32, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath(); ctx.arc(x - r * 0.2, y + r * 0.34, r * 0.14, 0, Math.PI * 2); ctx.fill();
  }
  function finFill(ctx, color, alpha) {
    ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.fill(); ctx.globalAlpha = 1;
  }
  function finRays(ctx, x0, y0, pts, color, alpha) {
    ctx.strokeStyle = color; ctx.globalAlpha = alpha; ctx.lineWidth = 1.2;
    pts.forEach(function (p) { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(p[0], p[1]); ctx.stroke(); });
    ctx.globalAlpha = 1;
  }

  // Style pass (vibrant, glossy, outlined), applied after drawing:
  //   boosts saturation, adds a top gloss and a soft belly shade, then a dark outline around the silhouette.
  function stylize(ctx, w, h, o) {
    o = o || {};
    var src = document.createElement('canvas'); src.width = w; src.height = h;
    var sc = src.getContext('2d');
    sc.filter = 'saturate(' + (o.sat || 1.45) + ') contrast(1.06) brightness(1.04)';
    sc.drawImage(ctx.canvas, 0, 0);
    sc.filter = 'none';
    if (o.gloss !== false) {
      sc.save(); sc.globalCompositeOperation = 'source-atop';
      var g = sc.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, 'rgba(255,255,255,0.30)'); g.addColorStop(0.36, 'rgba(255,255,255,0.07)');
      g.addColorStop(0.6, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,20,40,0.26)');
      sc.fillStyle = g; sc.fillRect(0, 0, w, h); sc.restore();
    }
    ctx.clearRect(0, 0, w, h);
    var lw = o.outline === undefined ? 3 : o.outline;
    if (lw > 0) {
      var sil = document.createElement('canvas'); sil.width = w; sil.height = h;
      var c2 = sil.getContext('2d');
      c2.drawImage(src, 0, 0); c2.globalCompositeOperation = 'source-in';
      c2.fillStyle = o.color || 'rgba(8,22,36,0.92)'; c2.fillRect(0, 0, w, h);
      for (var k = 0; k < 16; k++) { var ang = k / 16 * Math.PI * 2; ctx.drawImage(sil, Math.cos(ang) * lw, Math.sin(ang) * lw); }
    }
    ctx.drawImage(src, 0, 0);
  }

  // ---------- species ----------
  var species = {};

  // Atlantic blue tang (adult): deep oval body, uniform blue with fine darker lines, pale caudal spine.
  species.tang = function (ctx, w, h) {
    var cx = w * 0.47, cy = h * 0.5;
    // tail
    ctx.beginPath(); ctx.moveTo(w * 0.17, cy); ctx.quadraticCurveTo(w * 0.08, cy - h * 0.28, w * 0.03, cy - h * 0.3);
    ctx.quadraticCurveTo(w * 0.09, cy, w * 0.03, cy + h * 0.3); ctx.quadraticCurveTo(w * 0.08, cy + h * 0.28, w * 0.17, cy);
    ctx.fillStyle = lin(ctx, 0, cy - h * 0.3, 0, cy + h * 0.3, [[0, '#1d3f9e'], [1, '#2a57c4']]); ctx.fill();
    // dorsal + anal fins
    ctx.beginPath(); ctx.moveTo(w * 0.2, cy - h * 0.12);
    ctx.bezierCurveTo(w * 0.3, cy - h * 0.48, w * 0.6, cy - h * 0.5, w * 0.78, cy - h * 0.22);
    ctx.lineTo(w * 0.7, cy - h * 0.18); ctx.closePath(); finFill(ctx, '#2747a8', 0.92);
    ctx.beginPath(); ctx.moveTo(w * 0.2, cy + h * 0.12);
    ctx.bezierCurveTo(w * 0.32, cy + h * 0.46, w * 0.55, cy + h * 0.46, w * 0.68, cy + h * 0.24);
    ctx.lineTo(w * 0.6, cy + h * 0.2); ctx.closePath(); finFill(ctx, '#2747a8', 0.92);
    ctx.strokeStyle = 'rgba(120,200,255,0.55)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(w * 0.22, cy - h * 0.2); ctx.bezierCurveTo(w * 0.32, cy - h * 0.46, w * 0.6, cy - h * 0.48, w * 0.76, cy - h * 0.23); ctx.stroke();
    // body
    ctx.beginPath(); ctx.moveTo(w * 0.17, cy);
    ctx.bezierCurveTo(w * 0.22, cy - h * 0.36, w * 0.66, cy - h * 0.4, w * 0.86, cy - h * 0.06);
    ctx.quadraticCurveTo(w * 0.9, cy + h * 0.02, w * 0.84, cy + h * 0.08);
    ctx.bezierCurveTo(w * 0.66, cy + h * 0.38, w * 0.22, cy + h * 0.34, w * 0.17, cy);
    ctx.fillStyle = lin(ctx, 0, cy - h * 0.38, 0, cy + h * 0.36, [[0, '#142f78'], [0.45, '#2a56b4'], [1, '#5b84c8']]);
    ctx.fill();
    ctx.save(); ctx.clip();
    ctx.strokeStyle = 'rgba(10,25,80,0.35)'; ctx.lineWidth = 1;
    for (var i = -6; i <= 6; i++) { ctx.beginPath(); ctx.moveTo(w * 0.15, cy + i * h * 0.05); ctx.bezierCurveTo(w * 0.4, cy + i * h * 0.055 - 4, w * 0.6, cy + i * h * 0.05 + 3, w * 0.9, cy + i * h * 0.04); ctx.stroke(); }
    ctx.fillStyle = rad(ctx, w * 0.55, cy - h * 0.2, 2, w * 0.4, [[0, 'rgba(160,210,255,0.35)'], [1, 'rgba(160,210,255,0)']]);
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
    // caudal spine (pale scalpel)
    ctx.fillStyle = 'rgba(235,235,215,0.9)'; ctx.beginPath(); ctx.ellipse(w * 0.22, cy, w * 0.03, h * 0.025, 0, 0, Math.PI * 2); ctx.fill();
    // pectoral fin
    ctx.beginPath(); ctx.moveTo(w * 0.62, cy); ctx.quadraticCurveTo(w * 0.5, cy + h * 0.02, w * 0.46, cy + h * 0.14); ctx.quadraticCurveTo(w * 0.56, cy + h * 0.1, w * 0.64, cy + h * 0.04);
    finFill(ctx, '#5f8fe6', 0.6);
    // gill + eye
    ctx.strokeStyle = 'rgba(10,25,80,0.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(w * 0.74, cy - h * 0.02, h * 0.13, -1.1, 1.2); ctx.stroke();
    eye(ctx, w * 0.8, cy - h * 0.08, h * 0.05);
  };

  // Flying fish: slender, deep blue back, silver belly, very long pectoral "wings", forked tail (longer lower lobe).
  species.flyingfish = function (ctx, w, h) {
    var cy = h * 0.55;
    // wing (far side, darker)
    ctx.beginPath(); ctx.moveTo(w * 0.62, cy - h * 0.05); ctx.bezierCurveTo(w * 0.45, cy - h * 0.5, w * 0.2, cy - h * 0.48, w * 0.12, cy - h * 0.4);
    ctx.bezierCurveTo(w * 0.3, cy - h * 0.25, w * 0.45, cy - h * 0.12, w * 0.58, cy); finFill(ctx, '#7f9fb8', 0.5);
    // tail
    ctx.beginPath(); ctx.moveTo(w * 0.2, cy); ctx.lineTo(w * 0.04, cy - h * 0.2); ctx.quadraticCurveTo(w * 0.1, cy, w * 0.0, cy + h * 0.3); ctx.closePath();
    finFill(ctx, '#2c4f86', 0.9);
    // body
    ctx.beginPath(); ctx.moveTo(w * 0.18, cy);
    ctx.bezierCurveTo(w * 0.3, cy - h * 0.13, w * 0.75, cy - h * 0.15, w * 0.95, cy - h * 0.01);
    ctx.bezierCurveTo(w * 0.75, cy + h * 0.12, w * 0.3, cy + h * 0.12, w * 0.18, cy);
    ctx.fillStyle = lin(ctx, 0, cy - h * 0.14, 0, cy + h * 0.12, [[0, '#14306a'], [0.45, '#2b5fa6'], [0.55, '#b7c6d4'], [1, '#eef3f6']]);
    ctx.fill();
    ctx.save(); ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(w * 0.2, cy - h * 0.01, w * 0.75, h * 0.02);
    ctx.restore();
    // near wing with rays
    ctx.beginPath(); ctx.moveTo(w * 0.66, cy - h * 0.02); ctx.bezierCurveTo(w * 0.5, cy - h * 0.6, w * 0.22, cy - h * 0.62, w * 0.1, cy - h * 0.52);
    ctx.bezierCurveTo(w * 0.28, cy - h * 0.32, w * 0.46, cy - h * 0.12, w * 0.62, cy + h * 0.03);
    finFill(ctx, '#c8dbea', 0.55);
    finRays(ctx, w * 0.64, cy, [[w * 0.5, cy - h * 0.55], [w * 0.38, cy - h * 0.58], [w * 0.26, cy - h * 0.57], [w * 0.16, cy - h * 0.52]], '#5b7896', 0.6);
    // pelvic fin
    ctx.beginPath(); ctx.moveTo(w * 0.42, cy + h * 0.06); ctx.quadraticCurveTo(w * 0.32, cy + h * 0.22, w * 0.24, cy + h * 0.24); ctx.quadraticCurveTo(w * 0.34, cy + h * 0.12, w * 0.38, cy + h * 0.06);
    finFill(ctx, '#c8dbea', 0.5);
    eye(ctx, w * 0.86, cy - h * 0.03, h * 0.04);
  };

  // Checkered puffer: tan-olive with dark reticulated pattern, white belly, beak-like mouth.
  species.puffer = function (ctx, w, h) {
    var cy = h * 0.52;
    ctx.beginPath(); ctx.moveTo(w * 0.18, cy); ctx.quadraticCurveTo(w * 0.08, cy - h * 0.2, w * 0.04, cy - h * 0.2); ctx.quadraticCurveTo(w * 0.07, cy, w * 0.04, cy + h * 0.2); ctx.quadraticCurveTo(w * 0.08, cy + h * 0.2, w * 0.18, cy);
    finFill(ctx, '#8a7a4c', 0.85);
    ctx.beginPath(); ctx.moveTo(w * 0.17, cy);
    ctx.bezierCurveTo(w * 0.25, cy - h * 0.34, w * 0.75, cy - h * 0.4, w * 0.9, cy - h * 0.06);
    ctx.quadraticCurveTo(w * 0.94, cy + h * 0.02, w * 0.88, cy + h * 0.1);
    ctx.bezierCurveTo(w * 0.72, cy + h * 0.38, w * 0.26, cy + h * 0.3, w * 0.17, cy);
    ctx.fillStyle = lin(ctx, 0, cy - h * 0.38, 0, cy + h * 0.34, [[0, '#6f6b3a'], [0.5, '#a39a62'], [0.62, '#e8e2cc'], [1, '#f7f4ea']]);
    ctx.fill();
    ctx.save(); ctx.clip();
    var r = rng(7); ctx.strokeStyle = 'rgba(40,35,20,0.6)'; ctx.lineWidth = 1.6;
    for (var x = w * 0.2; x < w * 0.88; x += w * 0.06) for (var y = cy - h * 0.36; y < cy + h * 0.02; y += h * 0.09) {
      ctx.beginPath(); ctx.rect(x + r() * 3, y + r() * 3, w * 0.05, h * 0.075); ctx.stroke();
    }
    ctx.restore();
    ctx.beginPath(); ctx.moveTo(w * 0.42, cy - h * 0.28); ctx.quadraticCurveTo(w * 0.35, cy - h * 0.42, w * 0.3, cy - h * 0.38); ctx.quadraticCurveTo(w * 0.33, cy - h * 0.3, w * 0.36, cy - h * 0.25); finFill(ctx, '#8a7a4c', 0.8);
    ctx.beginPath(); ctx.moveTo(w * 0.68, cy - h * 0.02); ctx.quadraticCurveTo(w * 0.6, cy + h * 0.06, w * 0.6, cy + h * 0.14); ctx.quadraticCurveTo(w * 0.66, cy + h * 0.08, w * 0.7, cy + h * 0.04); finFill(ctx, '#c9b98a', 0.7);
    ctx.fillStyle = '#d9cfb0'; ctx.beginPath(); ctx.ellipse(w * 0.915, cy + h * 0.03, w * 0.02, h * 0.035, 0, 0, Math.PI * 2); ctx.fill();
    eye(ctx, w * 0.78, cy - h * 0.12, h * 0.055);
  };
  species.puffer_inflated = function (ctx, w, h) {
    var cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.42;
    var r = rng(11);
    ctx.strokeStyle = 'rgba(120,105,60,0.9)'; ctx.lineWidth = 2;
    for (var i = 0; i < 46; i++) { var a = r() * Math.PI * 2; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * R * 0.95, cy + Math.sin(a) * R * 0.95); ctx.lineTo(cx + Math.cos(a) * R * 1.13, cy + Math.sin(a) * R * 1.13); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = lin(ctx, 0, cy - R, 0, cy + R, [[0, '#6f6b3a'], [0.45, '#a39a62'], [0.6, '#ece6d2'], [1, '#faf8f0']]); ctx.fill();
    ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(40,35,20,0.5)'; ctx.lineWidth = 1.6;
    for (var x = cx - R; x < cx + R; x += R * 0.22) for (var y = cy - R; y < cy + R * 0.1; y += R * 0.2) { ctx.beginPath(); ctx.rect(x + r() * 4, y + r() * 4, R * 0.18, R * 0.16); ctx.stroke(); }
    ctx.fillStyle = rad(ctx, cx - R * 0.3, cy - R * 0.4, 1, R, [[0, 'rgba(255,255,230,0.3)'], [1, 'rgba(255,255,230,0)']]); ctx.fillRect(0, 0, w, h);
    ctx.restore();
    ctx.beginPath(); ctx.moveTo(cx - R * 0.95, cy); ctx.lineTo(cx - R * 1.3, cy - R * 0.25); ctx.lineTo(cx - R * 1.25, cy + R * 0.25); ctx.closePath(); finFill(ctx, '#8a7a4c', 0.85);
    eye(ctx, cx + R * 0.55, cy - R * 0.3, R * 0.11);
  };

  // Pistol (snapping) shrimp: translucent tan-orange body, one oversized claw, long antennae.
  species.pistolshrimp = function (ctx, w, h) {
    var cy = h * 0.58;
    ctx.strokeStyle = 'rgba(180,120,80,0.8)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(w * 0.78, cy - h * 0.12); ctx.bezierCurveTo(w * 0.9, cy - h * 0.5, w * 0.98, cy - h * 0.45, w * 1.0, cy - h * 0.55); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(w * 0.78, cy - h * 0.1); ctx.bezierCurveTo(w * 0.85, cy - h * 0.35, w * 0.95, cy - h * 0.25, w * 0.99, cy - h * 0.32); ctx.stroke();
    // legs
    for (var i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(w * (0.4 + i * 0.08), cy + h * 0.1); ctx.lineTo(w * (0.36 + i * 0.08), cy + h * 0.3); ctx.stroke(); }
    // tail fan
    ctx.beginPath(); ctx.moveTo(w * 0.16, cy); ctx.lineTo(w * 0.04, cy - h * 0.12); ctx.lineTo(w * 0.02, cy + h * 0.16); ctx.closePath(); finFill(ctx, '#d58e5c', 0.75);
    // segmented body
    ctx.beginPath(); ctx.moveTo(w * 0.15, cy);
    ctx.bezierCurveTo(w * 0.2, cy - h * 0.2, w * 0.6, cy - h * 0.24, w * 0.8, cy - h * 0.1);
    ctx.quadraticCurveTo(w * 0.84, cy, w * 0.78, cy + h * 0.08);
    ctx.bezierCurveTo(w * 0.6, cy + h * 0.16, w * 0.22, cy + h * 0.14, w * 0.15, cy);
    ctx.fillStyle = lin(ctx, 0, cy - h * 0.22, 0, cy + h * 0.14, [[0, 'rgba(196,120,74,0.95)'], [0.6, 'rgba(232,170,120,0.85)'], [1, 'rgba(245,215,180,0.8)']]);
    ctx.fill();
    ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(120,60,30,0.4)'; ctx.lineWidth = 1.2;
    for (var s = 0; s < 6; s++) { ctx.beginPath(); ctx.moveTo(w * (0.2 + s * 0.07), cy - h * 0.25); ctx.lineTo(w * (0.22 + s * 0.07), cy + h * 0.2); ctx.stroke(); }
    ctx.restore();
    // big claw (snapping claw)
    ctx.beginPath(); ctx.moveTo(w * 0.72, cy + h * 0.02);
    ctx.bezierCurveTo(w * 0.8, cy + h * 0.06, w * 0.95, cy - h * 0.02, w * 0.98, cy + h * 0.14);
    ctx.bezierCurveTo(w * 0.97, cy + h * 0.32, w * 0.78, cy + h * 0.34, w * 0.7, cy + h * 0.2);
    ctx.closePath();
    ctx.fillStyle = lin(ctx, w * 0.7, 0, w * 0.98, 0, [[0, '#c7703f'], [1, '#e69a63']]); ctx.fill();
    ctx.strokeStyle = 'rgba(100,45,20,0.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(w * 0.86, cy + h * 0.1); ctx.lineTo(w * 0.97, cy + h * 0.16); ctx.stroke();
    eye(ctx, w * 0.76, cy - h * 0.1, h * 0.035);
  };

  // Loggerhead: reddish-brown domed carapace with scutes, large yellow-brown head, long front flipper.
  species.loggerhead = function (ctx, w, h) {
    var cy = h * 0.52;
    // rear flipper
    ctx.beginPath(); ctx.ellipse(w * 0.2, cy + h * 0.14, w * 0.09, h * 0.06, 0.5, 0, Math.PI * 2); ctx.fillStyle = '#9c7a4a'; ctx.fill();
    // front flipper (far)
    ctx.beginPath(); ctx.moveTo(w * 0.62, cy + h * 0.05); ctx.bezierCurveTo(w * 0.55, cy + h * 0.3, w * 0.4, cy + h * 0.42, w * 0.3, cy + h * 0.44); ctx.bezierCurveTo(w * 0.42, cy + h * 0.32, w * 0.52, cy + h * 0.2, w * 0.56, cy + h * 0.06);
    ctx.fillStyle = '#8c6a3c'; ctx.fill();
    // head
    ctx.beginPath(); ctx.ellipse(w * 0.83, cy - h * 0.02, w * 0.12, h * 0.13, 0.1, 0, Math.PI * 2);
    ctx.fillStyle = lin(ctx, 0, cy - h * 0.15, 0, cy + h * 0.12, [[0, '#a8743c'], [0.6, '#c99b5c'], [1, '#e8cf9c']]); ctx.fill();
    ctx.strokeStyle = 'rgba(80,45,15,0.5)'; ctx.lineWidth = 1.3;
    [[0.8, -0.08], [0.86, -0.06], [0.82, 0.0], [0.77, -0.02]].forEach(function (p) { ctx.beginPath(); ctx.rect(w * p[0], cy + h * p[1], w * 0.04, h * 0.05); ctx.stroke(); });
    ctx.beginPath(); ctx.moveTo(w * 0.9, cy + h * 0.06); ctx.lineTo(w * 0.95, cy + h * 0.02); ctx.stroke();
    // carapace
    ctx.beginPath(); ctx.moveTo(w * 0.1, cy + h * 0.08);
    ctx.bezierCurveTo(w * 0.14, cy - h * 0.42, w * 0.62, cy - h * 0.46, w * 0.74, cy + h * 0.04);
    ctx.quadraticCurveTo(w * 0.42, cy + h * 0.16, w * 0.1, cy + h * 0.08);
    ctx.fillStyle = lin(ctx, 0, cy - h * 0.42, 0, cy + h * 0.12, [[0, '#6e3a1c'], [0.5, '#9a5528'], [1, '#b8763e']]); ctx.fill();
    ctx.save(); ctx.clip();
    ctx.strokeStyle = 'rgba(55,25,8,0.55)'; ctx.lineWidth = 2;
    [[0.24, -0.2], [0.36, -0.28], [0.5, -0.27], [0.62, -0.16]].forEach(function (p) { ctx.beginPath(); ctx.ellipse(w * p[0], cy + h * p[1], w * 0.07, h * 0.12, 0, 0, Math.PI * 2); ctx.stroke(); });
    ctx.fillStyle = rad(ctx, w * 0.4, cy - h * 0.3, 2, w * 0.3, [[0, 'rgba(255,220,170,0.25)'], [1, 'rgba(255,220,170,0)']]); ctx.fillRect(0, 0, w, h);
    ctx.restore();
    // plastron edge
    ctx.fillStyle = '#e2c48c'; ctx.beginPath(); ctx.moveTo(w * 0.14, cy + h * 0.09); ctx.quadraticCurveTo(w * 0.42, cy + h * 0.2, w * 0.72, cy + h * 0.06); ctx.quadraticCurveTo(w * 0.42, cy + h * 0.14, w * 0.14, cy + h * 0.09); ctx.fill();
    // near front flipper
    ctx.beginPath(); ctx.moveTo(w * 0.66, cy + h * 0.04); ctx.bezierCurveTo(w * 0.6, cy + h * 0.34, w * 0.42, cy + h * 0.48, w * 0.28, cy + h * 0.5); ctx.bezierCurveTo(w * 0.44, cy + h * 0.36, w * 0.56, cy + h * 0.2, w * 0.6, cy + h * 0.05);
    ctx.fillStyle = lin(ctx, 0, cy, 0, cy + h * 0.5, [[0, '#a07444'], [1, '#c99b5c']]); ctx.fill();
    eye(ctx, w * 0.87, cy - h * 0.05, h * 0.035);
  };

  // Swordfish: long flat bill, dark bronze-purple back, silver sides, tall crescent dorsal and tail.
  species.swordfish = function (ctx, w, h) {
    var cy = h * 0.56;
    ctx.beginPath(); ctx.moveTo(w * 0.12, cy); ctx.quadraticCurveTo(w * 0.06, cy - h * 0.2, w * 0.0, cy - h * 0.42); ctx.quadraticCurveTo(w * 0.06, cy - h * 0.15, w * 0.08, cy);
    ctx.quadraticCurveTo(w * 0.06, cy + h * 0.15, w * 0.0, cy + h * 0.4); ctx.quadraticCurveTo(w * 0.06, cy + h * 0.2, w * 0.12, cy); finFill(ctx, '#2c2a40', 0.95);
    ctx.beginPath(); ctx.moveTo(w * 0.5, cy - h * 0.1); ctx.quadraticCurveTo(w * 0.47, cy - h * 0.48, w * 0.42, cy - h * 0.5); ctx.quadraticCurveTo(w * 0.44, cy - h * 0.2, w * 0.38, cy - h * 0.1); finFill(ctx, '#2a2840', 0.95);
    // bill
    ctx.beginPath(); ctx.moveTo(w * 0.62, cy - h * 0.03); ctx.lineTo(w * 1.0, cy + h * 0.0); ctx.lineTo(w * 0.62, cy + h * 0.04); ctx.closePath();
    ctx.fillStyle = lin(ctx, 0, cy - h * 0.03, 0, cy + h * 0.04, [[0, '#3a3650'], [1, '#8c8aa0']]); ctx.fill();
    // body
    ctx.beginPath(); ctx.moveTo(w * 0.1, cy);
    ctx.bezierCurveTo(w * 0.2, cy - h * 0.12, w * 0.5, cy - h * 0.16, w * 0.66, cy - h * 0.04);
    ctx.lineTo(w * 0.66, cy + h * 0.05);
    ctx.bezierCurveTo(w * 0.5, cy + h * 0.16, w * 0.2, cy + h * 0.1, w * 0.1, cy);
    ctx.fillStyle = lin(ctx, 0, cy - h * 0.16, 0, cy + h * 0.14, [[0, '#2a2338'], [0.4, '#4b4566'], [0.6, '#aeb4c2'], [1, '#e2e6ec']]);
    ctx.fill();
    ctx.save(); ctx.clip(); ctx.fillStyle = 'rgba(180,140,200,0.18)'; ctx.fillRect(0, cy - h * 0.1, w, h * 0.05); ctx.restore();
    ctx.beginPath(); ctx.moveTo(w * 0.56, cy + h * 0.04); ctx.quadraticCurveTo(w * 0.48, cy + h * 0.2, w * 0.4, cy + h * 0.28); ctx.quadraticCurveTo(w * 0.5, cy + h * 0.14, w * 0.52, cy + h * 0.05); finFill(ctx, '#4b4566', 0.85);
    eye(ctx, w * 0.6, cy - h * 0.02, h * 0.045);
  };

  // Scalloped hammerhead: grey-bronze back, pale belly, cephalofoil edge, tall first dorsal, heterocercal tail.
  species.hammerhead = function (ctx, w, h) {
    var cy = h * 0.58;
    ctx.beginPath(); ctx.moveTo(w * 0.15, cy - h * 0.02); ctx.quadraticCurveTo(w * 0.08, cy - h * 0.25, w * 0.0, cy - h * 0.45); ctx.quadraticCurveTo(w * 0.05, cy - h * 0.15, w * 0.06, cy);
    ctx.quadraticCurveTo(w * 0.06, cy + h * 0.08, w * 0.03, cy + h * 0.2); ctx.quadraticCurveTo(w * 0.1, cy + h * 0.06, w * 0.15, cy + h * 0.03); finFill(ctx, '#5d6464', 0.95);
    ctx.beginPath(); ctx.moveTo(w * 0.55, cy - h * 0.13); ctx.quadraticCurveTo(w * 0.5, cy - h * 0.55, w * 0.42, cy - h * 0.58); ctx.quadraticCurveTo(w * 0.46, cy - h * 0.3, w * 0.4, cy - h * 0.13); finFill(ctx, '#5b6260', 0.98);
    ctx.beginPath(); ctx.moveTo(w * 0.27, cy - h * 0.08); ctx.lineTo(w * 0.23, cy - h * 0.2); ctx.lineTo(w * 0.21, cy - h * 0.07); finFill(ctx, '#5b6260', 0.95);
    // body
    ctx.beginPath(); ctx.moveTo(w * 0.12, cy);
    ctx.bezierCurveTo(w * 0.3, cy - h * 0.18, w * 0.7, cy - h * 0.2, w * 0.86, cy - h * 0.08);
    ctx.lineTo(w * 0.86, cy + h * 0.06);
    ctx.bezierCurveTo(w * 0.7, cy + h * 0.16, w * 0.3, cy + h * 0.12, w * 0.12, cy + h * 0.02);
    ctx.fillStyle = lin(ctx, 0, cy - h * 0.2, 0, cy + h * 0.15, [[0, '#4e5552'], [0.45, '#7b8078'], [0.62, '#cfd2cc'], [1, '#eeeee8']]);
    ctx.fill();
    // cephalofoil (hammer) seen slightly from the side: flat wide head edge
    ctx.beginPath(); ctx.moveTo(w * 0.8, cy - h * 0.1); ctx.lineTo(w * 0.99, cy - h * 0.06); ctx.quadraticCurveTo(w * 1.0, cy - h * 0.0, w * 0.99, cy + h * 0.05); ctx.lineTo(w * 0.82, cy + h * 0.07); ctx.closePath();
    ctx.fillStyle = lin(ctx, 0, cy - h * 0.1, 0, cy + h * 0.07, [[0, '#575e5a'], [0.6, '#8d918a'], [1, '#d6d8d2']]); ctx.fill();
    ctx.strokeStyle = 'rgba(40,45,42,0.5)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(w * 0.93, cy - h * 0.065); ctx.lineTo(w * 0.93, cy + h * 0.055); ctx.stroke();
    for (var g = 0; g < 5; g++) { ctx.beginPath(); ctx.moveTo(w * (0.72 + g * 0.018), cy - h * 0.05); ctx.lineTo(w * (0.715 + g * 0.018), cy + h * 0.05); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(w * 0.66, cy + h * 0.07); ctx.quadraticCurveTo(w * 0.58, cy + h * 0.32, w * 0.5, cy + h * 0.36); ctx.quadraticCurveTo(w * 0.56, cy + h * 0.18, w * 0.6, cy + h * 0.08); finFill(ctx, '#6b716b', 0.95);
    eye(ctx, w * 0.975, cy - h * 0.0, h * 0.03);
  };

  // Sea turtle hatchling: dark brown-black, big front flippers.
  species.hatchling = function (ctx, w, h) {
    var cy = h * 0.55;
    ctx.fillStyle = '#2c241c';
    ctx.beginPath(); ctx.moveTo(w * 0.6, cy); ctx.bezierCurveTo(w * 0.55, cy + h * 0.3, w * 0.35, cy + h * 0.42, w * 0.22, cy + h * 0.42); ctx.bezierCurveTo(w * 0.38, cy + h * 0.3, w * 0.5, cy + h * 0.15, w * 0.52, cy); ctx.fill();
    ctx.beginPath(); ctx.ellipse(w * 0.82, cy - h * 0.04, w * 0.13, h * 0.13, 0, 0, Math.PI * 2); ctx.fillStyle = '#3a3026'; ctx.fill();
    ctx.beginPath(); ctx.ellipse(w * 0.45, cy - h * 0.05, w * 0.32, h * 0.25, 0, 0, Math.PI * 2);
    ctx.fillStyle = lin(ctx, 0, cy - h * 0.3, 0, cy + h * 0.2, [[0, '#2a2018'], [1, '#5a4836']]); ctx.fill();
    ctx.strokeStyle = 'rgba(120,100,70,0.6)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(w * 0.18, cy - h * 0.05); ctx.lineTo(w * 0.72, cy - h * 0.05); ctx.stroke();
    eye(ctx, w * 0.88, cy - h * 0.07, h * 0.04);
  };

  // Seahorse: upright, curled tail, long snout, bony ridges; yellow-brown.
  species.seahorse = function (ctx, w, h) {
    ctx.lineCap = 'round';
    ctx.strokeStyle = lin(ctx, 0, 0, 0, h, [[0, '#c9952f'], [1, '#8a5d1a']]);
    ctx.lineWidth = w * 0.2;
    ctx.beginPath(); ctx.moveTo(w * 0.5, h * 0.22); ctx.bezierCurveTo(w * 0.72, h * 0.35, w * 0.7, h * 0.6, w * 0.48, h * 0.72);
    ctx.bezierCurveTo(w * 0.32, h * 0.82, w * 0.38, h * 0.95, w * 0.52, h * 0.92); ctx.stroke();
    ctx.lineWidth = w * 0.06; ctx.beginPath(); ctx.arc(w * 0.47, h * 0.9, w * 0.07, 0, Math.PI * 1.6); ctx.stroke();
    ctx.fillStyle = '#c08a2a'; ctx.beginPath(); ctx.ellipse(w * 0.5, h * 0.15, w * 0.14, h * 0.08, 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(w * 0.58, h * 0.14); ctx.lineTo(w * 0.92, h * 0.2); ctx.lineTo(w * 0.9, h * 0.24); ctx.lineTo(w * 0.58, h * 0.2); ctx.fill();
    ctx.strokeStyle = 'rgba(90,55,10,0.6)'; ctx.lineWidth = 1.2;
    for (var i = 0; i < 9; i++) { var y = h * (0.3 + i * 0.05); ctx.beginPath(); ctx.moveTo(w * 0.42, y); ctx.lineTo(w * 0.66, y + 2); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(w * 0.36, h * 0.4); ctx.quadraticCurveTo(w * 0.2, h * 0.45, w * 0.3, h * 0.55); finFill(ctx, '#e8c070', 0.6);
    eye(ctx, w * 0.55, h * 0.14, w * 0.035);
  };

  // A single small silvery fish (sardine-like) for schools.
  species.smallfish = function (ctx, w, h) {
    var cy = h / 2;
    ctx.beginPath(); ctx.moveTo(w * 0.18, cy); ctx.lineTo(w * 0.02, cy - h * 0.3); ctx.lineTo(w * 0.06, cy); ctx.lineTo(w * 0.02, cy + h * 0.3); ctx.closePath(); finFill(ctx, '#5a7790', 0.85);
    ctx.beginPath(); ctx.moveTo(w * 0.16, cy); ctx.bezierCurveTo(w * 0.3, cy - h * 0.3, w * 0.8, cy - h * 0.32, w * 0.98, cy); ctx.bezierCurveTo(w * 0.8, cy + h * 0.28, w * 0.3, cy + h * 0.26, w * 0.16, cy);
    ctx.fillStyle = lin(ctx, 0, cy - h * 0.3, 0, cy + h * 0.3, [[0, '#2f5b7a'], [0.45, '#86a6bc'], [0.55, '#dfe9ef'], [1, '#f6f9fb']]); ctx.fill();
    ctx.fillStyle = 'rgba(30,40,60,0.6)'; ctx.beginPath(); ctx.arc(w * 0.62, cy - h * 0.05, h * 0.05, 0, 7); ctx.fill();
    eye(ctx, w * 0.86, cy - h * 0.04, h * 0.09);
  };

  // A trapped school (cluster of small fish) used while still tangled.
  species.fishschool = function (ctx, w, h) {
    var r = rng(5);
    for (var i = 0; i < 9; i++) {
      var fw = w * 0.42, fh = h * 0.16;
      var x = r() * (w - fw), y = r() * (h - fh);
      ctx.save(); ctx.translate(x + fw / 2, y + fh / 2); ctx.rotate((r() - 0.5) * 0.6); ctx.translate(-fw / 2, -fh / 2);
      species.smallfish(ctx, fw, fh); ctx.restore();
    }
  };

  // Lionfish (invasive in Florida): red-brown and white vertical stripes, long fan pectorals, spines.
  species.lionfish = function (ctx, w, h) {
    var cy = h * 0.55;
    ctx.strokeStyle = 'rgba(140,50,30,0.9)'; ctx.lineWidth = 1.6;
    for (var i = 0; i < 12; i++) { var x = w * (0.3 + i * 0.04); ctx.beginPath(); ctx.moveTo(x, cy - h * 0.12); ctx.lineTo(x - w * 0.04 + i * 2, cy - h * (0.42 + (i % 3) * 0.05)); ctx.stroke(); }
    // fan pectorals
    ctx.beginPath(); ctx.moveTo(w * 0.62, cy); ctx.bezierCurveTo(w * 0.4, cy + h * 0.1, w * 0.2, cy + h * 0.45, w * 0.3, cy + h * 0.48);
    ctx.bezierCurveTo(w * 0.42, cy + h * 0.42, w * 0.56, cy + h * 0.2, w * 0.66, cy + h * 0.05);
    ctx.fillStyle = 'rgba(220,170,150,0.55)'; ctx.fill();
    finRays(ctx, w * 0.63, cy + h * 0.02, [[w * 0.28, cy + h * 0.46], [w * 0.34, cy + h * 0.47], [w * 0.4, cy + h * 0.44], [w * 0.47, cy + h * 0.38], [w * 0.53, cy + h * 0.3]], '#8c3a24', 0.8);
    ctx.beginPath(); ctx.moveTo(w * 0.15, cy); ctx.lineTo(w * 0.02, cy - h * 0.18); ctx.lineTo(w * 0.02, cy + h * 0.18); ctx.closePath(); finFill(ctx, 'rgba(220,170,150,0.7)', 0.8);
    ctx.beginPath(); ctx.moveTo(w * 0.14, cy);
    ctx.bezierCurveTo(w * 0.25, cy - h * 0.2, w * 0.7, cy - h * 0.22, w * 0.88, cy - h * 0.04);
    ctx.quadraticCurveTo(w * 0.9, cy + h * 0.04, w * 0.84, cy + h * 0.08);
    ctx.bezierCurveTo(w * 0.65, cy + h * 0.18, w * 0.25, cy + h * 0.14, w * 0.14, cy);
    ctx.fillStyle = '#f1e4d8'; ctx.fill();
    ctx.save(); ctx.clip();
    for (var s = 0; s < 9; s++) { ctx.fillStyle = s % 2 ? 'rgba(150,45,25,0.9)' : 'rgba(110,30,20,0.85)'; ctx.fillRect(w * (0.16 + s * 0.08), 0, w * 0.035, h); }
    ctx.restore();
    ctx.strokeStyle = 'rgba(140,50,30,0.8)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(w * 0.8, cy - h * 0.12); ctx.lineTo(w * 0.84, cy - h * 0.24); ctx.stroke();
    eye(ctx, w * 0.8, cy - h * 0.04, h * 0.04);
  };

  // ---------- junk materials (stretched to object size) ----------
  var materials = {};
  materials.plastic = function (ctx, w, h) {
    ctx.fillStyle = lin(ctx, 0, 0, 0, h, [[0, '#7fa7c2'], [1, '#5a86a6']]); ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(230,240,245,0.35)'; ctx.fillRect(0, 0, w, h * 0.12);
    ctx.fillStyle = 'rgba(30,50,70,0.55)';
    for (var x = 8; x < w - 8; x += 16) for (var y = 14; y < h - 8; y += 16) ctx.fillRect(x, y, 9, 9);
    ctx.strokeStyle = 'rgba(30,50,70,0.6)'; ctx.lineWidth = 3; ctx.strokeRect(1.5, 1.5, w - 3, h - 3);
    ctx.fillStyle = 'rgba(120,130,80,0.25)'; ctx.fillRect(0, h * 0.75, w, h * 0.25); // algae film
  };
  materials.glass = function (ctx, w, h) {
    ctx.beginPath(); ctx.moveTo(w * 0.36, 0); ctx.lineTo(w * 0.64, 0); ctx.lineTo(w * 0.64, h * 0.22);
    ctx.quadraticCurveTo(w * 1.0, h * 0.3, w * 1.0, h * 0.45); ctx.lineTo(w * 1.0, h); ctx.lineTo(0, h); ctx.lineTo(0, h * 0.45);
    ctx.quadraticCurveTo(0, h * 0.3, w * 0.36, h * 0.22); ctx.closePath();
    ctx.fillStyle = lin(ctx, 0, 0, w, 0, [[0, 'rgba(40,90,40,0.85)'], [0.35, 'rgba(120,170,100,0.7)'], [1, 'rgba(30,70,35,0.9)']]); ctx.fill();
    ctx.strokeStyle = 'rgba(220,255,220,0.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(w * 0.25, h * 0.4); ctx.lineTo(w * 0.25, h * 0.92); ctx.stroke();
    ctx.fillStyle = 'rgba(200,190,160,0.5)'; ctx.fillRect(w * 0.08, h * 0.55, w * 0.84, h * 0.2); // faded label
  };
  materials.wood = function (ctx, w, h) {
    ctx.fillStyle = lin(ctx, 0, 0, 0, h, [[0, '#8d8574'], [1, '#6f6758']]); ctx.fillRect(0, 0, w, h);
    var r = rng(3); ctx.strokeStyle = 'rgba(50,45,35,0.45)'; ctx.lineWidth = 1.2;
    for (var i = 0; i < 10; i++) { var y = r() * h; ctx.beginPath(); ctx.moveTo(0, y); ctx.bezierCurveTo(w * 0.3, y + r() * 6 - 3, w * 0.7, y + r() * 6 - 3, w, y + r() * 4 - 2); ctx.stroke(); }
    ctx.fillStyle = 'rgba(40,35,25,0.6)'; ctx.beginPath(); ctx.ellipse(w * 0.6, h * 0.5, 5, 3, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(40,35,25,0.6)'; ctx.lineWidth = 2; ctx.strokeRect(1, 1, w - 2, h - 2);
  };
  materials.tin = function (ctx, w, h) {
    ctx.fillStyle = lin(ctx, 0, 0, w, 0, [[0, '#4a2a1a'], [0.3, '#9a5a32'], [0.55, '#b87444'], [1, '#3e2416']]); ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(40,20,10,0.7)'; ctx.lineWidth = 3;
    [0.06, 0.33, 0.66, 0.94].forEach(function (f) { ctx.beginPath(); ctx.moveTo(0, h * f); ctx.lineTo(w, h * f); ctx.stroke(); });
    var r = rng(9); ctx.fillStyle = 'rgba(70,35,15,0.6)';
    for (var i = 0; i < 25; i++) { ctx.beginPath(); ctx.arc(r() * w, r() * h, 1 + r() * 4, 0, 7); ctx.fill(); }
  };
  materials.concrete = function (ctx, w, h) {
    ctx.fillStyle = lin(ctx, 0, 0, 0, h, [[0, '#9a9890'], [1, '#77756e']]); ctx.fillRect(0, 0, w, h);
    var r = rng(4); ctx.fillStyle = 'rgba(50,50,45,0.35)';
    for (var i = 0; i < 70; i++) ctx.fillRect(r() * w, r() * h, 2, 2);
    ctx.fillStyle = 'rgba(45,45,40,0.75)'; ctx.fillRect(w * 0.12, h * 0.25, w * 0.3, h * 0.5); ctx.fillRect(w * 0.58, h * 0.25, w * 0.3, h * 0.5);
    ctx.fillStyle = 'rgba(80,110,60,0.35)'; ctx.fillRect(0, 0, w, h * 0.15);
  };

  // ---------- containers, coral, scenery ----------
  function drawNet(ctx, w, h) {
    var r = rng(21);
    ctx.strokeStyle = 'rgba(90,110,85,0.95)'; ctx.lineWidth = 2.4;
    var step = 18;
    for (var d = -h; d < w + h; d += step) {
      ctx.beginPath(); ctx.moveTo(d, 0);
      for (var y = 0; y <= h; y += 12) ctx.lineTo(d + y + (r() - 0.5) * 3, y);
      ctx.stroke();
      ctx.beginPath(); ctx.moveTo(d, h);
      for (var y2 = h; y2 >= 0; y2 -= 12) ctx.lineTo(d + (h - y2) + (r() - 0.5) * 3, y2);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(60,75,50,0.9)'; ctx.lineWidth = 4; ctx.strokeRect(2, 2, w - 4, h - 4);
    ctx.fillStyle = 'rgba(110,130,70,0.35)';
    for (var i = 0; i < 18; i++) { ctx.beginPath(); ctx.ellipse(r() * w, r() * h, 3 + r() * 6, 2 + r() * 3, r() * 3, 0, 7); ctx.fill(); }
    // frayed ends
    ctx.strokeStyle = 'rgba(90,110,85,0.8)'; ctx.lineWidth = 1.5;
    for (var j = 0; j < 8; j++) { var x = r() * w; ctx.beginPath(); ctx.moveTo(x, h); ctx.lineTo(x + (r() - 0.5) * 10, h + 8); ctx.stroke(); }
  }
  function drawTrap(ctx, w, h) {
    // Florida stone-crab style trap: wooden slats over a frame, weighted base, rope bridle.
    ctx.fillStyle = 'rgba(20,25,20,0.25)'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#7a705c';
    var slats = 6;
    for (var i = 0; i < slats; i++) {
      var x = 4 + i * (w - 8) / slats;
      ctx.fillStyle = i % 2 ? '#7d735f' : '#6c6350'; ctx.fillRect(x, 4, (w - 8) / slats * 0.55, h - 16);
    }
    ctx.fillStyle = '#5b5446'; ctx.fillRect(0, 0, w, 7); ctx.fillRect(0, 0, 6, h); ctx.fillRect(w - 6, 0, 6, h);
    ctx.fillStyle = lin(ctx, 0, h - 14, 0, h, [[0, '#8f8d86'], [1, '#6a6862']]); ctx.fillRect(0, h - 14, w, 14);
    ctx.strokeStyle = 'rgba(120,100,60,0.9)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(6, 2); ctx.quadraticCurveTo(w / 2, -6, w - 6, 2); ctx.stroke();
    ctx.fillStyle = 'rgba(100,120,70,0.35)'; ctx.fillRect(0, 0, w, h * 0.3);
    ctx.fillStyle = '#4a4436'; ctx.fillRect(w * 0.42, h * 0.08, w * 0.16, 6); // latch
  }
  function drawCoral(ctx, w, h, variant) {
    var r = rng(31 + variant);
    if (variant % 2 === 0) { // brain coral dome
      ctx.beginPath(); ctx.ellipse(w / 2, h, w * 0.48, h * 0.95, 0, Math.PI, 0);
      ctx.fillStyle = lin(ctx, 0, 0, 0, h, [[0, '#e3d25a'], [1, '#9c8a2c']]); ctx.fill();
      ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(90,75,30,0.6)'; ctx.lineWidth = 2;
      for (var i = 0; i < 14; i++) { ctx.beginPath(); var y = h * (0.15 + r() * 0.85); ctx.moveTo(0, y); for (var x = 0; x < w; x += 8) ctx.lineTo(x, y + Math.sin(x * 0.25 + i) * 4); ctx.stroke(); }
      ctx.restore();
    } else { // branching (elkhorn-like) coral
      ctx.strokeStyle = '#ff8a5c'; ctx.lineCap = 'round';
      function branch(x, y, len, ang, wd) {
        if (len < 6) return;
        var x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
        ctx.lineWidth = wd; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke();
        branch(x2, y2, len * 0.72, ang - 0.45 - r() * 0.2, wd * 0.72);
        branch(x2, y2, len * 0.72, ang + 0.45 + r() * 0.2, wd * 0.72);
      }
      branch(w / 2, h, h * 0.42, -Math.PI / 2, 10);
      ctx.fillStyle = 'rgba(255,230,200,0.8)';
      for (var k = 0; k < 30; k++) { ctx.beginPath(); ctx.arc(r() * w, r() * h * 0.8, 1.5, 0, 7); ctx.fill(); }
    }
  }
  function drawStatic(ctx, w, h, look, seed) {
    var r = rng(seed);
    if (look === 'root') {
      // red-mangrove prop roots: arching roots fanning out from a trunk above the water
      var cx = w / 2;
      ctx.lineCap = 'round';
      for (var i = 0; i < 9; i++) {
        var spread = (i / 8 - 0.5) * w * 0.9, startY = h * (0.05 + r() * 0.25);
        var grad = ctx.createLinearGradient(0, startY, 0, h);
        grad.addColorStop(0, '#5a4532'); grad.addColorStop(0.7, '#3e3024'); grad.addColorStop(1, '#2d241b');
        ctx.strokeStyle = grad; ctx.lineWidth = 5 + r() * 5;
        ctx.beginPath(); ctx.moveTo(cx + (r() - 0.5) * 10, startY);
        ctx.bezierCurveTo(cx + spread * 0.2, startY + h * 0.2, cx + spread * 1.1, h * 0.55, cx + spread, h);
        ctx.stroke();
      }
      ctx.strokeStyle = '#4d3b2a'; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx + 3, h * 0.3); ctx.stroke();
      ctx.strokeStyle = 'rgba(170,150,110,0.3)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - 4, 0); ctx.lineTo(cx - 2, h * 0.3); ctx.stroke();
      // barnacles / algae band near the waterline region
      for (var b = 0; b < 40; b++) { ctx.fillStyle = 'rgba(200,195,170,' + (0.3 + r() * 0.4) + ')'; ctx.beginPath(); ctx.arc(cx + (r() - 0.5) * w * 0.8, h * (0.75 + r() * 0.25), 1.5 + r() * 2, 0, 7); ctx.fill(); }
      return;
    }
    var base = look === 'lava' ? ['#2b2a2c', '#141316'] : ['#a99a7c', '#6f6450'];
    ctx.beginPath(); ctx.moveTo(w * 0.04, h);
    var n = 12, i2;
    for (i2 = 0; i2 <= 4; i2++) ctx.lineTo(w * (0.04 - 0.04 * i2 / 4) + r() * 6, h - (h * 0.88) * i2 / 4);       // left side
    for (i2 = 1; i2 < n; i2++) ctx.lineTo(w * i2 / n, r() * h * 0.08 + (i2 < 2 || i2 > n - 2 ? h * 0.06 : 0)); // ragged top
    for (i2 = 4; i2 >= 0; i2--) ctx.lineTo(w * (0.96 + 0.04 * i2 / 4) - r() * 6, h - (h * 0.88) * i2 / 4);   // right side
    ctx.closePath();
    ctx.fillStyle = lin(ctx, 0, 0, 0, h, [[0, base[0]], [1, base[1]]]); ctx.fill();
    ctx.save(); ctx.clip();
    for (var j = 0; j < (w * h) / 900; j++) {
      ctx.fillStyle = look === 'lava' ? 'rgba(80,78,85,' + (0.2 + r() * 0.3) + ')' : 'rgba(60,50,35,' + (0.1 + r() * 0.2) + ')';
      ctx.beginPath(); ctx.arc(r() * w, r() * h, 2 + r() * 6, 0, 7); ctx.fill();
    }
    if (look !== 'lava') { ctx.fillStyle = 'rgba(90,120,60,0.35)'; ctx.fillRect(0, 0, w, 10); }
    ctx.restore();
  }

  // ---------- backgrounds ----------
  var PALETTES = {
    keys:      { sky: ['#3fa2ec', '#c4ebff'], far: '#4f9a6a', under: ['#3fd3d8', '#1690b8', '#0b467a'], sand: ['#f6e7b8', '#dcc489'] },
    galapagos: { sky: ['#6aaee0', '#d8eef8'], far: '#2b2b2e', under: ['#38bccf', '#167aa6', '#0b3666'], sand: ['#a59c8c', '#766e62'] },
    cave:      { sky: ['#0b0c10', '#1a1b20'], far: '#121216', under: ['#1b6a78', '#0c3446', '#061a26'], sand: ['#4a443f', '#2a2624'] }
  };
  function family(key) { return key.indexOf('galapagos') === 0 ? 'galapagos' : key.indexOf('lava') === 0 ? 'cave' : 'keys'; }

  // Air layer: sky and distant scenery. Drawn full height; the water overlay covers the lower part.
  function drawAir(ctx, w, h, key) {
    var fam = family(key), P = PALETTES[fam], r = rng(key.length * 97);
    ctx.fillStyle = lin(ctx, 0, 0, 0, h * 0.7, [[0, P.sky[0]], [1, P.sky[1]]]); ctx.fillRect(0, 0, w, h);
    if (fam === 'cave') {
      // basalt cave walls with a faint opening
      ctx.fillStyle = 'rgba(60,70,80,0.25)'; ctx.beginPath(); ctx.ellipse(w * 0.35, h * 0.2, w * 0.15, h * 0.12, 0, 0, 7); ctx.fill();
      for (var i = 0; i < 60; i++) { ctx.fillStyle = 'rgba(40,40,46,' + (0.3 + r() * 0.4) + ')'; ctx.beginPath(); ctx.arc(r() * w, r() * h * 0.7, 10 + r() * 40, 0, 7); ctx.fill(); }
      return;
    }
    // soft cumulus
    for (var c = 0; c < 7; c++) {
      var cx = r() * w, cy = h * (0.08 + r() * 0.2), cw = 80 + r() * 140;
      for (var p = 0; p < 6; p++) { ctx.fillStyle = 'rgba(255,255,255,' + (0.35 + r() * 0.3) + ')'; ctx.beginPath(); ctx.ellipse(cx + (r() - 0.5) * cw, cy + (r() - 0.5) * 18, cw * 0.3, 16 + r() * 14, 0, 0, 7); ctx.fill(); }
    }
    var horizon = h * 0.5;
    if (fam === 'keys') {
      // distant low keys with mangrove tree lines
      ctx.fillStyle = 'rgba(70,110,85,0.75)';
      for (var k = 0; k < 4; k++) { var kx = r() * w, kw = 120 + r() * 260; ctx.beginPath(); ctx.ellipse(kx, horizon, kw, 14 + r() * 10, 0, Math.PI, 0); ctx.fill(); }
      ctx.fillStyle = '#e6dcc0'; ctx.fillRect(0, horizon - 2, w, 3);
    } else {
      // volcanic islands
      ctx.fillStyle = 'rgba(60,60,64,0.85)';
      for (var v = 0; v < 3; v++) { var vx = r() * w, vw = 180 + r() * 260, vh = 60 + r() * 90; ctx.beginPath(); ctx.moveTo(vx - vw, horizon); ctx.quadraticCurveTo(vx - vw * 0.2, horizon - vh, vx, horizon - vh * 0.95); ctx.quadraticCurveTo(vx + vw * 0.2, horizon - vh, vx + vw, horizon); ctx.fill(); }
      ctx.fillStyle = 'rgba(30,30,32,0.9)';
      for (var s = 0; s < 6; s++) { var sx = r() * w; ctx.beginPath(); ctx.ellipse(sx, horizon + 4, 30 + r() * 40, 10 + r() * 6, 0, Math.PI, 0); ctx.fill();
        ctx.fillStyle = 'rgba(90,75,60,0.9)'; ctx.beginPath(); ctx.ellipse(sx + 6, horizon - 8, 9, 4, 0.2, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(30,30,32,0.9)'; } // resting sea lions
    }
    // open sea to the horizon
    ctx.fillStyle = lin(ctx, 0, horizon, 0, h, [[0, fam === 'keys' ? '#4fd6dc' : '#3fa6c8'], [1, fam === 'keys' ? '#1fa6c0' : '#1f78a6']]);
    ctx.fillRect(0, horizon, w, h - horizon);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1;
    for (var l = 0; l < 40; l++) { var ly = horizon + r() * (h - horizon); ctx.beginPath(); ctx.moveTo(r() * w, ly); ctx.lineTo(r() * w, ly); ctx.stroke(); }
  }

  // Underwater backdrop: depth gradient, distant reef/rock silhouettes. Cropped below the waterline in-game.
  // Lush, colourful underwater backdrop: bright gradient, sunlit glow, layered reef and kelp, all softened by depth haze.
  function drawUnder(ctx, w, h, key) {
    var fam = family(key), P = PALETTES[fam], r = rng(key.length * 131 + w);
    ctx.fillStyle = lin(ctx, 0, 0, 0, h, [[0, P.under[0]], [0.5, P.under[1]], [1, P.under[2]]]); ctx.fillRect(0, 0, w, h);
    // sunlit glow near the surface
    for (var gI = 0; gI < Math.ceil(w / 700); gI++) {
      ctx.fillStyle = rad(ctx, (gI + 0.5) * 700 + (r() - 0.5) * 200, h * 0.45, 10, 420, [[0, fam === 'cave' ? 'rgba(80,200,210,0.10)' : 'rgba(255,255,230,0.22)'], [1, 'rgba(255,255,230,0)']]);
      ctx.fillRect(0, 0, w, h);
    }
    var hazeCol = fam === 'cave' ? '6,26,38' : fam === 'keys' ? '22,120,170' : '20,90,140';
    // far reef silhouettes (blue, hazy)
    ctx.fillStyle = 'rgba(' + hazeCol + ',0.55)';
    for (var i = 0; i < w / 120; i++) { var x = r() * w, rw = 50 + r() * 140, rh = 40 + r() * 140; ctx.beginPath(); ctx.ellipse(x, h - 40, rw, rh, 0, Math.PI, 0); ctx.fill(); }
    if (fam === 'galapagos' || fam === 'cave') {
      // kelp / sea-grass strands swaying up from the bottom
      for (var k = 0; k < w / 70; k++) {
        var kx = r() * w, kh = h * (0.25 + r() * 0.35);
        ctx.strokeStyle = fam === 'cave' ? 'rgba(40,110,100,0.6)' : 'rgba(' + Math.round(70 + r() * 40) + ',' + Math.round(120 + r() * 40) + ',60,0.75)';
        ctx.lineWidth = 6 + r() * 6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(kx, h - 30);
        for (var sgm = 1; sgm <= 6; sgm++) ctx.lineTo(kx + Math.sin(sgm * 1.3 + k) * 14, h - 30 - kh * sgm / 6);
        ctx.stroke();
      }
    }
    if (fam !== 'cave') {
      // colourful mid reef: branching corals, sea fans, tube sponges, brain corals, anemones
      var cols = ['#ff6f91', '#ff9a4a', '#b86cff', '#ffd23f', '#ff5e5e', '#46e0b5', '#ff7ad9'];
      for (var c = 0; c < w / 55; c++) {
        var cx = r() * w, by = h - 30 - r() * 20, col = cols[Math.floor(r() * cols.length)], type = Math.floor(r() * 5), sz = 30 + r() * 60;
        ctx.globalAlpha = 0.9;
        if (type === 0) { // branching
          ctx.strokeStyle = col; ctx.lineCap = 'round';
          (function br(x, y, len, ang, wd, d) { if (d > 4) return; var x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len; ctx.lineWidth = wd; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke(); br(x2, y2, len * 0.72, ang - 0.5, wd * 0.7, d + 1); br(x2, y2, len * 0.72, ang + 0.5, wd * 0.7, d + 1); })(cx, by, sz * 0.45, -Math.PI / 2, 9, 0);
        } else if (type === 1) { // sea fan
          ctx.strokeStyle = col; ctx.lineWidth = 1.6;
          for (var f = 0; f < 18; f++) { var fa = Math.PI + f / 17 * Math.PI; ctx.beginPath(); ctx.moveTo(cx, by); ctx.quadraticCurveTo(cx + Math.cos(fa) * sz * 0.6, by + Math.sin(fa) * sz * 0.9, cx + Math.cos(fa) * sz, by + Math.sin(fa) * sz * 1.3); ctx.stroke(); }
        } else if (type === 2) { // tube sponges
          for (var tb = 0; tb < 3; tb++) { var tw2 = 10 + r() * 8, th = sz * (0.6 + r() * 0.8), tx = cx + (tb - 1) * 16; ctx.fillStyle = col; ctx.fillRect(tx - tw2 / 2, by - th, tw2, th); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(tx, by - th, tw2 / 2, 3, 0, 0, 7); ctx.fill(); }
        } else if (type === 3) { // brain coral
          ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(cx, by, sz * 0.55, sz * 0.4, 0, Math.PI, 0); ctx.fill();
          ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 2; for (var bl = 0; bl < 4; bl++) { var ex = sz * 0.45 - bl * 7, ey = sz * 0.32 - bl * 6; if (ex < 2 || ey < 2) break; ctx.beginPath(); ctx.ellipse(cx, by, ex, ey, 0, Math.PI, 0); ctx.stroke(); }
        } else { // anemone
          ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.lineCap = 'round';
          for (var an = 0; an < 14; an++) { var aa = Math.PI + 0.2 + an / 13 * (Math.PI - 0.4); ctx.beginPath(); ctx.moveTo(cx, by); ctx.quadraticCurveTo(cx + Math.cos(aa) * sz * 0.3, by + Math.sin(aa) * sz * 0.5, cx + Math.cos(aa) * sz * 0.5, by + Math.sin(aa) * sz * 0.7); ctx.stroke(); }
        }
        ctx.globalAlpha = 1;
      }
      // depth haze over the reef so the play-field stands out
      ctx.fillStyle = lin(ctx, 0, h * 0.4, 0, h, [[0, 'rgba(' + hazeCol + ',0)'], [1, 'rgba(' + hazeCol + ',0.24)']]);
      ctx.fillRect(0, h * 0.4, w, h * 0.6);
    } else {
      // glowing cave specks
      for (var gl = 0; gl < w / 25; gl++) { ctx.fillStyle = 'rgba(120,255,230,' + (0.1 + r() * 0.35) + ')'; ctx.beginPath(); ctx.arc(r() * w, h * (0.3 + r() * 0.7), 1 + r() * 2.5, 0, 7); ctx.fill(); }
    }
    // a few rising bubble columns
    for (var bc = 0; bc < w / 300; bc++) { var bx = r() * w; for (var bb = 0; bb < 12; bb++) { ctx.strokeStyle = 'rgba(230,250,255,0.35)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(bx + Math.sin(bb) * 6, h * 0.9 - bb * 38 - r() * 10, 2 + r() * 3, 0, 7); ctx.stroke(); } }
  }
  function drawFloor(ctx, w, h, key) {
    var fam = family(key), P = PALETTES[fam], r = rng(key.length * 17);
    ctx.beginPath(); ctx.moveTo(0, 10);
    for (var x = 0; x <= w; x += 40) ctx.lineTo(x, 6 + r() * 8);
    ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath();
    ctx.fillStyle = lin(ctx, 0, 0, 0, h, [[0, P.sand[0]], [1, P.sand[1]]]); ctx.fill();
    for (var i = 0; i < w / 4; i++) { ctx.fillStyle = 'rgba(0,0,0,' + r() * 0.12 + ')'; ctx.fillRect(r() * w, 10 + r() * (h - 10), 2, 2); }
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1.5;
    for (var rp = 0; rp < w / 30; rp++) { var rx = r() * w, ry = 14 + r() * (h - 18); ctx.beginPath(); ctx.moveTo(rx, ry); ctx.quadraticCurveTo(rx + 10, ry - 3, rx + 20, ry); ctx.stroke(); }
    if (fam === 'keys') {
      for (var st = 0; st < w / 160; st++) { // starfish and shells
        var sx = r() * w, sy = 18 + r() * (h - 26);
        ctx.fillStyle = r() < 0.5 ? '#ff7a3c' : '#f2c14e'; ctx.beginPath();
        for (var arm = 0; arm < 10; arm++) { var rr2 = arm % 2 ? 3 : 8, aa2 = arm / 10 * Math.PI * 2 - Math.PI / 2; ctx.lineTo(sx + Math.cos(aa2) * rr2, sy + Math.sin(aa2) * rr2); }
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#fff4e0'; ctx.beginPath(); ctx.ellipse(r() * w, 18 + r() * (h - 26), 5, 3.5, r() * 3, 0, 7); ctx.fill();
      }
    }
    if (fam !== 'keys') for (var b = 0; b < w / 90; b++) { ctx.fillStyle = 'rgba(25,25,28,0.8)'; ctx.beginPath(); ctx.ellipse(r() * w, 14, 12 + r() * 20, 8 + r() * 6, 0, Math.PI, 0); ctx.fill(); }
  }

  // Tileable caustic light network: ridges of a domain-warped sum of integer-frequency waves.
  function drawCaustics(ctx, w, h) {
    var img = ctx.createImageData(w, h), d = img.data, TAU = Math.PI * 2;
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      var u = x / w, v = y / h;
      var wu = u + 0.06 * Math.sin(TAU * (2 * v + 0.13)) + 0.03 * Math.sin(TAU * (3 * u + 5 * v));
      var wv = v + 0.06 * Math.sin(TAU * (3 * u + 0.41)) + 0.03 * Math.sin(TAU * (4 * v - 2 * u));
      var n = Math.sin(TAU * (3 * wu + 2 * wv)) + Math.sin(TAU * (-2 * wu + 4 * wv) + 1.7) + Math.sin(TAU * (5 * wu - 1 * wv) + 0.6);
      var ridge = 1 - Math.min(1, Math.abs(n) / 1.6);
      var a = Math.pow(ridge, 9);
      var i = (y * w + x) * 4;
      d[i] = 255; d[i + 1] = 255; d[i + 2] = 255; d[i + 3] = Math.round(a * 255);
    }
    ctx.putImageData(img, 0, 0);
  }

  function radialBrush(ctx, w, h) {
    ctx.fillStyle = rad(ctx, w / 2, h / 2, 0, w / 2, [[0, 'rgba(255,255,255,1)'], [0.55, 'rgba(255,255,255,0.7)'], [1, 'rgba(255,255,255,0)']]);
    ctx.fillRect(0, 0, w, h);
  }
  function dot(ctx, w, h) {
    ctx.fillStyle = rad(ctx, w / 2, h / 2, 0, w / 2, [[0, 'rgba(255,255,255,1)'], [1, 'rgba(255,255,255,0)']]);
    ctx.fillRect(0, 0, w, h);
  }

  // Size of each species texture (display px, before 2x supersampling)
  var SPECIES_SIZE = {
    tang: [64, 52], flyingfish: [72, 46], puffer: [62, 44], puffer_inflated: [120, 120], pistolshrimp: [58, 40],
    loggerhead: [84, 62], swordfish: [110, 40], hammerhead: [100, 46], hatchling: [34, 22], seahorse: [24, 44],
    smallfish: [26, 10], fishschool: [70, 50], lionfish: [72, 56]
  };

  return {
    SPECIES_SIZE: SPECIES_SIZE,
    family: family,
    texKey: function (id) { return 'sp_' + id; },

    // Called once from BootScene after optional PNGs have loaded.
    generateAll: function (scene) {
      var loaded = (window.TT_ASSETS && TT_ASSETS.species) || [];
      Object.keys(species).forEach(function (id) {
        var key = 'sp_' + id;
        if (loaded.indexOf(id) >= 0 && scene.textures.exists('png_' + id)) return; // real art wins
        var sz = SPECIES_SIZE[id];
        canvas(scene, key, sz[0] * S, sz[1] * S, function (ctx, w, h) { species[id](ctx, w, h); stylize(ctx, w, h, { outline: id === 'fishschool' || id === 'smallfish' ? 2 : 3.5 }); });
      });
      Object.keys(materials).forEach(function (m) {
        canvas(scene, 'mat_' + m, 96, 96, function (ctx, w, h) { materials[m](ctx, w, h); stylize(ctx, w, h, { sat: 1.25, outline: 0 }); });
      });
      canvas(scene, 'mat_glass_bottle', 36, 120, function (ctx, w, h) { materials.glass(ctx, w, h); stylize(ctx, w, h, { sat: 1.3, outline: 0 }); });
      // slow-motion vignette and the tutorial's ghost finger
      canvas(scene, 'vignette', 320, 180, function (ctx, w, h) {
        var g = ctx.createRadialGradient(w / 2, h / 2, h * 0.32, w / 2, h / 2, w * 0.62);
        g.addColorStop(0, 'rgba(2,18,32,0)'); g.addColorStop(1, 'rgba(2,18,32,1)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      });
      canvas(scene, 'finger', 96, 96, function (ctx, w) {
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.arc(w / 2 + 3, w / 2 + 4, 24, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.beginPath(); ctx.arc(w / 2, w / 2, 22, 0, 7); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(w / 2, w / 2, 38, 0, 7); ctx.stroke();
      });
      canvas(scene, 'caustics', 256, 256, drawCaustics);
      canvas(scene, 'light_brush', 256, 256, radialBrush);
      canvas(scene, 'dot', 32, 32, dot);
      canvas(scene, 'bubble', 24, 24, function (ctx, w) {
        ctx.strokeStyle = 'rgba(230,250,255,0.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(w / 2, w / 2, w / 2 - 2, 0, 7); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(w * 0.36, w * 0.36, 3, 0, 7); ctx.fill();
      });
      canvas(scene, 'shard', 12, 6, function (ctx, w, h) { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, 0); ctx.lineTo(w * 0.7, h); ctx.fill(); });
    },

    speciesKey: function (scene, id) {
      if (scene.textures.exists('png_' + id)) return 'png_' + id;
      return 'sp_' + id;
    },
    // display scale so the sprite is `len` px long
    scaleFor: function (scene, key, len) {
      var src = scene.textures.get(key).getSourceImage();
      return len / src.width;
    },

    netTexture: function (scene, w, h) {
      var key = 'net_' + w + 'x' + h;
      return canvas(scene, key, w, h, drawNet);
    },
    trapTexture: function (scene, w, h) {
      var key = 'trap_' + w + 'x' + h;
      return canvas(scene, key, w, h, function (ctx, cw, ch) { drawTrap(ctx, cw, ch); stylize(ctx, cw, ch, { sat: 1.2, outline: 0 }); });
    },
    coralTexture: function (scene, w, h, variant) {
      var key = 'coral_' + w + 'x' + h + '_' + variant;
      return canvas(scene, key, w, h, function (ctx, cw, ch) { drawCoral(ctx, cw, ch, variant); stylize(ctx, cw, ch, { sat: 1.5, outline: 2 }); });
    },
    staticTexture: function (scene, s, idx) {
      var key = 'static_' + s.look + '_' + s.w + 'x' + s.h + '_' + idx;
      var tw = s.look === 'root' ? s.w * 4 : s.w;   // roots are drawn wider than their collision body
      return canvas(scene, key, tw, s.h, function (ctx, w, h) { drawStatic(ctx, w, h, s.look, idx * 13 + s.w); stylize(ctx, w, h, { sat: 1.25, outline: 2, gloss: false }); });
    },
    canopyTexture: function (scene) {
      return canvas(scene, 'mangrove_canopy', 360, 170, function (ctx, w, h) {
        var r = rng(404);
        for (var i = 0; i < 70; i++) {
          var x = w * 0.1 + r() * w * 0.8, y = h * 0.15 + r() * h * 0.6, rr = 14 + r() * 26;
          ctx.fillStyle = 'rgba(' + Math.round(40 + r() * 30) + ',' + Math.round(80 + r() * 40) + ',' + Math.round(40 + r() * 20) + ',0.9)';
          ctx.beginPath(); ctx.ellipse(x, y, rr, rr * 0.7, r() * 3, 0, 7); ctx.fill();
        }
        for (var j = 0; j < 40; j++) { ctx.fillStyle = 'rgba(150,190,110,0.35)'; ctx.beginPath(); ctx.ellipse(w * 0.15 + r() * w * 0.7, h * 0.15 + r() * h * 0.3, 8, 4, r() * 3, 0, 7); ctx.fill(); }
      });
    },
    backgroundTextures: function (scene, key, width) {
      var H = TT.CFG.HEIGHT;
      var air = 'bg_air_' + key + '_' + width, under = 'bg_under_' + key + '_' + width, floor = 'bg_floor_' + key + '_' + width;
      var bgLoaded = (window.TT_ASSETS && TT_ASSETS.bg) || [];
      if (bgLoaded.indexOf(key) >= 0 && scene.textures.exists('pngbg_' + key)) air = 'pngbg_' + key;
      else canvas(scene, air, width, H, function (ctx, w, h) { drawAir(ctx, w, h, key); });
      canvas(scene, under, width, H, function (ctx, w, h) { drawUnder(ctx, w, h, key); });
      canvas(scene, floor, width, H - TT.CFG.FLOOR_Y + 10, function (ctx, w, h) { drawFloor(ctx, w, h, key); });
      return { air: air, under: under, floor: floor };
    }
  };
})();

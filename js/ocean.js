// Tide Tossers v0.5 — effects and the living ocean: particles, the rescued school that follows you,
// background swimmers, and colour returning with reef health.
window.TT = window.TT || {};

// ---------- particle effects ----------
TT.FX = function (scene) {
  this.scene = scene;
  this.bubbleE = scene.add.particles(0, 0, 'bubble', {
    lifespan: { min: 700, max: 1400 }, speedY: { min: -90, max: -40 }, speedX: { min: -25, max: 25 },
    scale: { min: 0.25, max: 0.6 }, alpha: { start: 0.8, end: 0 }, emitting: false
  }).setDepth(16);
  this.sprayE = scene.add.particles(0, 0, 'dot', {
    lifespan: 650, speed: { min: 90, max: 260 }, angle: { min: 230, max: 310 }, gravityY: 600,
    scale: { start: 0.35, end: 0.05 }, alpha: { start: 0.9, end: 0 }, tint: 0xe9fbff, emitting: false
  }).setDepth(16);
  this.shardE = scene.add.particles(0, 0, 'shard', {
    lifespan: 900, speed: { min: 60, max: 220 }, angle: { min: 0, max: 360 }, gravityY: 300, rotate: { min: 0, max: 360 },
    scale: { min: 0.5, max: 1.1 }, alpha: { start: 1, end: 0 }, emitting: false
  }).setDepth(16);
  this.siltE = scene.add.particles(0, 0, 'light_brush', {
    lifespan: 2000, speed: { min: 10, max: 45 }, angle: { min: 190, max: 350 }, scale: { start: 0.12, end: 0.45 },
    alpha: { start: 0.55, end: 0 }, tint: [0x8c7b5e, 0x7a6e5a, 0x9a8f7a], emitting: false
  }).setDepth(12.5);
  this.sparkE = scene.add.particles(0, 0, 'spark', {
    lifespan: 600, speed: { min: 5, max: 40 }, scale: { start: 0.6, end: 0 }, alpha: { start: 1, end: 0 },
    rotate: { min: 0, max: 180 }, blendMode: 'ADD', emitting: false
  }).setDepth(16.5);
  // glowing plankton (dark levels): drawn above the darkness layer
  this.glowE = scene.add.particles(0, 0, 'dot', {
    lifespan: 900, speed: { min: 2, max: 14 }, scale: { start: 0.35, end: 0 }, alpha: { start: 0.9, end: 0 },
    tint: [0x7ff7ff, 0x5be0ff, 0xa8fff0], blendMode: 'ADD', emitting: false
  }).setDepth(18.5);
};
TT.FX.prototype.bubbles = function (x, y, n) { this.bubbleE.emitParticleAt(x, y, n || 6); };
TT.FX.prototype.sparkle = function (x, y, n) { this.sparkE.emitParticleAt(x, y, n || 1); };
TT.FX.prototype.plankton = function (x, y) { this.glowE.emitParticleAt(x, y, 1); };
TT.FX.prototype.splash = function (x, y, big) {
  this.sprayE.emitParticleAt(x, y, big ? 26 : 14);
  this.bubbleE.emitParticleAt(x, y + 14, big ? 14 : 8);
};
TT.FX.prototype.shatter = function (x, y, material, count) {
  var tints = { glass: [0x6fae6a, 0x9fd29a, 0xd8f5d0], plastic: [0x7fa7c2, 0xdfe9ef, 0x5a86a6], wood: [0x8d8574, 0x6f6758],
    tin: [0x9a5a32, 0x4a2a1a], concrete: [0x9a9890, 0x6f6d66], net: [0x5a6e55, 0x87a07c], trap: [0x7d735f, 0x8f8d86] };
  var list = tints[material] || [0xffffff];
  for (var i = 0; i < list.length; i++) { this.shardE.particleTint = list[i]; this.shardE.emitParticleAt(x, y, count || 6); }
};
TT.FX.prototype.silt = function (x, y) { this.siltE.emitParticleAt(x, y - 6, 10); };
TT.FX.prototype.ring = function (x, y, r, color) {
  var g = this.scene.add.graphics().setDepth(16).setBlendMode(Phaser.BlendModes.ADD);
  var o = { t: 0 };
  this.scene.tweens.add({ targets: o, t: 1, duration: 420, ease: 'Cubic.easeOut',
    onUpdate: function () { g.clear(); g.lineStyle(4 * (1 - o.t) + 1, color || 0xffffff, 0.8 * (1 - o.t)); g.strokeCircle(x, y, r * o.t); },
    onComplete: function () { g.destroy(); } });
};

// ---------- the rescued school ----------
// Freed animals follow the player's trail for the rest of the level, so you can see everyone you've saved.
TT.School = function (game) {
  this.game = game;
  this.members = [];
};
TT.School.prototype.join = function (container) {
  var g = this.game, self = this;
  container.animals.forEach(function (a) {
    if (a.k === 'fishschool') {
      for (var f = 0; f < 6; f++) {
        var key = TT.Art.speciesKey(g, 'smallfish');
        var fish = g.add.sprite(a.sprite.x + (Math.random() - 0.5) * 40, a.sprite.y + (Math.random() - 0.5) * 30, key).setDepth(8.6);
        fish.setScale(TT.Art.scaleFor(g, key, 26)); TT.Art.playSwim(fish, 'smallfish');
        self.add(fish, 'smallfish');
      }
      a.sprite.destroy();
    } else { a.sprite.setDepth(8.6); self.add(a.sprite, a.k); }
  });
  container.animals = [];
  g.time.delayedCall(2500, function () { g.ocean.addSwimmer('smallfish'); });
};
TT.School.prototype.add = function (sprite, kind) {
  var n = this.members.length;
  this.members.push({ s: sprite, kind: kind, back: 9 + n * 4 + Math.floor(Math.random() * 3), ox: (Math.random() - 0.5) * 34, oy: (Math.random() - 0.5) * 40,
    ph: Math.random() * 6, vx: 0, vy: 0, gone: false });
};
TT.School.prototype.update = function (dt, t) {
  var g = this.game, trail = g.player.trail, W = Phaser.Math.Angle.Wrap, wy = g.water.y + 14, k = Math.min(1, dt * 4.5);
  for (var i = 0; i < this.members.length; i++) {
    var m = this.members[i]; if (m.gone) continue;
    var idx = trail.length - 1 - m.back, tp = trail[Math.max(0, idx)] || g.player.pos();
    var tx = tp.x + m.ox + Math.sin(t * 1.7 + m.ph) * 7, ty = Math.max(wy, tp.y + m.oy + Math.cos(t * 1.3 + m.ph) * 6);
    var nx = m.s.x + (tx - m.s.x) * k, ny = m.s.y + (ty - m.s.y) * k;
    m.vx = nx - m.s.x; m.vy = ny - m.s.y;
    m.s.setPosition(nx, ny);
    var sp = Math.sqrt(m.vx * m.vx + m.vy * m.vy);
    if (m.kind === 'seahorse') { m.s.rotation = Math.sin(t * 2 + m.ph) * 0.12 + Phaser.Math.Clamp(m.vx * 0.04, -0.3, 0.3); if (Math.abs(m.vx) > 0.2) m.s.setFlipX(m.vx < 0); }
    else if (sp > 0.25) { var a = Math.atan2(m.vy, m.vx); m.s.rotation += W(a - m.s.rotation) * Math.min(1, dt * 8); m.s.setFlipY(Math.cos(m.s.rotation) < 0); }
    TT.Art.swimRate(m.s, 0.6 + sp / 2.5);
    if (g.level.dark && !g.lit && Math.random() < 0.08) g.fx.plankton(nx, ny);
  }
};
// On a win the school heads for open water.
TT.School.prototype.swimOff = function () {
  var g = this.game;
  this.members.forEach(function (m, i) {
    m.gone = true;
    if (m.kind !== 'seahorse') { m.s.setRotation(-0.25).setFlipY(false); } else m.s.setFlipX(false);
    g.tweens.add({ targets: m.s, x: m.s.x + 700 + Math.random() * 200, y: Math.max(g.water.y + 20, m.s.y - 120 - Math.random() * 80), alpha: 0,
      duration: 2200 + Math.random() * 600, delay: i * 40, ease: 'Sine.easeIn', onComplete: function () { m.s.destroy(); } });
  });
};

// ---------- living ocean ----------
TT.Ocean = function (scene, level, water) {
  this.scene = scene; this.level = level; this.water = water;
  this.swimmers = [];
  var cam = scene.cameras.main;
  this.colorFx = null;
  if (scene.game.renderer.type === Phaser.WEBGL && cam.postFX) this.colorFx = cam.postFX.addColorMatrix();
  this.targetSat = TT.CFG.SATURATION_AT_START; this.shownSat = this.targetSat + 0.01;
  // a few background schools from the start; more appear as animals are freed
  var n = level.dark ? 1 : Math.max(3, Math.round(level.width / 700));
  for (var k = 0; k < n; k++) this.addSwimmer('smallfish', true);
};

TT.Ocean.prototype.setHealth = function (health, start) {
  var C = TT.CFG;
  var f = Phaser.Math.Clamp((health - start) / Math.max(1, C.SATURATION_FULL_AT - start), 0, 1);
  this.targetSat = C.SATURATION_AT_START * (1 - f);
};

TT.Ocean.prototype.addSwimmer = function (kind, initial) {
  var scene = this.scene, water = this.water, C = TT.CFG, W = this.level.width;
  if (this.swimmers.length > 10) return;
  var key = TT.Art.speciesKey(scene, 'smallfish');
  var group = [], n = 4 + Math.floor(Math.random() * 6);
  var dir = Math.random() < 0.5 ? 1 : -1;
  var y = Phaser.Math.Between(Math.round(water.y + 60), C.FLOOR_Y - 90);
  var x0 = initial ? Math.random() * W : (dir > 0 ? -60 : W + 60);
  for (var i = 0; i < n; i++) {
    var s = scene.add.sprite(x0 + (Math.random() - 0.5) * 70, y + (Math.random() - 0.5) * 36, key).setDepth(3.5).setAlpha(0.5);
    s.setScale(TT.Art.scaleFor(scene, key, 18 + Math.random() * 6));
    TT.Art.playSwim(s, 'smallfish');
    if (dir < 0) s.setFlipX(true);
    group.push({ s: s, ox: s.x - x0, oy: s.y - y, ph: Math.random() * 6 });
  }
  this.swimmers.push({ group: group, x: x0, y: y, dir: dir, speed: 0.5 + Math.random() * 0.6 });
};

TT.Ocean.prototype.update = function (t, dt) {
  var water = this.water, W = this.level.width;
  // colour returns with reef health (WebGL only; the Canvas renderer skips it)
  if (this.colorFx && Math.abs(this.shownSat - this.targetSat) > 0.002) {
    this.shownSat += (this.targetSat - this.shownSat) * Math.min(1, dt * 2);
    this.colorFx.reset(); this.colorFx.saturate(this.shownSat);
  }
  for (var i = 0; i < this.swimmers.length; i++) {
    var sw = this.swimmers[i];
    sw.x += sw.dir * sw.speed * dt * 60;
    if (sw.dir > 0 && sw.x > W + 120) sw.x = -120;
    if (sw.dir < 0 && sw.x < -120) sw.x = W + 120;
    var yy = Math.max(water.y + 30, sw.y + Math.sin(t * 0.7 + i) * 10);
    for (var j = 0; j < sw.group.length; j++) {
      var g = sw.group[j];
      g.s.setPosition(sw.x + g.ox + Math.sin(t * 1.3 + g.ph) * 6, yy + g.oy + Math.cos(t * 1.1 + g.ph) * 4);
    }
  }
};

// Tide Tossers v0.2 — effects and the living ocean: particles, freed animals swimming away,
// background swimmers, swaying seagrass, silt clouds, and colour returning with reef health.
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
};
TT.FX.prototype.bubbles = function (x, y, n) { this.bubbleE.emitParticleAt(x, y, n || 6); };
TT.FX.prototype.splash = function (x, y, big) {
  this.sprayE.emitParticleAt(x, y, big ? 26 : 14);
  this.bubbleE.emitParticleAt(x, y + 14, big ? 14 : 8);
};
TT.FX.prototype.shatter = function (x, y, material) {
  var tints = { glass: [0x6fae6a, 0x9fd29a, 0xd8f5d0], plastic: [0x7fa7c2, 0xdfe9ef, 0x5a86a6], wood: [0x8d8574, 0x6f6758],
    tin: [0x9a5a32, 0x4a2a1a], concrete: [0x9a9890, 0x6f6d66], net: [0x5a6e55, 0x87a07c], trap: [0x7d735f, 0x8f8d86] };
  var list = tints[material] || [0xffffff];
  for (var i = 0; i < list.length; i++) { this.shardE.particleTint = list[i]; this.shardE.emitParticleAt(x, y, 6); }
};
TT.FX.prototype.silt = function (x, y) { this.siltE.emitParticleAt(x, y - 6, 10); };
TT.FX.prototype.ring = function (x, y, r, color) {
  var g = this.scene.add.graphics().setDepth(16).setBlendMode(Phaser.BlendModes.ADD);
  var o = { t: 0 };
  this.scene.tweens.add({ targets: o, t: 1, duration: 420, ease: 'Cubic.easeOut',
    onUpdate: function () { g.clear(); g.lineStyle(4 * (1 - o.t) + 1, color || 0xffffff, 0.8 * (1 - o.t)); g.strokeCircle(x, y, r * o.t); },
    onComplete: function () { g.destroy(); } });
};

// ---------- living ocean ----------
TT.Ocean = function (scene, level, water) {
  this.scene = scene; this.level = level; this.water = water;
  this.swimmers = [];
  this.fam = TT.Art.family(level.background);
  var cam = scene.cameras.main;
  this.ext = scene.ext || { x0: 0, w: level.width };
  this.colorFx = null;
  if (scene.game.renderer.type === Phaser.WEBGL && cam.postFX) {
    this.colorFx = cam.postFX.addColorMatrix();
  } else {
    this.greyOverlay = scene.add.rectangle(this.ext.x0, 0, this.ext.w, TT.CFG.HEIGHT, 0x6b6658, 0).setOrigin(0, 0).setDepth(17.5);
  }
  this.targetSat = TT.CFG.SATURATION_AT_START; this.shownSat = this.targetSat + 0.01;
  // seagrass blades on the floor (Florida Keys)
  this.grass = [];
  this.grassGfx = scene.add.graphics().setDepth(4.5);
  if (this.fam === 'keys') {
    for (var i = 0; i < this.ext.w / 22; i++) this.grass.push({ x: this.ext.x0 + i * 22 + Math.random() * 14, h: 26 + Math.random() * 40, ph: Math.random() * 6 });
  }
  // a few background fish from the start; more appear as animals are freed
  for (var k = 0; k < (this.fam === 'cave' ? 1 : 3); k++) this.addSwimmer('smallfish', true);
};

TT.Ocean.prototype.setHealth = function (health, start) {
  var C = TT.CFG;
  var f = Phaser.Math.Clamp((health - start) / Math.max(1, C.SATURATION_FULL_AT - start), 0, 1);
  this.targetSat = C.SATURATION_AT_START * (1 - f);
};

TT.Ocean.prototype.addSwimmer = function (kind, initial) {
  var scene = this.scene, water = this.water, C = TT.CFG;
  if (!water.hasWater) return;
  var key = TT.Art.speciesKey(scene, kind === 'hatchling' ? 'hatchling' : kind === 'seahorse' ? 'seahorse' : 'smallfish');
  var group = [], n = kind === 'smallfish' || kind === 'fishschool' ? 5 + Math.floor(Math.random() * 6) : 1;
  var dir = Math.random() < 0.5 ? 1 : -1;
  var y = Phaser.Math.Between(Math.round(water.y + 40), C.FLOOR_Y - 60);
  var E = this.ext, x0 = initial ? E.x0 + Math.random() * E.w : (dir > 0 ? E.x0 - 60 : E.x0 + E.w + 60);
  for (var i = 0; i < n; i++) {
    var s = scene.add.image(x0 + (Math.random() - 0.5) * 60, y + (Math.random() - 0.5) * 30, key).setDepth(3.5).setAlpha(0.55);
    var sz = TT.Art.SPECIES_SIZE[kind === 'fishschool' ? 'smallfish' : kind] || [26, 10];
    s.setScale(TT.Art.scaleFor(scene, key, sz[0] * 0.75));
    if (dir < 0) s.setFlipX(true);
    group.push({ s: s, ox: s.x - x0, oy: s.y - y, ph: Math.random() * 6 });
  }
  this.swimmers.push({ group: group, x: x0, y: y, dir: dir, speed: 0.5 + Math.random() * 0.6, kind: kind });
};

// Animals released from a container swim away; some come back as background swimmers.
TT.Ocean.prototype.release = function (container) {
  var scene = this.scene, self = this, water = this.water;
  container.animals.forEach(function (a, i) {
    var s = a.sprite; s.setDepth(11);
    var dir = Math.random() < 0.3 ? -1 : 1;
    if (a.k === 'fishschool') {
      // break the cluster into individual fish that scatter
      var key = TT.Art.speciesKey(scene, 'smallfish');
      for (var f = 0; f < 14; f++) {
        var fish = scene.add.image(s.x + (Math.random() - 0.5) * 40, s.y + (Math.random() - 0.5) * 30, key).setDepth(11);
        fish.setScale(TT.Art.scaleFor(scene, key, 22));
        var ang = (Math.random() - 0.5) * 1.6 + (dir > 0 ? 0 : Math.PI);
        if (Math.cos(ang) < 0) fish.setFlipX(true);
        scene.tweens.add({ targets: fish, x: fish.x + Math.cos(ang) * 900, y: fish.y + Math.sin(ang) * 300 - 80,
          duration: 2600 + Math.random() * 900, ease: 'Sine.easeIn', onComplete: function (tw, t) { t[0].destroy(); } });
      }
      s.destroy();
    } else {
      var up = a.k === 'hatchling' ? -1 : -0.4;
      var tx = s.x + dir * (700 + Math.random() * 200), ty = water.hasWater ? Math.max(water.y + 20, s.y + up * 300) : s.y - 200;
      if (dir < 0) s.setFlipX(true);
      scene.tweens.add({ targets: s, x: tx, y: ty, duration: a.k === 'seahorse' ? 5200 : 3200, ease: 'Sine.easeInOut',
        onUpdate: function () { s.rotation = Math.sin(scene.time.now / 120 + i) * 0.12; },
        onComplete: function () { s.destroy(); } });
    }
  });
  container.animals = [];
  // background life returns a few seconds later
  scene.time.delayedCall(2500, function () { self.addSwimmer('smallfish'); });
  scene.time.delayedCall(4500, function () { self.addSwimmer(Math.random() < 0.5 ? 'smallfish' : 'fishschool'); });
};

TT.Ocean.prototype.update = function (time, dt) {
  var t = time / 1000, C = TT.CFG, water = this.water;
  // colour
  if (Math.abs(this.shownSat - this.targetSat) > 0.002) {
    this.shownSat += (this.targetSat - this.shownSat) * Math.min(1, dt * 2);
    if (this.colorFx) { this.colorFx.reset(); this.colorFx.saturate(this.shownSat); }
    else if (this.greyOverlay) this.greyOverlay.setFillStyle(0x6b6658, Math.max(0, -this.shownSat) * 0.45);
  }
  // swimmers
  for (var i = 0; i < this.swimmers.length; i++) {
    var sw = this.swimmers[i];
    sw.x += sw.dir * sw.speed * dt * 60;
    var E = this.ext;
    if (sw.dir > 0 && sw.x > E.x0 + E.w + 120) sw.x = E.x0 - 120;
    if (sw.dir < 0 && sw.x < E.x0 - 120) sw.x = E.x0 + E.w + 120;
    var yMin = water.hasWater ? water.y + 25 : 0;
    var yy = Math.max(yMin, sw.y + Math.sin(t * 0.7 + i) * 10);
    for (var j = 0; j < sw.group.length; j++) {
      var g = sw.group[j];
      g.s.setPosition(sw.x + g.ox + Math.sin(t * 1.3 + g.ph) * 6, yy + g.oy + Math.cos(t * 1.1 + g.ph) * 4);
      g.s.rotation = Math.sin(t * 6 + g.ph) * 0.06;
      g.s.setVisible(!water.hasWater || g.s.y > water.y);
    }
  }
  // seagrass
  var gg = this.grassGfx; gg.clear();
  if (this.grass.length) {
    for (var k = 0; k < this.grass.length; k++) {
      var b = this.grass[k], sway = Math.sin(t * 1.2 + b.ph) * 6;
      gg.lineStyle(3, 0x4fbf5f, 0.9);
      gg.beginPath(); gg.moveTo(b.x, C.FLOOR_Y + 6);
      gg.lineTo(b.x + sway * 0.4, C.FLOOR_Y - b.h * 0.5); gg.lineTo(b.x + sway, C.FLOOR_Y - b.h); gg.strokePath();
    }
  }
};

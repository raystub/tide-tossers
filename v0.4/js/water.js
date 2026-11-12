// Tide Tossers v0.2 — water: waterline, buoyancy, drag, skips/refraction, tide, rendering, darkness.
window.TT = window.TT || {};

TT.Water = function (scene, level, bgTex) {
  var C = TT.CFG, M = Phaser.Physics.Matter.Matter;
  var self = this;
  this.scene = scene;
  var ext = scene.ext || { x0: 0, w: level.width };
  this.width = ext.w; this.x0 = ext.x0;
  this.hasWater = level.waterline !== null && level.waterline !== undefined;
  this.y = this.hasWater ? level.waterline : C.HEIGHT + 100;
  this.tide = level.tide || null;
  this.tideDir = -1; // tide rises first (waterline y decreases)
  this.dark = !!level.dark;
  this.fam = TT.Art.family(level.background);
  var H = C.HEIGHT, W = ext.w, X0 = ext.x0;

  // ---------- layers ----------
  this.under = scene.add.image(X0 - 100, 0, bgTex.under).setOrigin(0, 0).setDepth(1).setScrollFactor(0.85, 1);
  var tintKey = 'water_tint_' + this.fam;
  if (!scene.textures.exists(tintKey)) {
    var t = scene.textures.createCanvas(tintKey, 4, 512), ctx = t.getContext();
    var g = ctx.createLinearGradient(0, 0, 0, 512);
    var col = this.fam === 'keys' ? '20,120,140' : this.fam === 'galapagos' ? '15,70,105' : '8,30,45';
    g.addColorStop(0, 'rgba(' + col + ',0.05)'); g.addColorStop(0.5, 'rgba(' + col + ',0.16)'); g.addColorStop(1, 'rgba(' + col + ',0.34)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 4, 512); t.refresh();
  }
  this.tint = scene.add.image(0, 0, tintKey).setOrigin(0, 0).setDepth(12);
  this.caustics = scene.add.tileSprite(X0, 0, W, 10, 'caustics').setOrigin(0, 0).setDepth(13)
    .setBlendMode(Phaser.BlendModes.ADD).setAlpha(this.fam === 'cave' ? 0.03 : 0.06);
  this.caustics.setTileScale(1.8, 1.8);
  if (TT.MOBILE) this.caustics.setVisible(false); // phones: keep floor caustics only
  this.floorCaustics = scene.add.tileSprite(X0, TT.CFG.FLOOR_Y - 8, W, H - TT.CFG.FLOOR_Y + 8, 'caustics').setOrigin(0, 0).setDepth(2.5)
    .setBlendMode(Phaser.BlendModes.ADD).setAlpha(this.fam === 'cave' ? 0.05 : 0.22);
  this.rays = scene.add.graphics().setDepth(14).setBlendMode(Phaser.BlendModes.ADD);
  this.surface = scene.add.graphics().setDepth(15);

  // ---------- darkness ----------
  if (this.dark) {
    this.darkRT = scene.add.renderTexture(X0, 0, W, H).setOrigin(0, 0).setDepth(18);
    this.stamp = scene.make.image({ key: 'light_brush', add: false });
    this.glowEmitter = scene.add.particles(0, 0, 'dot', {
      lifespan: 900, speed: { min: 2, max: 14 }, scale: { start: 0.35, end: 0 }, alpha: { start: 0.9, end: 0 },
      tint: [0x7ff7ff, 0x5be0ff, 0xa8fff0], blendMode: 'ADD', emitting: false
    }).setDepth(18.5);
    this.lit = false;
    // visible glowing plankton patches (the level's light sources)
    this.glowSprites = (level.glowSpots || []).map(function (g, i) {
      return scene.add.image(g.x, g.y, 'light_brush').setDepth(18.6).setBlendMode(Phaser.BlendModes.ADD)
        .setTint(0x6fe8ff).setAlpha(0.22).setScale(0.55 + (i % 2) * 0.1);
    });
  }

  this.layout();

  // ---------- physics ----------
  this.submergedFrac = function (body) {
    if (!self.hasWater) return 0;
    var b = body.bounds, hgt = Math.max(1, b.max.y - b.min.y);
    return Phaser.Math.Clamp((b.max.y - self.y) / hgt, 0, 1);
  };

  // Called from the Matter beforeupdate event for every dynamic body.
  this.applyForces = function (bodies) {
    if (!self.hasWater) return;
    for (var i = 0; i < bodies.length; i++) {
      var b = bodies[i];
      if (b.isStatic || b.isSensor || b.isSleeping || !b.ttWater) continue;
      var f = self.submergedFrac(b);
      if (f <= 0) continue;
      var w = b.ttWater;
      if (!b.ignoreGravity) {
        var buoy = C.BUOYANCY[w.buoy] || 1;
        M.Body.applyForce(b, b.position, { x: 0, y: -b.mass * 0.001 * C.GRAVITY_Y * C.BUOYANCY_SCALE * buoy * f });
      }
      if (!w.ignoreDrag) {
        var drag = C.WATER_DRAG * (w.buoy === 'darts' ? C.DARTER_DRAG_FACTOR : 1) * f;
        // drag per physics update, scaled for slow-motion so a second of game time always loses the same speed
        var ts = scene.timeScale || 1, keep = Math.pow(1 - drag, ts), bv = TT.vel(b);
        M.Body.setVelocity(b, { x: bv.x * keep, y: bv.y * keep });
        M.Body.setAngularVelocity(b, M.Body.getAngularVelocity(b) * Math.pow(1 - C.WATER_ANGULAR_DRAG * f, ts));
      }
    }
  };

  // Rescuer surface crossing: returns 'skip', 'enter' or null.
  this.checkCrossing = function (r) {
    if (!self.hasWater) return null;
    var b = r.body, prev = r.prevY, y = b.position.y;
    r.prevY = y;
    if (prev === undefined) return null;
    var bv = TT.vel(b);
    if (prev < self.y && y >= self.y && bv.y > 0) {
      var vx = bv.x, vy = bv.y, speed = Math.sqrt(vx * vx + vy * vy);
      var ang = Math.atan2(vy, Math.abs(vx)) * 180 / Math.PI;
      if (ang < C.SKIP_MAX_ANGLE && speed > C.SKIP_MIN_SPEED && r.skips < C.MAX_SKIPS) {
        r.skips++;
        M.Body.setPosition(b, { x: b.position.x, y: self.y - 2 });
        M.Body.setVelocity(b, { x: vx * C.SKIP_VX_KEEP, y: -vy * C.SKIP_BOUNCE });
        return 'skip';
      }
      M.Body.setVelocity(b, { x: vx * C.REFRACT_VX, y: vy });
      return 'enter';
    }
    return null;
  };

  this.isUnder = function (y) { return self.hasWater && y > self.y; };

  // ---------- tide ----------
  this.stepTide = function (onDone) {
    if (!self.tide) { if (onDone) onDone(); return; }
    var stepMult = (TT.CFG.DIFFICULTY[scene.difficulty] || {}).hp || 1; // harder = bigger swings
    var step = self.tide.step * Math.min(1.5, Math.max(0.75, stepMult));
    var next = self.y + self.tideDir * step;
    if (next < self.tide.min || next > self.tide.max) { self.tideDir *= -1; next = self.y + self.tideDir * step; }
    next = Phaser.Math.Clamp(next, self.tide.min, self.tide.max);
    var dir = next < self.y ? 'up' : 'down';
    scene.tweens.addCounter({
      from: self.y, to: next, duration: C.TIDE_TWEEN_MS, ease: 'Sine.easeInOut',
      onUpdate: function (tw) { self.y = tw.getValue(); self.layout(); },
      onComplete: function () { if (onDone) onDone(dir); }
    });
    return dir;
  };
  this.nextTideDir = function () {
    if (!self.tide) return null;
    var next = self.y + self.tideDir * self.tide.step;
    var d = self.tideDir;
    if (next < self.tide.min || next > self.tide.max) d *= -1;
    return d < 0 ? 'up' : 'down';
  };
};

TT.Water.prototype.layout = function () {
  var H = TT.CFG.HEIGHT, W = this.width, y = Math.round(this.y);
  if (!this.hasWater) { this.under.setVisible(false); this.tint.setVisible(false); this.caustics.setVisible(false); this.floorCaustics.setVisible(false); return; }
  var img = this.under, srcH = img.height;
  img.setCrop(0, y, img.width, srcH - y);
  this.tint.setPosition(this.x0 - 100, y).setDisplaySize(W + 400, H - y + 20);
  this.caustics.setPosition(this.x0, y).setSize(W, Math.max(1, H - y));
  if (TT.MOBILE) this.caustics.setVisible(false);
};

TT.Water.prototype.update = function (time, lights) {
  if (!this.hasWater) return;
  var W = this.width, y = this.y, t = time / 1000;
  // caustics drift
  this.caustics.tilePositionX = t * 9; this.caustics.tilePositionY = Math.sin(t * 0.4) * 20 + t * 4;
  this.floorCaustics.tilePositionX = t * 14; this.floorCaustics.tilePositionY = Math.cos(t * 0.5) * 16;
  // sun rays
  var g = this.rays; g.clear();
  if (this.fam !== 'cave') {
    for (var i = 0; i < (TT.MOBILE ? 3 : 6); i++) {
      var x = this.x0 + (i * (TT.MOBILE ? 460 : 260) + 120 + Math.sin(t * 0.3 + i) * 40) % (W + 200);
      var a = 0.05 + 0.035 * Math.sin(t * 0.8 + i * 1.7);
      g.fillStyle(0xdff8ff, Math.max(0.01, a));
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + 50, y); g.lineTo(x + 230, TT.CFG.FLOOR_Y); g.lineTo(x + 120, TT.CFG.FLOOR_Y); g.closePath(); g.fillPath();
    }
  }
  // wavy surface
  var s = this.surface; s.clear();
  s.lineStyle(3, 0xeafcff, this.fam === 'cave' ? 0.35 : 0.7);
  s.beginPath();
  for (var x2 = this.x0; x2 <= this.x0 + W; x2 += 16) {
    var yy = y + Math.sin(x2 * 0.025 + t * 2.2) * 2.2 + Math.sin(x2 * 0.011 - t * 1.3) * 1.6;
    if (x2 === this.x0) s.moveTo(x2, yy); else s.lineTo(x2, yy);
  }
  s.strokePath();
  s.lineStyle(6, 0x0a4a5a, 0.18); s.beginPath(); s.moveTo(this.x0, y + 5); s.lineTo(this.x0 + W, y + 5); s.strokePath();

  // darkness with light holes
  if (this.darkRT) {
    var rt = this.darkRT;
    rt.clear();
    if (this.lit) { rt.setVisible(false); return; }
    rt.fill(0x000000, TT.CFG.DARK_ALPHA);
    var st = this.stamp;
    for (var k = 0; k < lights.length; k++) {
      var L = lights[k];
      st.setPosition(L.x - this.x0, L.y).setScale((L.r * 2) / 256).setAlpha(L.a === undefined ? 1 : L.a);
      rt.erase(st);
    }
  }
};

TT.Water.prototype.plankton = function (x, y) {
  if (this.glowEmitter && !this.lit && this.isUnder(y)) this.glowEmitter.emitParticleAt(x, y, 1);
};
TT.Water.prototype.setLit = function (on) {
  this.lit = on;
  if (this.darkRT && on) { this.darkRT.setVisible(false); (this.glowSprites || []).forEach(function (g) { g.setAlpha(0.1); }); }
};

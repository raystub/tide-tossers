// Tide Tossers v0.5 — water physics: waterline, tide, buoyancy, drag and currents. (Rendering lives in scenery.js.)
window.TT = window.TT || {};

TT.Water = function (scene, level) {
  var C = TT.CFG;
  this.scene = scene;
  this.hasWater = level.waterline !== null && level.waterline !== undefined;
  this.y = this.hasWater ? level.waterline : C.HEIGHT + 100;
  this.tide = level.tide || null;
  this.currents = level.currents || [];
  if (this.tide) {
    this.tideMid = (this.tide.min + this.tide.max) / 2;
    this.tideAmp = (this.tide.max - this.tide.min) / 2;
    this.tidePhase = Math.asin(Phaser.Math.Clamp((this.y - this.tideMid) / Math.max(1, this.tideAmp), -1, 1));
  }
};

TT.Water.prototype.isUnder = function (y) { return this.hasWater && y > this.y; };

TT.Water.prototype.submergedFrac = function (body) {
  if (!this.hasWater) return 0;
  var b = body.bounds, hgt = Math.max(1, b.max.y - b.min.y);
  return Phaser.Math.Clamp((b.max.y - this.y) / hgt, 0, 1);
};

// Tide levels: the waterline rises and falls continuously. dt in seconds of game time.
TT.Water.prototype.update = function (dt) {
  if (!this.tide) return;
  this.tidePhase += dt * Math.PI * 2 / TT.CFG.TIDE_PERIOD;
  this.y = this.tideMid + this.tideAmp * Math.sin(this.tidePhase);
};
TT.Water.prototype.tideRising = function () { return !!this.tide && Math.cos(this.tidePhase) < 0; };

// Push from currents at a point, in px per (1/60 s)^2.
TT.Water.prototype.currentAt = function (x, y, out) {
  out.x = 0; out.y = 0;
  if (!this.isUnder(y)) return out;
  for (var i = 0; i < this.currents.length; i++) {
    var c = this.currents[i];
    if (x > c.x - c.w / 2 && x < c.x + c.w / 2 && y > c.y - c.h / 2 && y < c.y + c.h / 2) { out.x += c.fx; out.y += c.fy; }
  }
  return out;
};

// Called once per physics step for every dynamic body except the player (which swims by its own rules).
TT.Water.prototype.applyForces = function (bodies) {
  if (!this.hasWater) return;
  var C = TT.CFG, M = Phaser.Physics.Matter.Matter, k = TT.STEP, cur = this._cur || (this._cur = { x: 0, y: 0 });
  for (var i = 0; i < bodies.length; i++) {
    var b = bodies[i];
    if (b.isStatic || b.isSensor || !b.ttWater) continue;
    var f = this.submergedFrac(b);
    if (f <= 0) continue;
    var w = b.ttWater;
    if (!b.ignoreGravity) {
      var buoy = C.BUOYANCY[w.buoy] || 1;
      M.Body.applyForce(b, b.position, { x: 0, y: -b.mass * 0.001 * C.GRAVITY_Y * C.BUOYANCY_SCALE * buoy * f });
    }
    var keep = Math.pow(1 - C.WATER_DRAG * f, k), bv = TT.vel(b);
    this.currentAt(b.position.x, b.position.y, cur);
    M.Body.setVelocity(b, { x: bv.x * keep + cur.x * k, y: bv.y * keep + cur.y * k });
    M.Body.setAngularVelocity(b, M.Body.getAngularVelocity(b) * Math.pow(1 - C.WATER_ANGULAR_DRAG * f, k));
  }
};

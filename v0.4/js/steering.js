// Tide Tossers — post-launch steering with a stamina bar, and tap-vs-hold detection.
// Two modes (saved per player, toggle on the level-select screen):
//   'swipe' (phone default): a floating thumb-stick appears where your thumb lands; push it the way you want to swim.
//   'point' (desktop default): the rescuer swims toward the pointer.
// v0.4 smoothing: stick sized in screen px, floating base, filtered direction, eased turning,
// push strength sets swim power, soft stamina fade, gentle steer-assist toward nets and traps.
window.TT = window.TT || {};

TT.Steering = function (scene) {
  this.scene = scene;
  this.down = false;
  this.steering = false;
  this.usedThisPress = false;
  this.t0 = 0; this.x0 = 0; this.y0 = 0;   // where the press started (tap detection)
  this.bx = 0; this.by = 0;                // floating stick base
  this.dir = null;                         // filtered stick direction (radians)
  this.pointer = null;
  this.emptyBuzzed = false;
  this.mode = TT.Save.steerMode();
  this.arc = scene.add.graphics().setDepth(17);
  this.stick = scene.add.graphics().setDepth(21).setScrollFactor(0);
};

// Stamina for a rescuer at the current difficulty, in seconds of (game-time) steering.
TT.Steering.staminaFor = function (rescuerId, difficulty) {
  var C = TT.CFG, def = C.RESCUERS[rescuerId];
  var stat = C.STEER_STAT[def.steer] || 1;
  return C.STEER_BASE_STAMINA * stat * (C.DIFFICULTY[difficulty] || C.DIFFICULTY.current).stamina;
};

TT.Steering.prototype.tapLimits = function () {
  var C = TT.CFG;
  return TT.MOBILE ? { ms: C.TAP_MAX_MS_TOUCH, move: C.TAP_MAX_MOVE_TOUCH } : { ms: C.TAP_MAX_MS, move: C.TAP_MAX_MOVE };
};

// Game pixels per screen (CSS) pixel, so the stick is the same physical size on every phone.
TT.Steering.prototype.gpx = function () {
  var s = this.scene.scale, d = s.displaySize && s.displaySize.width;
  return d ? s.width / d : 1;
};

TT.Steering.prototype.press = function (pointer) {
  this.down = true; this.steering = false; this.usedThisPress = false; this.emptyBuzzed = false;
  this.t0 = this.scene.time.now; this.x0 = pointer.x; this.y0 = pointer.y; this.pointer = pointer;
  this.bx = pointer.x; this.by = pointer.y; this.dir = null;
};

// Returns true if this release was a quick tap (ability), false otherwise.
TT.Steering.prototype.release = function (pointer) {
  if (!this.down) return false;
  this.down = false;
  var dt = this.scene.time.now - this.t0;
  var dist = Phaser.Math.Distance.Between(this.x0, this.y0, pointer.x, pointer.y);
  var wasSteering = this.usedThisPress, lim = this.tapLimits();
  this.steering = false;
  this.stick.clear();
  return !wasSteering && dt < lim.ms && dist < lim.move;
};

TT.Steering.prototype.cancel = function () { this.down = false; this.steering = false; this.arc.clear(); this.stick.clear(); };

// True while the player is actively steering (used for slow-motion).
TT.Steering.prototype.isActive = function (r) { return !!(this.down && this.steering && r && r.alive && r.stamina > 0); };

// Steer-assist: if the heading points roughly at a nearby net or trap, bend it onto that target.
TT.Steering.prototype.assist = function (pos, heading) {
  var C = TT.CFG, cs = this.scene.containers || [], best = null, bestOff = Phaser.Math.DegToRad(C.STEER_ASSIST_ANGLE);
  if (!C.STEER_ASSIST_STRENGTH) return heading;
  for (var i = 0; i < cs.length; i++) {
    var c = cs[i]; if (!c.alive || !c.sprite) continue;
    var dx = c.sprite.x - pos.x, dy = c.sprite.y - pos.y, d = Math.sqrt(dx * dx + dy * dy);
    if (d > C.STEER_ASSIST_RANGE || d < 10) continue;
    var off = Math.abs(Phaser.Math.Angle.Wrap(Math.atan2(dy, dx) - heading));
    if (off < bestOff) { bestOff = off; best = Math.atan2(dy, dx); }
  }
  return best === null ? heading : heading + Phaser.Math.Angle.Wrap(best - heading) * C.STEER_ASSIST_STRENGTH;
};

// Draws the floating stick. push 0..1; dim when out of stamina.
TT.Steering.prototype.drawStick = function (R, kx, ky, alpha) {
  var g = this.stick;
  g.fillStyle(0x04202c, 0.25 * alpha); g.fillCircle(this.bx, this.by, R);
  g.lineStyle(3, 0xe9fbff, 0.6 * alpha); g.strokeCircle(this.bx, this.by, R);
  g.fillStyle(0xe9fbff, 0.85 * alpha); g.fillCircle(this.bx + kx, this.by + ky, R * 0.38);
  g.lineStyle(2, 0x04202c, 0.35 * alpha); g.strokeCircle(this.bx + kx, this.by + ky, R * 0.38);
};

// Called every frame while a rescuer is in flight. timeScale = current physics speed (slow-mo < 1).
TT.Steering.prototype.update = function (r, water, dtSec, timeScale) {
  var C = TT.CFG, M = Phaser.Physics.Matter.Matter, W = Phaser.Math.Angle.Wrap;
  var scene = this.scene, ts = timeScale || 1;
  this.arc.clear(); this.stick.clear();
  if (!r || !r.alive) return;
  var p = this.pointer;
  if (this.down && p) {
    var lim = this.tapLimits();
    var held = scene.time.now - this.t0;
    var moved = Phaser.Math.Distance.Between(this.x0, this.y0, p.x, p.y);
    if (held > lim.ms || moved > lim.move) this.steering = true;
  }
  var swipe = this.mode === 'swipe';
  var gpx = this.gpx(), R = C.SWIPE_STICK_RADIUS * gpx, dead = C.SWIPE_DEADZONE * gpx;
  var push = 0, sx = 0, sy = 0, sl = 0;
  if (swipe && this.down && p) {
    sx = p.x - this.bx; sy = p.y - this.by; sl = Math.sqrt(sx * sx + sy * sy);
    // floating base: pulling past the rim drags the stick along, so reversing is a short move
    if (sl > R) { this.bx = p.x - sx / sl * R; this.by = p.y - sy / sl * R; sx = p.x - this.bx; sy = p.y - this.by; sl = R; }
    push = sl <= dead ? 0 : Math.min(1, (sl - dead) / (R - dead));
  }
  var active = this.isActive(r);
  if (swipe && this.down && p && this.steering) {
    var empty = r.stamina <= 0;
    this.drawStick(R, sx, sy, empty ? 0.35 : 1);
    if (empty && !this.emptyBuzzed) { this.emptyBuzzed = true; TT.Haptics.buzz([10, 40, 10]); }
  }
  if (active) {
    this.usedThisPress = true;
    var b = r.body;
    var under = water.isUnder(b.position.y);
    var swims = under || r.gliding;
    var bv = TT.vel(b), vx = bv.x, vy = bv.y, speed = Math.sqrt(vx * vx + vy * vy);
    var cur = speed > 0.4 ? Math.atan2(vy, vx) : (this.dir !== null ? this.dir : 0);
    var target = cur, thrust = 0;
    if (swipe) {
      if (push > 0) {
        var raw = Math.atan2(sy, sx);
        this.dir = this.dir === null ? raw : this.dir + W(raw - this.dir) * Math.min(1, dtSec * C.STEER_INPUT_SMOOTH);
        target = this.dir;
        thrust = C.STEER_MIN_PUSH_THRUST + (1 - C.STEER_MIN_PUSH_THRUST) * push;
      }
    } else {
      var wp = scene.cameras.main.getWorldPoint(p.x, p.y);
      target = Math.atan2(wp.y - b.position.y, wp.x - b.position.x);
      if (speed <= 0.4) cur = target;
      thrust = 1;
      this.arc.lineStyle(2, 0xe9fbff, 0.35); this.arc.lineBetween(b.position.x, b.position.y, wp.x, wp.y);
      this.arc.lineStyle(3, 0xe9fbff, 0.8); this.arc.strokeCircle(wp.x, wp.y, TT.MOBILE ? 22 : 14);
    }
    if (thrust > 0 && under) target = this.assist(b.position, target);
    // soft fade over the last part of the stamina bar
    var frac = r.maxStamina > 0 ? r.stamina / r.maxStamina : 1;
    var ctrl = frac >= C.STEER_FADE_AT ? 1 : 0.35 + 0.65 * (frac / C.STEER_FADE_AT);
    // ease toward the target (smooth, never instant), capped per real second; slow-mo makes it more precise
    var diff = W(target - cur);
    var step = diff * (1 - Math.exp(-C.STEER_TURN_EASE * dtSec)) * ctrl;
    var maxTurn = Phaser.Math.DegToRad(swims ? C.STEER_TURN_WATER : C.STEER_TURN_AIR) * dtSec;
    var ang = cur + Phaser.Math.Clamp(step, -maxTurn, maxTurn);
    if (under && thrust > 0 && speed < C.STEER_MAX_SWIM_SPEED) speed += C.STEER_THRUST_WATER * thrust * ctrl * (dtSec * 60) * ts;
    M.Body.setVelocity(b, { x: Math.cos(ang) * speed, y: Math.sin(ang) * speed });
    // heading arrow on the rescuer
    if (swipe && push > 0) {
      var ax = b.position.x + Math.cos(target) * (r.radius + 40), ay = b.position.y + Math.sin(target) * (r.radius + 40);
      this.arc.lineStyle(3, 0xe9fbff, 0.8); this.arc.lineBetween(b.position.x, b.position.y, ax, ay);
      this.arc.fillStyle(0xe9fbff, 0.9); this.arc.fillCircle(ax, ay, 6);
    }
    // stamina is measured in game time: slow-motion stretches it in real seconds; resting the thumb in the middle costs less
    r.stamina = Math.max(0, r.stamina - dtSec * ts * (swipe && push === 0 ? 0.4 : 1));
    r.steeredFrames = (r.steeredFrames || 0) + 1;
    if (r.steeredFrames === 1) TT.Haptics.buzz(8);
  }
  // stamina arc beside the rescuer (only once steering has started)
  if (r.steeredFrames && r.maxStamina > 0) {
    var f = r.stamina / r.maxStamina;
    var rad = r.radius + 12;
    this.arc.lineStyle(4, 0x0b2230, 0.45);
    this.arc.beginPath(); this.arc.arc(r.sprite.x, r.sprite.y, rad, -Math.PI * 0.9, -Math.PI * 0.1); this.arc.strokePath();
    if (f > 0) {
      this.arc.lineStyle(4, f > 0.3 ? 0x9ff0d8 : 0xffc06a, active ? 1 : 0.7);
      this.arc.beginPath(); this.arc.arc(r.sprite.x, r.sprite.y, rad, -Math.PI * 0.9, -Math.PI * 0.9 + Math.PI * 0.8 * f); this.arc.strokePath();
    }
  }
};

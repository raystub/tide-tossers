// Tide Tossers v0.2 — post-launch steering with a stamina bar, and tap-vs-hold detection.
// Two modes (saved per player, toggle on the level-select screen):
//   'swipe' (phone default): a virtual stick appears where your finger lands; drag it in the direction to swim.
//   'point' (desktop default): the rescuer swims toward the pointer.
window.TT = window.TT || {};

TT.Steering = function (scene) {
  this.scene = scene;
  this.down = false;
  this.steering = false;
  this.usedThisPress = false;
  this.t0 = 0; this.x0 = 0; this.y0 = 0;
  this.pointer = null;
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

TT.Steering.prototype.press = function (pointer) {
  this.down = true; this.steering = false; this.usedThisPress = false;
  this.t0 = this.scene.time.now; this.x0 = pointer.x; this.y0 = pointer.y; this.pointer = pointer;
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

// Called every frame while a rescuer is in flight. timeScale = current physics speed (slow-mo < 1).
TT.Steering.prototype.update = function (r, water, dtSec, timeScale) {
  var C = TT.CFG, M = Phaser.Physics.Matter.Matter;
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
  var active = this.isActive(r);
  if (active) {
    this.usedThisPress = true;
    var b = r.body;
    var under = water.isUnder(b.position.y);
    var swims = under || r.gliding;
    var bv = TT.vel(b), vx = bv.x, vy = bv.y, speed = Math.sqrt(vx * vx + vy * vy);
    var cur = speed > 0.4 ? Math.atan2(vy, vx) : 0, target = cur, wp = null;
    if (this.mode === 'swipe') {
      var sx = p.x - this.x0, sy = p.y - this.y0, sl = Math.sqrt(sx * sx + sy * sy);
      if (sl > C.SWIPE_DEADZONE) target = Math.atan2(sy, sx);
      // the on-screen stick (screen space)
      var R = C.SWIPE_STICK_RADIUS, k = Math.min(1, sl / R);
      this.stick.lineStyle(3, 0xe9fbff, 0.55); this.stick.strokeCircle(this.x0, this.y0, R);
      this.stick.fillStyle(0xe9fbff, 0.12); this.stick.fillCircle(this.x0, this.y0, R);
      this.stick.fillStyle(0xe9fbff, 0.8);
      this.stick.fillCircle(this.x0 + (sl ? sx / sl : 0) * R * k, this.y0 + (sl ? sy / sl : 0) * R * k, 18);
      // heading arrow on the rescuer
      if (sl > C.SWIPE_DEADZONE) {
        var ax = b.position.x + Math.cos(target) * (r.radius + 40), ay = b.position.y + Math.sin(target) * (r.radius + 40);
        this.arc.lineStyle(3, 0xe9fbff, 0.8); this.arc.lineBetween(b.position.x, b.position.y, ax, ay);
        this.arc.fillStyle(0xe9fbff, 0.9); this.arc.fillCircle(ax, ay, 6);
      }
    } else {
      wp = scene.cameras.main.getWorldPoint(p.x, p.y);
      target = Math.atan2(wp.y - b.position.y, wp.x - b.position.x);
      if (speed <= 0.4) cur = target;
      this.arc.lineStyle(2, 0xe9fbff, 0.35); this.arc.lineBetween(b.position.x, b.position.y, wp.x, wp.y);
      this.arc.lineStyle(3, 0xe9fbff, 0.8); this.arc.strokeCircle(wp.x, wp.y, TT.MOBILE ? 22 : 14);
    }
    // turn toward the target (rate per real second, so slow-motion makes steering more precise)
    var maxTurn = Phaser.Math.DegToRad(swims ? C.STEER_TURN_WATER : C.STEER_TURN_AIR) * dtSec;
    var diff = Phaser.Math.Angle.Wrap(target - cur);
    var ang = cur + Phaser.Math.Clamp(diff, -maxTurn, maxTurn);
    if (under && speed < C.STEER_MAX_SWIM_SPEED) speed += C.STEER_THRUST_WATER * (dtSec * 60) * ts;
    M.Body.setVelocity(b, { x: Math.cos(ang) * speed, y: Math.sin(ang) * speed });
    // stamina is measured in game time: slow-motion stretches it in real seconds
    r.stamina = Math.max(0, r.stamina - dtSec * ts);
    r.steeredFrames = (r.steeredFrames || 0) + 1;
    if (r.steeredFrames === 1) TT.Haptics.buzz(8);
  }
  // stamina arc beside the rescuer (only once steering has started)
  if (r.steeredFrames && r.maxStamina > 0) {
    var frac = r.stamina / r.maxStamina;
    var rad = r.radius + 12;
    this.arc.lineStyle(4, 0x0b2230, 0.45);
    this.arc.beginPath(); this.arc.arc(r.sprite.x, r.sprite.y, rad, -Math.PI * 0.9, -Math.PI * 0.1); this.arc.strokePath();
    if (frac > 0) {
      this.arc.lineStyle(4, frac > 0.3 ? 0x9ff0d8 : 0xffc06a, active ? 1 : 0.7);
      this.arc.beginPath(); this.arc.arc(r.sprite.x, r.sprite.y, rad, -Math.PI * 0.9, -Math.PI * 0.9 + Math.PI * 0.8 * frac); this.arc.strokePath();
    }
  }
};

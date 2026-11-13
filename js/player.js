// Tide Tossers v0.5 — the player: a team of rescuers, one in the water at a time.
// Swim model (per physics step): underwater the creature eases toward the stick's heading at its top speed and coasts
// to a stop when the stick is released; in the air gravity takes over (leaps are real arcs). Abilities are short
// boosts or bursts on a cooldown; freeing an animal recharges them.
window.TT = window.TT || {};

TT.Player = function (game, team, x, y) {
  var C = TT.CFG, D = game.D;
  this.game = game;
  this.team = team.map(function (id) {
    var def = C.RESCUERS[id];
    return { id: id, def: def, cdMax: def.cd * D.cd, cdLeft: 0, airMax: def.air || 0, air: def.air || 0 };
  });
  this.outOfAir = false; this.lastAirBeep = 0;
  this.airG = game.add.graphics().setDepth(12);
  this.index = 0;
  this.input = { x: 0, y: 0, push: 0 };   // set by Controls (or the test bot) every frame
  this.heading = 0;                        // radians, direction of travel / facing
  this.stunUntil = 0; this.swapReadyAt = 0; this.shield = false;
  this.trail = [];                         // recent positions; the rescued school follows this
  this.lastSplash = -10; this.wasUnder = false;
  this.ent = null;
  this.spawn(x, y, { x: 0, y: 0 });
};

TT.Player.prototype.member = function () { return this.team[this.index]; };
TT.Player.prototype.id = function () { return this.team[this.index].id; };
TT.Player.prototype.pos = function () { return this.ent.body.position; };
TT.Player.prototype.stunned = function () { return this.game.clock < this.stunUntil; };

TT.Player.prototype.spawn = function (x, y, vel) {
  var M = Phaser.Physics.Matter.Matter, g = this.game;
  var e = this.ent = TT.Entities.rescuer(g, this.id(), x, y);
  e.boostUntil = 0; e.boostSpeed = 0; e.gliding = false; e.leaping = false; e.inflated = false;
  e.piercing = false; e.ramming = false; e.pierceVel = { x: 0, y: 0 };
  M.Body.setVelocity(e.body, vel);
  e.sprite.setRotation(this.heading).setFlipY(Math.cos(this.heading) < 0);
  this.wasUnder = g.water.isUnder(y);
};

// ---------- physics step ----------
TT.Player.prototype.step = function () {
  var C = TT.CFG, A = C.ABILITY, M = Phaser.Physics.Matter.Matter, g = this.game, k = TT.STEP;
  var e = this.ent, b = e.body, def = e.def, now = g.clock;
  var v = TT.vel(b), vx = v.x, vy = v.y, inp = this.input;
  var under = g.water.isUnder(b.position.y);
  // leaving the water: boosts end and speed is capped, so a dash near the surface is a hop, not a launch
  if (e.wasUnderStep && !under) {
    var leap = e.leaping, cap = leap ? C.LEAP_EXIT_MAX : C.BREACH_MAX_SPEED, sp0 = Math.sqrt(vx * vx + vy * vy);
    if (!leap) { this.endBoost(); e.boostUntil = 0; }
    if (sp0 > cap) { vx *= cap / sp0; vy *= cap / sp0; }
  }
  e.wasUnderStep = under;
  e.submerged = under;

  // glide (flying fish): starts when a leap clears the surface
  if (e.leaping && !under) { e.leaping = false; e.gliding = true; e.glideUntil = now + A.glideTime; g.sfx.play('whoosh'); }
  if (e.gliding && (now > e.glideUntil || under)) e.gliding = false;
  b.ignoreGravity = under || e.gliding;

  if (this.stunned()) {
    if (under) { var kd = Math.pow(0.94, k); vx *= kd; vy *= kd; }
    M.Body.setVelocity(b, { x: vx, y: vy });
    return;
  }

  var ix = inp.x, iy = inp.y, push = inp.push;
  if (this.outOfAir && under) {
    // out of breath: the creature heads straight up for air whatever the stick says
    this.endBoost(); e.boostUntil = 0;
    var rise = C.AIR_OUT_RISE, ra = 1 - Math.pow(1 - 0.12, k);
    vx += (ix * push * 1.5 - vx) * ra; vy += (-rise - vy) * ra;
    M.Body.setVelocity(b, { x: vx, y: vy });
    return;
  }
  if (push > 0 && under) { var ah = this.assist(b.position, Math.atan2(iy, ix)); ix = Math.cos(ah); iy = Math.sin(ah); }

  var boosting = now < e.boostUntil;
  if (!boosting && (e.piercing || e.ramming || e.shoving || e.spinning)) this.endBoost();

  if (boosting) {
    // hold the boost speed along the heading; the stick can bend the path a little
    var hx = Math.cos(this.heading), hy = Math.sin(this.heading);
    if (push > 0) {
      var bend = 1 - Math.pow(1 - 0.05, k);
      hx += (ix - hx) * bend; hy += (iy - hy) * bend;
      var hl = Math.sqrt(hx * hx + hy * hy) || 1; hx /= hl; hy /= hl;
      this.heading = Math.atan2(hy, hx);
    }
    vx = hx * e.boostSpeed; vy = hy * e.boostSpeed;
    if (e.piercing) { e.pierceVel.x = vx; e.pierceVel.y = vy; }
  } else if (e.gliding) {
    var gs = A.glideSpeed, ga = 1 - Math.pow(1 - 0.08, k);
    var gx = push > 0 ? ix : Math.cos(this.heading), gy = push > 0 ? iy * 0.6 : 0.12;
    vx += (gx * gs - vx) * ga; vy += (gy * gs - vy) * ga;
  } else if (under) {
    var cur = g.water.currentAt(b.position.x, b.position.y, this._cur || (this._cur = { x: 0, y: 0 }));
    if (now < (e.gripUntil || 0)) { cur.x = 0; cur.y = 0; var gk = Math.pow(0.8, k); vx *= gk; vy *= gk; M.Body.setVelocity(b, { x: vx, y: vy }); return; }
    if (push > 0) {
      var sp = def.speed * (C.STICK_MIN_PUSH + (1 - C.STICK_MIN_PUSH) * push) * (e.inflated ? 0.6 : 1);
      var a = 1 - Math.pow(1 - def.accel, k);
      vx += (ix * sp - vx) * a; vy += (iy * sp - vy) * a;
    } else {
      var d = Math.pow(1 - C.SWIM_IDLE_DRAG, k);
      vx *= d; vy *= d;
    }
    vx += cur.x * k; vy += cur.y * k;
  } else {
    // airborne: gravity does the work, the stick only nudges sideways
    if (push > 0) vx += ix * push * C.SWIM_AIR_CONTROL * k;
    // stranded on a rock or sandbar: flop back toward the water
    if (vx * vx + vy * vy < 1.5) {
      e.strandedAt = e.strandedAt || now;
      if (now - e.strandedAt > 0.22) { e.strandedAt = 0; vy = -C.FLOP_HOP; vx = (push > 0 && Math.abs(ix) > 0.2 ? (ix > 0 ? 1 : -1) : (Math.cos(this.heading) >= 0 ? 1 : -1)) * C.FLOP_HOP * 0.7; g.sfx.play('breach'); }
    } else e.strandedAt = 0;
  }
  M.Body.setVelocity(b, { x: vx, y: vy });

  // trail for the rescued school
  var t = this.trail, last = t[t.length - 1], px = b.position.x, py = b.position.y;
  if (!last || (px - last.x) * (px - last.x) + (py - last.y) * (py - last.y) > 36) {
    t.push({ x: px, y: py }); if (t.length > 420) t.shift();
  }
};

// After each physics step: resolve things collisions asked for.
TT.Player.prototype.afterStep = function () {
  var M = Phaser.Physics.Matter.Matter, e = this.ent, g = this.game;
  if (e.restoreVel) { M.Body.setVelocity(e.body, e.restoreVel); e.restoreVel = null; }
  if (e.stopDead) {
    e.stopDead = false; this.endBoost(); e.boostUntil = 0;
    M.Body.setVelocity(e.body, { x: 0, y: 0 });
    g.flash(e.body.position.x, e.body.position.y - 30, 'Concrete stops a swordfish');
  }
};

// A boost ends early when the creature slams into something it can't go through.
TT.Player.prototype.onBump = function (other, rel) {
  var e = this.ent;
  if (this.game.clock < e.boostUntil && !e.piercing && rel > 3 && other.alive !== false) {
    if (e.pushing && (other.kind === 'container' || other.kind === 'object')) return;   // the manatee ploughs on
    if (e.spinning && (other.kind === 'static' || other.kind === 'floor')) {
      // the sea lion twists off the rock and keeps going
      var v = TT.vel(e.body), b = e.body, n = other.body && other.body.position ? { x: b.position.x - other.body.position.x, y: b.position.y - other.body.position.y } : { x: 0, y: -1 };
      if (other.kind === 'floor') n = { x: 0, y: -1 };
      var nl = Math.sqrt(n.x * n.x + n.y * n.y) || 1; n.x /= nl; n.y /= nl;
      var dot = v.x * n.x + v.y * n.y;
      if (dot < 0) this.heading = Math.atan2(v.y - 2 * dot * n.y, v.x - 2 * dot * n.x);
      this.game.fx.ring(b.position.x, b.position.y, 40, 0xbff3ff);
      return;
    }
    if (other.kind === 'static' || other.kind === 'floor' || other.kind === 'container' || other.kind === 'coral' || (other.kind === 'object' && other.alive)) {
      e.boostUntil = Math.min(e.boostUntil, this.game.clock + 0.05);
    }
  }
};

TT.Player.prototype.endBoost = function () {
  var M = Phaser.Physics.Matter.Matter, e = this.ent;
  e.piercing = false; e.ramming = false; e.pushing = false; e.spinning = false;
  if (e.shoving) { e.shoving = false; M.Body.setMass(e.body, e.baseMass); }
};

// Steer-assist: if the stick points roughly at a nearby net or trap, bend the heading onto it.
TT.Player.prototype.assist = function (pos, heading) {
  var C = TT.CFG, cs = this.game.containers, best = null, bestOff = Phaser.Math.DegToRad(C.STEER_ASSIST_ANGLE), W = Phaser.Math.Angle.Wrap;
  if (!C.STEER_ASSIST_STRENGTH) return heading;
  for (var i = 0; i < cs.length; i++) {
    var c = cs[i]; if (!c.alive) continue;
    var dx = c.sprite.x - pos.x, dy = c.sprite.y - pos.y, d2 = dx * dx + dy * dy;
    if (d2 > C.STEER_ASSIST_RANGE * C.STEER_ASSIST_RANGE || d2 < 100) continue;
    var ang = Math.atan2(dy, dx), off = Math.abs(W(ang - heading));
    if (off < bestOff) { bestOff = off; best = ang; }
  }
  return best === null ? heading : heading + W(best - heading) * C.STEER_ASSIST_STRENGTH;
};

// ---------- per-frame visuals ----------
TT.Player.prototype.update = function (dt) {
  var C = TT.CFG, g = this.game, e = this.ent, b = e.body, v = TT.vel(b), W = Phaser.Math.Angle.Wrap;
  var sp = Math.sqrt(v.x * v.x + v.y * v.y), under = g.water.isUnder(b.position.y), now = g.clock;
  // cooldowns for the whole team
  for (var i = 0; i < this.team.length; i++) {
    var m = this.team[i];
    if (m.cdLeft > 0) { m.cdLeft = Math.max(0, m.cdLeft - dt); if (m.cdLeft === 0 && i === this.index) g.sfx.play('ready'); }
  }
  if (e.inflated && now > e.inflateUntil) this.deflate();
  this.updateAir(dt, under, now < e.boostUntil);
  // heading follows the velocity; when nearly still, settle level
  var boosting = now < e.boostUntil;
  if (!boosting) {
    if (sp > 0.7) this.heading = Math.atan2(v.y, v.x);
    else this.heading += W((Math.cos(this.heading) < 0 ? Math.PI : 0) - this.heading) * Math.min(1, dt * 3);
  }
  var spr = e.sprite, rot = spr.rotation + W(this.heading - spr.rotation) * Math.min(1, dt * C.SWIM_TURN_EASE);
  if (this.stunned()) rot += Math.sin(now * 40) * 0.08;
  if (!e.inflated) spr.setRotation(rot).setFlipY(Math.cos(rot) < 0);
  TT.Art.swimRate(spr, e.inflated ? 0 : 0.5 + sp / 4 + (this.input.push > 0 ? 0.6 : 0));
  // surface crossing
  if (under !== this.wasUnder) {
    this.wasUnder = under;
    if (now - this.lastSplash > 0.15) {
      this.lastSplash = now;
      var heavy = e.id === 'loggerhead' || e.id === 'hammerhead' || e.id === 'manatee' || e.id === 'sealion';
      g.fx.splash(b.position.x, g.water.y, heavy || sp > 9);
      g.sfx.play(under ? 'splash' : 'breach'); TT.Haptics.buzz(under ? 12 : 6);
    }
  }
  // bubbles and trails
  if (under && (boosting ? true : Math.random() < 0.06 + sp * 0.02)) g.fx.bubbles(b.position.x - Math.cos(this.heading) * e.radius, b.position.y - Math.sin(this.heading) * e.radius, 1);
  if (this.shield && Math.random() < 0.3) g.fx.sparkle(b.position.x + (Math.random() - 0.5) * 50, b.position.y + (Math.random() - 0.5) * 50);
};

// ---------- air (air-breathing rescuers) ----------
TT.Player.prototype.breathing = function () {
  var b = this.ent.body, g = this.game;
  return !g.water.isUnder(b.position.y - this.ent.radius * 0.5 - TT.CFG.AIR_SURFACE_PAD);
};
TT.Player.prototype.updateAir = function (dt, under, boosting) {
  var C = TT.CFG, g = this.game, e = this.ent, b = e.body, gr = this.airG, self = this;
  this.team.forEach(function (m, i) {
    if (!m.airMax) return;
    if (i !== self.index || self.breathing()) m.air = Math.min(m.airMax, m.air + m.airMax * C.AIR_REFILL * dt);
    else if (g.state === 'play') m.air = Math.max(0, m.air - dt * (boosting ? C.AIR_BOOST_DRAIN : 1));
  });
  var m = this.member();
  gr.clear();
  if (!m.airMax) { this.outOfAir = false; return; }
  var frac = m.air / m.airMax;
  if (frac <= 0 && !this.outOfAir && g.state === 'play') {
    this.outOfAir = true;
    g.flash(b.position.x, b.position.y - 40, 'Out of air!', '#ffb39a', 20); g.sfx.play('sting'); TT.Haptics.buzz([30, 30, 30]);
  }
  if (this.outOfAir && this.breathing()) { this.outOfAir = false; g.flash(b.position.x, b.position.y - 40, 'Breath!', '#bff3ff'); g.sfx.play('ready'); }
  var low = frac < C.AIR_LOW;
  if (low && under && g.state === 'play' && g.clock - this.lastAirBeep > 1) { this.lastAirBeep = g.clock; g.sfx.play('tick'); }
  if (frac >= 0.999) return;
  // the breath ring: a bubble arc around the creature that empties as it holds its breath
  var x = b.position.x, y = b.position.y, R = e.radius + 16;
  gr.lineStyle(7, 0x02131c, 0.45); gr.strokeCircle(x, y, R);
  gr.lineStyle(5, low ? 0xff6b4a : 0xbff3ff, low ? 0.7 + 0.3 * Math.sin(g.clock * 12) : 0.9);
  gr.beginPath(); gr.arc(x, y, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac, false); gr.strokePath();
};

// ---------- abilities ----------
TT.Player.prototype.ready = function () { var g = this.game; return this.member().cdLeft <= 0 && !this.stunned() && !this.outOfAir && !(g.puzzle && g.movesLeft <= 0); };
// true while an ability is doing the hitting (Puzzle mode only counts these)
TT.Player.prototype.charging = function () { var e = this.ent; return this.game.clock < e.boostUntil + 0.15 || e.inflated || e.gliding || this.game.clock < (e.gripUntil || 0); };

TT.Player.prototype.boost = function (speed, time) {
  var e = this.ent;
  e.boostSpeed = speed; e.boostUntil = this.game.clock + time;
};

TT.Player.prototype.useAbility = function () {
  var A = TT.CFG.ABILITY, M = Phaser.Physics.Matter.Matter, g = this.game, e = this.ent, b = e.body, m = this.member();
  if (g.state !== 'play' || !this.ready()) return false;
  var under = g.water.isUnder(b.position.y), inp = this.input;
  // aim along the stick if it's pushed, otherwise straight ahead
  if (inp.push > 0 && !(this.game.clock < e.boostUntil)) this.heading = Math.atan2(inp.y, inp.x);
  var hx = Math.cos(this.heading), hy = Math.sin(this.heading), x = b.position.x, y = b.position.y;
  switch (e.id) {
    case 'tang':
      this.boost(A.dashSpeed, A.dashTime); g.fx.bubbles(x, y, 10); g.sfx.play('dash');
      break;
    case 'flyingfish':
      if (under) {
        hy -= A.leapUp; var l = Math.sqrt(hx * hx + hy * hy) || 1; this.heading = Math.atan2(hy / l, hx / l);
        this.boost(A.leapSpeed, 0.28); e.leaping = true; g.fx.bubbles(x, y, 8); g.sfx.play('dash');
      } else { e.gliding = true; e.glideUntil = g.clock + A.glideTime; g.sfx.play('whoosh'); }
      break;
    case 'puffer':
      this.inflate();
      break;
    case 'pistolshrimp':
      if (!under) { g.flash(x, y - 30, 'Snaps only work underwater'); return false; }
      g.snap(x + hx * 30, y + hy * 30, A.snapRadius, e); g.sfx.play('snap');
      break;
    case 'loggerhead':
      this.boost(A.shoveSpeed, A.shoveTime); e.shoving = true; M.Body.setMass(b, e.baseMass * A.shoveMassMult);
      g.fx.bubbles(x, y, 12); g.sfx.play('whoosh');
      break;
    case 'swordfish':
      this.boost(A.pierceSpeed, A.pierceTime); e.piercing = true; e.pierceVel = { x: hx * A.pierceSpeed, y: hy * A.pierceSpeed };
      g.sfx.play('dash');
      break;
    case 'hammerhead':
      this.boost(A.ramSpeed, A.ramTime); e.ramming = true; g.fx.bubbles(x, y, 8); g.sfx.play('dash');
      break;
    case 'sheepshead':
      this.boost(A.crunchDash, 0.14);
      g.crunch(x + hx * (e.radius + 22), y + hy * (e.radius + 22), A.crunchRadius, e); g.sfx.play('snap');
      break;
    case 'sealion':
      this.boost(A.spinSpeed, A.spinTime); e.spinning = true; g.fx.bubbles(x, y, 12); g.fx.ring(x, y, 46, 0xbff3ff); g.sfx.play('whoosh');
      break;
    case 'iguana':
      e.gripUntil = g.clock + A.gripTime; g.crunch(x + hx * (e.radius + 14), y + hy * (e.radius + 14), A.gripRadius, e, A.gripDamage, A.gripDamage * 0.4); g.sfx.play('snap');
      break;
    case 'penguin':
      this.boost(A.burstSpeed, A.burstTime); g.fx.bubbles(x, y, 8); g.sfx.play('dash');
      break;
    case 'bullhead':
      this.boost(7, 0.16);
      g.crunch(x + hx * (e.radius + 24), y + hy * (e.radius + 24), A.crushRadius, e, A.crushHard, A.crushOther, true); g.sfx.play('crack');
      break;
    case 'manatee':
      this.boost(A.pushSpeed, A.pushTime); e.shoving = true; e.pushing = true; M.Body.setMass(b, e.baseMass * A.pushMassMult);
      g.fx.bubbles(x, y, 16); g.fx.ring(x + hx * 30, y + hy * 30, 50, 0xbff3ff); g.sfx.play('whoosh');
      break;
  }
  m.cdLeft = m.cdMax;
  g.onAbilityUsed();
  TT.Haptics.buzz(18);
  g.tutorial.onAbility();
  return true;
};

TT.Player.prototype.inflate = function () {
  var A = TT.CFG.ABILITY, M = Phaser.Physics.Matter.Matter, g = this.game, e = this.ent, b = e.body, spr = e.sprite;
  var roundKey = TT.Art.speciesKey(g, 'puffer_inflated');
  var roundS = (e.radius * 2.3) / g.textures.get(roundKey).getSourceImage().width;
  spr.anims.stop(); spr.setTexture(roundKey); spr.setRotation(0).setFlipY(false);
  spr.setScale(roundS);                                     // Phaser also scales the body...
  M.Body.scale(b, e.baseScale / roundS, e.baseScale / roundS); // ...so undo that: body radius unchanged
  e.roundS = roundS; e.inflated = true; e.inflateUntil = g.clock + A.inflateTime;
  g.tweens.add({ targets: spr, scale: roundS * A.inflateScale, duration: 160, ease: 'Back.easeOut',
    onUpdate: function () { M.Body.setMass(b, e.baseMass * 1.5); } });
  var x = b.position.x, y = b.position.y;
  g.radialPush(x, y, A.inflateRadius, A.inflateForce, e);
  g.objects.forEach(function (o) {
    if (!o.alive) return;
    var d = Phaser.Math.Distance.Between(x, y, o.body.position.x, o.body.position.y);
    if (d < A.inflateRadius && (o.material === 'plastic' || o.material === 'glass')) TT.Entities.damage(g, o, A.inflateDamage, e);
  });
  g.lionfishNear(x, y, A.inflateRadius);
  g.fx.ring(x, y, A.inflateRadius, 0xf2e6b8); g.sfx.play('puff');
};

TT.Player.prototype.deflate = function () {
  var M = Phaser.Physics.Matter.Matter, g = this.game, e = this.ent, b = e.body, spr = e.sprite;
  if (!e.inflated) return;
  e.inflated = false;
  g.tweens.killTweensOf(spr);
  spr.setScale(e.roundS);                                   // body back to its normal radius
  spr.setTexture(TT.Art.speciesKey(g, 'puffer'));
  spr.setScale(e.baseScale);
  M.Body.scale(b, e.roundS / e.baseScale, e.roundS / e.baseScale);
  M.Body.setMass(b, e.baseMass);
  TT.Art.playSwim(spr, 'puffer');
  g.fx.bubbles(b.position.x, b.position.y, 8);
};

// ---------- team ----------
TT.Player.prototype.swap = function (toIndex) {
  var g = this.game, e = this.ent;
  if (g.state !== 'play' || this.team.length < 2 || g.clock < this.swapReadyAt || this.stunned()) return false;
  var next = toIndex === undefined ? (this.index + 1) % this.team.length : toIndex;
  if (next === this.index) return false;
  if (e.inflated) this.deflate();
  this.endBoost();
  var x = e.body.position.x, y = e.body.position.y, v = TT.vel(e.body), vel = { x: v.x, y: v.y };
  e.alive = false;
  g.removeQueue.push(e.body);
  e.sprite.destroy();
  this.index = next; this.outOfAir = false;
  this.spawn(x, y, vel);
  this.swapReadyAt = g.clock + TT.CFG.SWAP_COOLDOWN;
  g.fx.bubbles(x, y, 16); g.fx.ring(x, y, 60, 0xbff3ff); g.sfx.play('swap'); TT.Haptics.buzz(10);
  g.cameras.main.startFollow(this.ent.sprite, false, TT.CFG.CAMERA_LERP, TT.CFG.CAMERA_LERP);
  g.tutorial.onSwap();
  return true;
};

// Freeing an animal recharges every ability.
TT.Player.prototype.recharge = function () { this.team.forEach(function (m) { m.cdLeft = 0; }); };

// Lionfish spines: knocked back, no control for a moment, ability on cooldown.
TT.Player.prototype.sting = function (fromX, fromY) {
  var C = TT.CFG, M = Phaser.Physics.Matter.Matter, g = this.game, e = this.ent, b = e.body;
  if (this.stunned()) return false;
  if (this.shield) { this.shield = false; g.flash(b.position.x, b.position.y - 30, 'Bubble Shield popped', '#bff3ff'); g.fx.ring(b.position.x, b.position.y, 70, 0xbff3ff); g.sfx.play('shield'); this.stunUntil = g.clock + 0.3; return false; }
  var dx = b.position.x - fromX, dy = b.position.y - fromY, d = Math.sqrt(dx * dx + dy * dy) || 1;
  this.endBoost(); e.boostUntil = 0; e.gliding = false; e.leaping = false;
  M.Body.setVelocity(b, { x: dx / d * 7, y: dy / d * 7 - 1 });
  this.stunUntil = g.clock + C.STUN_TIME;
  this.member().cdLeft = this.member().cdMax;
  return true;
};

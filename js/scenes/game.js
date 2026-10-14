// Tide Tossers v0.2 — GameScene: aim, launch, steer, collisions, reef health, win/lose.
window.TT = window.TT || {};

TT.GameScene = new Phaser.Class({
  Extends: Phaser.Scene,
  initialize: function GameScene() { Phaser.Scene.call(this, { key: 'Game' }); },

  init: function (data) {
    this.levelId = (data && data.levelId) || '1-1';
  },

  create: function () {
    var C = TT.CFG, self = this;
    var level = this.level = TT.levelById(this.levelId);
    this.difficulty = TT.Save.difficulty();
    var D = this.D = C.DIFFICULTY[this.difficulty];
    this.sfx = TT.Sfx;
    // Phaser reuses this scene object on restart, so reset every per-level field here.
    this.state = 'aim'; this.winPending = 0; this.result = null; this.shots = 0; this.current = null;
    this.uiBlocking = false; this.dragging = false; this.panning = null; this.calmSince = 0; this.settleStart = 0;
    this.aimSprite = null; this.gadgetName = ''; this.pressInfo = null; this.aimAnchor = null;
    this.timeScale = 1; this.tutorialSlow = false;
    this.score = 0;
    this.health = level.startHealth;
    this.removeQueue = [];
    this.lastSilt = 0;
    this.msgs = [];

    // The view can be wider than the level on long phones: extend the world equally on both sides.
    var pad = Math.max(0, Math.round((C.WIDTH - level.width) / 2));
    var ext = this.ext = { x0: -pad, w: level.width + 2 * pad };
    var cam = this.cameras.main;
    cam.setBounds(ext.x0, 0, ext.w, C.HEIGHT);
    cam.setBackgroundColor('#0a2a3a');
    this.matter.world.setGravity(0, C.GRAVITY_Y);

    // ---------- scene layers ----------
    var bg = TT.Art.backgroundTextures(this, level.background, ext.w + 200);
    this.add.image(ext.x0 - 100, 0, bg.air).setOrigin(0, 0).setDepth(0).setScrollFactor(0.6, 1).setDisplaySize(ext.w + 200, C.HEIGHT);
    this.water = new TT.Water(this, level, bg);
    this.add.image(ext.x0 - 100, C.FLOOR_Y - 10, bg.floor).setOrigin(0, 0).setDepth(2);
    this.fx = new TT.FX(this);
    this.ocean = new TT.Ocean(this, level, this.water);

    // ---------- physics bodies ----------
    var floor = this.matter.add.rectangle(ext.x0 + ext.w / 2, C.FLOOR_Y + 60, ext.w + 800, 120, { isStatic: true, friction: 0.9 });
    floor.tt = { kind: 'floor', alive: true };
    var wl = this.matter.add.rectangle(ext.x0 - 25, 0, 50, 2800, { isStatic: true }); wl.tt = { kind: 'static', alive: true };
    var wr = this.matter.add.rectangle(ext.x0 + ext.w + 25, 0, 50, 2800, { isStatic: true }); wr.tt = { kind: 'static', alive: true };

    var hpMult = D.hp;
    this.statics = (level.statics || []).map(function (s, i) { return TT.Entities.staticBody(self, s, i); });
    this.corals = (level.coral || []).map(function (c, i) { return TT.Entities.coral(self, c, i); });
    this.objects = (level.objects || []).map(function (o) { return TT.Entities.junk(self, o, hpMult); });
    this.containers = (level.containers || []).map(function (c) { return TT.Entities.container(self, c, hpMult); });
    this.invasives = (level.invasives || []).map(function (l) { return TT.Entities.lionfish(self, l); });

    this.trapped = 0;
    this.containers.forEach(function (c) { self.trapped += c.animals.length; });
    this.totalAnimals = this.trapped;
    this.freed = 0;

    // reef-health budget: a clean run lands at ~95%
    var budget = 95 - level.startHealth;
    var nObj = this.objects.length, nInv = this.invasives.length;
    var invShare = nInv ? 0.15 : 0, objShare = nObj ? 0.25 : 0, aniShare = 1 - invShare - objShare;
    this.gain = {
      animal: budget * aniShare / Math.max(1, this.totalAnimals),
      object: nObj ? budget * objShare / nObj : 0,
      invasive: nInv ? budget * invShare / nInv : 0
    };
    this.ocean.setHealth(this.health, level.startHealth);

    // ---------- rescuer queue ----------
    var q = level.queue.slice();
    if (D.extraRescuers > 0) for (var e = 0; e < D.extraRescuers; e++) q.push(level.queue[e % level.queue.length]);
    if (D.extraRescuers < 0) q = q.slice(0, Math.max(1, q.length + D.extraRescuers));
    this.queue = q;
    this.current = null;

    // ---------- sling ----------
    this.sling = { x: level.sling.x, y: level.sling.y };
    this.slingBack = this.add.graphics().setDepth(8.4);
    this.slingFront = this.add.graphics().setDepth(9.6);
    this.band = this.add.graphics().setDepth(9.5);
    this.guide = this.add.graphics().setDepth(19);
    this.drawSlingFrame();
    this.pull = { x: 0, y: 0 };
    this.loadNext();

    // ---------- steering ----------
    this.steer = new TT.Steering(this);
    this.aimUI = this.add.graphics().setDepth(21).setScrollFactor(0);
    this.vignette = this.add.image(C.WIDTH / 2, C.HEIGHT / 2, 'vignette').setScrollFactor(0).setDepth(20.5)
      .setDisplaySize(C.WIDTH, C.HEIGHT).setAlpha(0);
    this.tutorial = new TT.Tutorial(this);

    // ---------- gadgets ----------
    this.gadgetUsed = false; this.sonarShot = false; this.kelpShot = false; this.netCutterArmed = false;
    if (level.grantGlow && !TT.Save.glowGranted(level.id)) {
      TT.Save.addGadget('glow'); TT.Save.markGlowGranted(level.id);
      this.time.delayedCall(800, function () { self.message('A free Glow Lure has been added to your gadgets.', 4000); });
    }

    // ---------- input ----------
    this.input.on('pointerdown', this.onDown, this);
    this.input.on('pointermove', this.onMove, this);
    this.input.on('pointerup', this.onUp, this);
    this.input.on('pointerupoutside', this.onUp, this);
    this.input.keyboard.on('keydown-SPACE', function () { if (self.state === 'flight' && self.current) TT.Entities.ability(self, self.current); });
    this.events.once('shutdown', function () { try { if (self.matter.world && self.matter.world.engine) self.matter.world.engine.timing.timeScale = 1; } catch (e) { /* already gone */ } });
    this.input.keyboard.on('keydown-R', function () { self.restartLevel(); });
    this.input.keyboard.on('keydown-ESC', function () { self.toMenu(); });

    // ---------- physics events ----------
    this.matter.world.on('beforeupdate', function () {
      var bodies = self.matter.world.localWorld.bodies;
      self.water.applyForces(bodies);
      var r = self.current;
      if (r && r.alive && r.diving && self.time.now < r.diveUntil) {
        Phaser.Physics.Matter.Matter.Body.applyForce(r.body, r.body.position, { x: 0, y: r.body.mass * TT.CFG.ABILITY.diveForce });
      }
    });
    this.matter.world.on('collisionstart', function (ev) {
      for (var i = 0; i < ev.pairs.length; i++) {
        var p = ev.pairs[i], a = p.bodyA.parent || p.bodyA, b = p.bodyB.parent || p.bodyB;
        if (!a.tt || !b.tt) continue;
        var va = TT.vel(a), vb = TT.vel(b), rvx = va.x - vb.x, rvy = va.y - vb.y;
        var rel = Math.sqrt(rvx * rvx + rvy * rvy);
        TT.Entities.impact(self, a.tt, b.tt, rel);
        if (rel > 6 && (a.tt.kind === 'rescuer' || b.tt.kind === 'rescuer')) { self.sfx.play('thud'); if (rel > 9) TT.Haptics.buzz(14); }
      }
    });
    this.matter.world.on('afterupdate', function () { self.afterPhysics(); });

    // ---------- HUD ----------
    if (this.scene.isActive('UI')) this.scene.stop('UI');
    this.scene.launch('UI', { game: this });

    this.events.once('shutdown', function () { self.input.removeAllListeners(); });
    this.cameras.main.fadeIn(350, 5, 20, 30);

    if (!TT.Save.hintSeen(level.id) && !this.tutorial.covers()) { TT.Save.markHintSeen(level.id); this.time.delayedCall(500, function () { self.message(level.hint, 7000); }); }

    // debug / test hooks
    window.__TT_GAME = this;
  },

  // ---------- sling ----------
  drawSlingFrame: function () {
    var x = this.sling.x, y = this.sling.y, base = y + 56;
    var gb = this.slingBack, gf = this.slingFront;
    gb.clear(); gf.clear();
    // driftwood fork: weathered grey-brown
    gb.lineStyle(9, 0x5d5446, 1); gb.beginPath(); gb.moveTo(x - 2, base); gb.lineTo(x - 4, y + 22); gb.lineTo(x - 18, y - 6); gb.strokePath();
    gf.lineStyle(9, 0x6e6453, 1); gf.beginPath(); gf.moveTo(x - 2, base); gf.lineTo(x - 2, y + 22); gf.lineTo(x + 16, y - 8); gf.strokePath();
    gf.lineStyle(2, 0x8f8572, 0.7); gf.beginPath(); gf.moveTo(x, base - 4); gf.lineTo(x, y + 24); gf.strokePath();
    this.tips = { back: { x: x - 18, y: y - 6 }, front: { x: x + 16, y: y - 8 } };
  },
  drawBand: function (px, py) {
    var g = this.band, t = this.tips;
    g.clear();
    g.lineStyle(6, 0x4d5a22, 1);
    g.beginPath(); g.moveTo(t.back.x, t.back.y); g.lineTo(px, py); g.lineTo(t.front.x, t.front.y); g.strokePath();
    g.lineStyle(2, 0x7d8a3a, 0.8);
    g.beginPath(); g.moveTo(t.back.x, t.back.y - 1); g.lineTo(px, py - 1); g.lineTo(t.front.x, t.front.y - 1); g.strokePath();
  },

  loadNext: function () {
    if (this.aimSprite) { this.aimSprite.destroy(); this.aimSprite = null; }
    if (!this.queue.length) { this.drawBand(this.sling.x, this.sling.y); return false; }
    var id = this.queue[0], key = TT.Art.speciesKey(this, id), def = TT.CFG.RESCUERS[id];
    var len = def.radius * (id === 'swordfish' ? 5.6 : id === 'hammerhead' ? 4.4 : id === 'loggerhead' ? 3.4 : 3.3);
    this.aimSprite = this.add.image(this.sling.x, this.sling.y, key).setDepth(9).setScale(TT.Art.scaleFor(this, key, len));
    this.drawBand(this.sling.x, this.sling.y);
    this.state = 'aim';
    return true;
  },

  // ---------- input ----------
  worldPoint: function (p) { return this.cameras.main.getWorldPoint(p.x, p.y); },
  onDown: function (p) {
    TT.Sfx.unlock();
    if (this.uiBlocking) return;
    var wp = this.worldPoint(p);
    this.events.emit('info-hide');
    if (this.netCutterArmed) { this.tryNetCut(wp); return; }
    if (this.state === 'aim' && this.aimSprite) {
      var d = Phaser.Math.Distance.Between(wp.x, wp.y, this.sling.x, this.sling.y);
      if (d < TT.CFG.SLING_GRAB_RADIUS && !this.infoAtSlingOnly(wp)) { this.dragging = 'sling'; this.onMove(p); return; }
      // decide on move: aim (left side), pan (right side, wide levels) or long-press info (no move)
      this.pressInfo = { x: p.x, y: p.y, t: this.time.now, wp: wp, decided: false };
      return;
    }
    if (this.state === 'flight') { this.steer.press(p); return; }
    this.pressInfo = { x: p.x, y: p.y, t: this.time.now, wp: wp, decided: false };
  },
  // pressing right on the waiting rescuer and holding still shows its info instead of aiming
  infoAtSlingOnly: function () { return false; },
  onMove: function (p) {
    var C = TT.CFG, pi = this.pressInfo;
    if (pi && !pi.decided && p.isDown && Phaser.Math.Distance.Between(pi.x, pi.y, p.x, p.y) > 10) {
      pi.decided = true; this.pressInfo = null;
      if (this.state === 'aim' && this.aimSprite && pi.x < C.WIDTH * C.AIM_ZONE) { this.dragging = 'rel'; this.aimAnchor = { x: pi.x, y: pi.y }; }
      else if (this.level.width > C.WIDTH) this.panning = { x: pi.x, sx: this.cameras.main.scrollX };
    }
    if (this.panning && p.isDown) { this.cameras.main.scrollX = this.panning.sx - (p.x - this.panning.x); return; }
    if (!this.dragging) return;
    var dx, dy;
    if (this.dragging === 'rel') { dx = p.x - this.aimAnchor.x; dy = p.y - this.aimAnchor.y; }
    else { var wp = this.worldPoint(p); dx = wp.x - this.sling.x; dy = wp.y - this.sling.y; }
    var len = Math.sqrt(dx * dx + dy * dy);
    if (len > C.SLING_MAX_PULL) { dx *= C.SLING_MAX_PULL / len; dy *= C.SLING_MAX_PULL / len; }
    this.pull.x = dx; this.pull.y = dy;
    var px = this.sling.x + dx, py = this.sling.y + dy;
    this.aimSprite.setPosition(px, py).setRotation(Math.atan2(-dy, -dx)).setFlipY(-dx < 0);
    this.drawBand(px, py);
    this.drawGuide();
    // relative aim: show where you started and how far you have pulled
    var g = this.aimUI; g.clear();
    if (this.dragging === 'rel') {
      var a = this.aimAnchor;
      g.lineStyle(2, 0xe9fbff, 0.45); g.strokeCircle(a.x, a.y, 16);
      g.lineStyle(3, 0xe9fbff, 0.6); g.lineBetween(a.x, a.y, a.x + dx, a.y + dy);
      g.fillStyle(0xe9fbff, 0.8); g.fillCircle(a.x + dx, a.y + dy, 10);
    }
  },
  onUp: function (p) {
    this.panning = null; this.pressInfo = null;
    if (this.dragging) {
      this.dragging = false; this.guide.clear(); this.aimUI.clear();
      var len = Math.sqrt(this.pull.x * this.pull.x + this.pull.y * this.pull.y);
      if (len > 20) this.launch(); else { this.aimSprite.setPosition(this.sling.x, this.sling.y).setRotation(0).setFlipY(false); this.drawBand(this.sling.x, this.sling.y); }
      return;
    }
    if (this.state === 'flight' && this.current) {
      if (this.steer.release(p)) { if (TT.Entities.ability(this, this.current)) TT.Haptics.buzz(20); }
    }
  },

  launchVelocity: function () {
    var C = TT.CFG, k = C.LAUNCH_SPEED_MAX / C.SLING_MAX_PULL * (this.kelpShot ? C.GADGETS.kelp.power : 1);
    return { x: -this.pull.x * k, y: -this.pull.y * k };
  },

  // Simulate a shot with the same gravity/water rules the physics uses (no steering, no collisions).
  // Returns the list of points the rescuer would pass through.
  simulate: function (pull, steps, rescuerId) {
    var C = TT.CFG, def = C.RESCUERS[rescuerId || this.queue[0]];
    var k = C.LAUNCH_SPEED_MAX / C.SLING_MAX_PULL * (this.kelpShot ? C.GADGETS.kelp.power : 1);
    var x = this.sling.x + pull.x, y = this.sling.y + pull.y, vx = -pull.x * k, vy = -pull.y * k;
    var wl = this.water.y, has = this.water.hasWater, skips = 0, r = def.radius, pts = [];
    var buoy = C.BUOYANCY[def.buoy], drag = C.WATER_DRAG * (def.buoy === 'darts' ? C.DARTER_DRAG_FACTOR : 1);
    for (var i = 0; i < steps; i++) {
      var f = has ? Phaser.Math.Clamp((y + r - wl) / (2 * r), 0, 1) : 0;
      vy += C.STEP_ACCEL * (1 - buoy * C.BUOYANCY_SCALE * f);
      vx *= (1 - C.RESCUER_AIR_FRICTION); vy *= (1 - C.RESCUER_AIR_FRICTION);
      if (f > 0) { vx *= (1 - drag * f); vy *= (1 - drag * f); }
      var py = y; x += vx; y += vy;
      if (has && py < wl && y >= wl && vy > 0) {
        var sp = Math.sqrt(vx * vx + vy * vy), ang = Math.atan2(vy, Math.abs(vx)) * 180 / Math.PI;
        if (ang < C.SKIP_MAX_ANGLE && sp > C.SKIP_MIN_SPEED && skips < C.MAX_SKIPS) { skips++; y = wl - 2; vx *= C.SKIP_VX_KEEP; vy = -vy * C.SKIP_BOUNCE; }
        else vx *= C.REFRACT_VX;
      }
      if (y > C.FLOOR_Y - r || x > this.ext.x0 + this.ext.w || x < this.ext.x0) break;
      pts.push({ x: x, y: y });
    }
    return pts;
  },

  // Aim guide: dots along the simulated path; its length depends on difficulty (or Sonar Scope).
  drawGuide: function () {
    var C = TT.CFG, g = this.guide; g.clear();
    var frac = this.sonarShot ? 1 : this.D.guide;
    if (frac <= 0) return;
    var steps = Math.round(C.GUIDE_STEPS * frac), pts = this.simulate(this.pull, steps);
    for (var i = 0; i < pts.length; i += 3) {
      g.fillStyle(0xffffff, 0.85 * (1 - i / (steps + 10))); g.fillCircle(pts[i].x, pts[i].y, 3.2 - 1.6 * i / steps);
    }
  },

  launch: function () {
    var C = TT.CFG, id = this.queue.shift();
    var px = this.sling.x + this.pull.x, py = this.sling.y + this.pull.y;
    var v = this.launchVelocity();
    this.aimSprite.destroy(); this.aimSprite = null;
    var r = TT.Entities.rescuer(this, id, px, py);
    r.sprite.setFixedRotation();
    Phaser.Physics.Matter.Matter.Body.setVelocity(r.body, v);
    r.launched = true; r.launchTime = this.time.now; r.slowSince = 0;
    r.maxStamina = r.stamina = TT.Steering.staminaFor(id, this.difficulty);
    r.prevY = py;
    this.current = r;
    this.state = 'flight';
    this.shots = (this.shots || 0) + 1;
    this.sonarShot = false; this.kelpShot = false;
    this.drawBand(this.sling.x, this.sling.y);
    this.sfx.play('launch'); TT.Haptics.buzz(12);
    this.tutorial.onLaunch();
    if (this.level.width > C.WIDTH) this.cameras.main.startFollow(r.sprite, true, 0.09, 0.09, -200, 0);
  },

  // ---------- per-frame ----------
  update: function (time, delta) {
    var C = TT.CFG, dt = Math.min(0.05, delta / 1000), self = this, t = time / 1000;
    // lights for dark levels
    var lights = [];
    if (this.level.dark) {
      (this.level.glowSpots || []).forEach(function (s, i) { lights.push({ x: s.x, y: s.y, r: C.GLOW_SPOT_RADIUS * (0.9 + 0.1 * Math.sin(t * 1.5 + i)), a: 0.9 }); });
      lights.push({ x: this.sling.x, y: this.sling.y, r: 120, a: 0.8 });
    }
    // lionfish patrol
    this.invasives.forEach(function (l) {
      if (!l.alive || l.fleeing) return;
      var nx = l.home.x + Math.sin(t * 0.5 + l.phase) * l.patrol, ny = l.home.y + Math.sin(t * 1.3 + l.phase) * 8;
      var dir = nx >= l.sprite.x ? 1 : -1;
      l.sprite.setPosition(nx, ny); l.sprite.setFlipX(dir < 0);
    });
    // trapped animals follow their container and struggle
    this.containers.forEach(function (c) {
      if (c.ctype === 'line' && c.alive) TT.Entities.drawLine(c, t);
      if (!c.animals.length) return;
      var cx = c.sprite.x, cy = c.sprite.y, rot = c.ctype === 'trap' ? c.sprite.rotation : 0, cs = Math.cos(rot), sn = Math.sin(rot);
      c.animals.forEach(function (a) {
        var ox = a.ox, oy = a.oy;
        a.sprite.setPosition(cx + ox * cs - oy * sn, cy + ox * sn + oy * cs);
        a.sprite.rotation = rot + Math.sin(t * 5 + a.phase) * 0.12;
        if (self.level.dark && Math.random() < 0.12) self.water.plankton(a.sprite.x + (Math.random() - 0.5) * 20, a.sprite.y);
      });
      if (self.level.dark) lights.push({ x: cx, y: cy, r: 38, a: 0.35 });
    });

    // rescuer in flight
    var r = this.current;
    if (this.state === 'flight' && r && r.alive) {
      var b = r.body, v = TT.vel(b), sp = Math.sqrt(v.x * v.x + v.y * v.y);
      var cross = this.water.checkCrossing(r);
      if (cross === 'skip') { this.fx.splash(b.position.x, this.water.y, false); this.sfx.play('skip'); TT.Haptics.buzz(8); }
      if (cross === 'enter') {
        var heavy = r.id === 'loggerhead' || r.id === 'hammerhead';
        this.fx.splash(b.position.x, this.water.y, heavy); this.sfx.play('splash'); TT.Haptics.buzz(heavy ? 22 : 12);
        if (heavy) this.radialPush(b.position.x, this.water.y + 20, C.HEAVY_SPLASH_RADIUS, C.HEAVY_SPLASH_FORCE, r);
      }
      this.steer.update(r, this.water, dt, this.timeScale);
      if (sp > 0.8) {
        var ang = Math.atan2(v.y, v.x);
        r.sprite.setRotation(ang); r.sprite.setFlipY(v.x < 0);
      }
      // tail-beat feel: tiny squash when steering
      if (this.steer.down && this.steer.steering && r.stamina > 0) r.sprite.scaleY = Math.abs(r.sprite.scaleX) * (1 + Math.sin(t * 30) * 0.04) * (r.sprite.flipY ? 1 : 1);
      if (this.water.isUnder(b.position.y) && Math.random() < 0.25) this.fx.bubbles(b.position.x, b.position.y, 1);
      if (this.level.dark) { this.water.plankton(b.position.x, b.position.y); lights.push({ x: b.position.x, y: b.position.y, r: C.RESCUER_LIGHT_RADIUS, a: 0.85 }); }
      // shot end
      var age = (time - r.launchTime) / 1000;
      if (sp < C.SHOT_SETTLE_SPEED) { if (!r.slowSince) r.slowSince = time; } else r.slowSince = 0;
      var out = b.position.x < this.ext.x0 - 150 || b.position.x > this.ext.x0 + this.ext.w + 150 || b.position.y > C.HEIGHT + 80;
      if (out || age > C.SHOT_MAX_TIME || (r.slowSince && time - r.slowSince > 900)) this.endShot();
    } else if (r) this.steer.update(null, this.water, dt, this.timeScale);
    // moving junk glows in dark water
    if (this.level.dark && Math.random() < 0.5) {
      this.objects.forEach(function (o) { if (o.alive) { var ov = TT.vel(o.body); if (ov.x * ov.x + ov.y * ov.y > 1) self.water.plankton(o.body.position.x, o.body.position.y); } });
    }

    // all animals freed: finish once things calm down (min WIN_DELAY, max 6 s)
    if (this.winPending && this.state !== 'done') {
      var since = time - this.winPending, rr = this.current;
      var rescuerCalm = !rr || !rr.alive || (rr.slowSince && time - rr.slowSince > 300);
      if ((since > C.WIN_DELAY_MS && rescuerCalm && !this.anyMoving()) || since > 6000) this.finish(true);
    }

    // settling between shots
    if (this.state === 'settle') {
      var moving = this.anyMoving();
      if (!moving) { if (!this.calmSince) this.calmSince = time; } else this.calmSince = 0;
      var waited = (time - this.settleStart) / 1000;
      if ((this.calmSince && time - this.calmSince > C.WORLD_SETTLE_TIME * 1000) || waited > C.WORLD_SETTLE_MAX) this.afterSettle();
    }

    // slow-motion while steering (or while the tutorial is showing a move)
    var wantSlow = (this.state === 'flight' && this.steer.isActive(this.current)) || this.tutorialSlow;
    var targetTs = wantSlow ? C.SLOWMO_SCALE : 1;
    this.timeScale += (targetTs - this.timeScale) * Math.min(1, dt * C.SLOWMO_EASE);
    if (Math.abs(this.timeScale - targetTs) < 0.01) this.timeScale = targetTs;
    this.matter.world.engine.timing.timeScale = this.timeScale;
    this.vignette.setAlpha((1 - this.timeScale) / (1 - C.SLOWMO_SCALE) * C.SLOWMO_VIGNETTE);

    // long press: what is this?
    var pi = this.pressInfo;
    if (pi && !pi.decided && time - pi.t > C.LONG_PRESS_MS) {
      pi.decided = true;
      var info = this.infoAt(pi.wp);
      if (info) { this.events.emit('info', info, pi.x, pi.y); TT.Haptics.buzz(10); }
    }

    this.tutorial.update(dt, time);
    this.water.update(time, lights);
    this.ocean.update(time, dt);
  },

  // What's under this point? Used by long-press info.
  infoAt: function (wp) {
    var I = TT.INFO, hit = function (spr, pad) { if (!spr || !spr.active) return false; var b = spr.getBounds(); return wp.x > b.x - (pad || 0) && wp.x < b.right + (pad || 0) && wp.y > b.y - (pad || 0) && wp.y < b.bottom + (pad || 0); };
    if (this.aimSprite && hit(this.aimSprite, 20)) { var id = this.queue[0], d = TT.CFG.RESCUERS[id]; return { title: d.name + (d.nick ? ' ("' + d.nick + '")' : ''), text: I.rescuers[id] }; }
    var i, c;
    for (i = 0; i < this.invasives.length; i++) if (this.invasives[i].alive && hit(this.invasives[i].sprite, 10)) return { title: 'Lionfish (invasive)', text: I.lionfish };
    for (i = 0; i < this.containers.length; i++) {
      c = this.containers[i]; if (!c.alive) continue;
      var box = c.ctype === 'line' ? (Math.abs(wp.x - c.x) < 30 && Math.abs(wp.y - c.y) < c.h / 2) : hit(c.sprite, 6);
      if (box) { var n = c.animals.length; return { title: I.containerNames[c.ctype], text: I.containers[c.ctype].replace('{n}', n + (n === 1 ? ' animal' : ' animals')) }; }
    }
    for (i = 0; i < this.objects.length; i++) if (this.objects[i].alive && hit(this.objects[i].sprite, 6)) { var m = this.objects[i].material; return { title: TT.CFG.MATERIALS[m].name, text: I.materials[m] }; }
    for (i = 0; i < this.corals.length; i++) if (hit(this.corals[i].sprite, 4)) return { title: 'Living coral', text: I.coral };
    return null;
  },

  anyMoving: function () {
    var C = TT.CFG, list = this.objects.concat(this.containers.filter(function (c) { return c.ctype === 'trap'; }));
    for (var i = 0; i < list.length; i++) {
      var o = list[i]; if (!o.alive || !o.body) continue;
      var v = TT.vel(o.body); if (v.x * v.x + v.y * v.y > C.WORLD_SETTLE_SPEED * C.WORLD_SETTLE_SPEED) return true;
    }
    return false;
  },

  endShot: function () {
    var r = this.current, self = this;
    if (!r || !r.alive) return;
    r.alive = false;
    this.steer.cancel();
    this.cameras.main.stopFollow();
    // the rescuer swims off and leaves the scene
    var spr = r.sprite;
    this.removeQueue.push(r.body);
    this.tweens.add({ targets: spr, alpha: 0, duration: 450, onComplete: function () { spr.destroy(); } });
    this.current = null;
    if (this.state === 'done' || this.state === 'won') return;
    this.state = 'settle'; this.settleStart = this.time.now; this.calmSince = 0;
  },

  afterSettle: function () {
    var self = this;
    if (this.state !== 'settle') return;
    this.state = 'between';
    if (this.trapped <= 0) return; // win already pending
    var next = function () {
      if (self.state === 'won' || self.state === 'done') return;
      if (self.level.width > TT.CFG.WIDTH) self.cameras.main.pan(self.sling.x + 400, TT.CFG.HEIGHT / 2, 700, 'Sine.easeInOut');
      if (!self.loadNext()) self.finish(false);
    };
    if (this.water.tide && this.queue.length) this.water.stepTide(next); else next();
  },

  afterPhysics: function () {
    var M = Phaser.Physics.Matter.Matter, world = this.matter.world;
    var r = this.current;
    if (r && r.alive) {
      if (r.restoreVel) { M.Body.setVelocity(r.body, r.restoreVel); r.restoreVel = null; }
      if (r.stopDead) { M.Body.setVelocity(r.body, { x: 0, y: 0 }); r.stopDead = false; r.sprite.setIgnoreGravity(false); r.body.ttWater.ignoreDrag = false; this.flash(r.body.position.x, r.body.position.y, 'Concrete stops a swordfish'); }
    }
    while (this.removeQueue.length) { var b = this.removeQueue.pop(); try { world.remove(b); } catch (e) { /* already gone */ } }
  },

  // ---------- events from entities ----------
  addHealth: function (d) {
    if (this.state === 'done') return;
    this.health = Phaser.Math.Clamp(this.health + d, 0, 100);
    this.ocean.setHealth(this.health, this.level.startHealth);
  },
  destroyObject: function (t, src) {
    if (!t.alive) return;
    t.alive = false;
    var x = t.body.position.x, y = t.body.position.y, spr = t.sprite;
    this.removeQueue.push(t.body);
    this.fx.shatter(x, y, t.material);
    this.sfx.play(t.material === 'glass' ? 'glass' : 'crack'); TT.Haptics.buzz(16);
    this.addHealth(this.gain.object);
    this.score += TT.CFG.MATERIALS[t.material].score;
    this.tweens.add({ targets: spr, alpha: 0, scale: spr.scale * 0.8, duration: 200, onComplete: function () { spr.destroy(); } });
  },
  breakContainer: function (c, src) {
    if (!c.alive) return;
    c.alive = false;
    var n = c.animals.length, spr = c.sprite;
    this.removeQueue.push(c.body);
    this.fx.shatter(c.sprite.x, c.sprite.y, c.ctype === 'line' ? 'net' : c.ctype);
    this.sfx.play(c.ctype === 'trap' ? 'crack' : 'tear');
    if (c.lineGfx) c.lineGfx.destroy();
    this.tweens.add({ targets: spr, alpha: 0, duration: 300, onComplete: function () { spr.destroy(); } });
    this.ocean.release(c);
    this.trapped -= n; this.freed += n;
    this.addHealth(this.gain.animal * n);
    this.score += TT.CFG.SCORE.animal * n;
    this.flash(c.x, c.y - c.h / 2 - 10, n > 1 ? n + ' animals freed!' : 'Freed!', '#bff7d2');
    this.time.delayedCall(150, function () { TT.Sfx.play('free'); });
    TT.Haptics.buzz([25, 40, 25]);
    if (this.trapped <= 0 && this.state !== 'done' && !this.winPending) {
      // everyone is free: let the current shot and falling junk finish (they still count), then end
      this.winPending = this.time.now;
    }
  },
  coralHit: function (t, o) {
    this.addHealth(-TT.CFG.CORAL_PENALTY);
    this.score += TT.CFG.SCORE.coralHit;
    this.fx.shatter(t.sprite.x, t.sprite.y - 10, 'wood');
    this.sfx.play('coral'); TT.Haptics.buzz(35);
    this.flash(t.sprite.x, t.sprite.y - 40, 'Living coral hit  -' + TT.CFG.CORAL_PENALTY + '%', '#ffb39a');
  },
  lionfishFlee: function (l) {
    if (l.fleeing || !l.alive) return;
    l.fleeing = true; l.alive = false;
    this.removeQueue.push(l.body);
    var dir = l.sprite.x > this.level.width / 2 ? 1 : 1, spr = l.sprite;
    spr.setFlipX(false);
    this.tweens.add({ targets: spr, x: this.ext.x0 + this.ext.w + 200, y: spr.y - 60, duration: 1800, ease: 'Sine.easeIn', onComplete: function () { spr.destroy(); } });
    this.addHealth(this.gain.invasive);
    this.score += TT.CFG.SCORE.invasive;
    this.sfx.play('flee');
    this.flash(spr.x, spr.y - 40, 'Lionfish driven off', '#ffe0a8');
  },
  lionfishNear: function (x, y, R) {
    var self = this;
    this.invasives.forEach(function (l) { if (l.alive && Phaser.Math.Distance.Between(x, y, l.sprite.x, l.sprite.y) < R + 30) self.lionfishFlee(l); });
  },
  radialPush: function (x, y, R, force, src) {
    var M = Phaser.Physics.Matter.Matter;
    this.matter.world.localWorld.bodies.forEach(function (b) {
      if (b.isStatic || !b.tt || b.tt === src) return;
      var dx = b.position.x - x, dy = b.position.y - y, d = Math.sqrt(dx * dx + dy * dy);
      if (d > R || d < 1) return;
      var k = force * (1 - d / R) * Math.min(b.mass, 30);
      M.Body.applyForce(b, b.position, { x: dx / d * k, y: dy / d * k });
    });
  },
  snap: function (x, y, R, src) {
    var A = TT.CFG.ABILITY, self = this;
    this.fx.ring(x, y, R, 0xbff3ff); this.fx.bubbles(x, y, 18);
    this.cameras.main.shake(120, 0.004);
    this.objects.forEach(function (o) {
      if (!o.alive) return;
      var d = Phaser.Math.Distance.Between(x, y, o.body.position.x, o.body.position.y) - Math.max(o.w, o.h) / 2;
      if (d > R) return;
      TT.Entities.damage(self, o, (o.material === 'glass' || o.material === 'plastic') ? A.snapDamageBrittle : A.snapDamageOther, src);
    });
    this.containers.forEach(function (c) {
      if (!c.alive) return;
      var d = Phaser.Math.Distance.Between(x, y, c.sprite.x, c.sprite.y) - Math.max(c.w, c.h) / 2;
      if (d <= R) TT.Entities.damage(self, c, A.snapDamageOther * (c.ctype === 'line' ? 3 : 1), src);
    });
    this.lionfishNear(x, y, R);
    this.radialPush(x, y, R, 0.02, src);
  },
  sediment: function (x, y) {
    if (!this.water.isUnder(y - 10)) { this.fx.shatter(x, y, 'concrete'); return; }
    if (this.time.now - this.lastSilt < 250) return;
    this.lastSilt = this.time.now;
    this.fx.silt(x, y);
  },
  flash: function (x, y, text, color) {
    var cam = this.cameras.main;
    var tx = this.add.text(x, y, text, { fontFamily: 'Georgia, serif', fontSize: '18px', color: color || '#ffffff', stroke: '#06202c', strokeThickness: 4 })
      .setOrigin(0.5).setDepth(20);
    this.tweens.add({ targets: tx, y: y - 40, alpha: 0, duration: 1600, delay: 400, onComplete: function () { tx.destroy(); } });
  },
  message: function (text, ms) { this.events.emit('message', text, ms || 4000); },

  // ---------- gadgets ----------
  gadgetAvailable: function (k) {
    if (this.gadgetUsed || (this.shots || 0) > 0 || this.state !== 'aim') return false;
    if (TT.CFG.GADGETS[k].darkOnly && !this.level.dark) return false;
    if (k === 'netcutter' && !this.containers.some(function (c) { return c.alive && c.ctype !== 'trap'; })) return false;
    return TT.Save.gadgetCount(k) > 0;
  },
  useGadget: function (k) {
    if (!this.gadgetAvailable(k) || !TT.Save.useGadget(k)) return false;
    this.gadgetUsed = true; this.gadgetName = TT.CFG.GADGETS[k].name;
    if (k === 'sonar') this.sonarShot = true;
    if (k === 'kelp') this.kelpShot = true;
    if (k === 'glow') this.water.setLit(true);
    if (k === 'netcutter') { this.netCutterArmed = true; this.message('Net Cutter ready: tap a net or fishing line.', 3500); }
    return true;
  },
  tryNetCut: function (wp) {
    var hit = null;
    this.containers.forEach(function (c) {
      if (!c.alive || c.ctype === 'trap') return;
      if (Math.abs(wp.x - c.x) < Math.max(30, c.w / 2 + 10) && Math.abs(wp.y - c.y) < c.h / 2 + 10) hit = c;
    });
    if (hit) { this.netCutterArmed = false; this.breakContainer(hit, null); }
  },

  // ---------- end ----------
  finish: function (win) {
    if (this.state === 'done') return;
    var C = TT.CFG, self = this;
    this.state = 'done';
    this.steer.cancel(); this.tutorialSlow = false; this.tutorial.hide();
    var stars = 0, unused = this.queue.length;
    if (win) {
      stars = 1 + (this.health >= C.STAR2_HEALTH ? 1 : 0) + (this.health >= C.STAR3_HEALTH ? 1 : 0);
      this.score += unused * C.SCORE.unusedRescuer;
    }
    var finalScore = Math.max(0, Math.round(this.score * this.D.mult));
    var res = { win: win, stars: stars, health: Math.round(this.health), score: finalScore, freed: this.freed, total: this.totalAnimals, unused: unused, newCards: [], bonusGadget: null };
    if (win) {
      var rec = TT.Save.recordResult(this.level.id, this.difficulty, stars, res.health, finalScore);
      if (rec.newThreeStar) { var ks = Object.keys(C.GADGETS), g = ks[Math.floor(Math.random() * ks.length)]; TT.Save.addGadget(g); res.bonusGadget = C.GADGETS[g].name; }
      var ids = [];
      this.level.queue.forEach(function (q) { if (ids.indexOf(q) < 0) ids.push(q); });
      (this.level.containers || []).forEach(function (c) { (c.holds || []).forEach(function (h) { if (ids.indexOf(h.k) < 0) ids.push(h.k); }); });
      if ((this.level.invasives || []).length) ids.push('lionfish');
      ids.push(this.level.world === 1 ? 'place_keys' : 'place_galapagos');
      res.newCards = TT.Save.unlockCards(ids);
      this.sfx.play('win'); TT.Haptics.buzz([30, 60, 30, 60, 70]);
    } else this.sfx.play('lose');
    this.result = res;
    this.events.emit('finished', res);
  },
  restartLevel: function () { this.scene.stop('UI'); this.scene.restart({ levelId: this.level.id }); },
  toMenu: function () { this.scene.stop('UI'); this.scene.start('LevelSelect'); },
  nextLevel: function () {
    var i = TT.LEVELS.indexOf(this.level), n = TT.LEVELS[i + 1];
    this.scene.stop('UI');
    if (n) this.scene.restart({ levelId: n.id }); else this.scene.start('LevelSelect');
  }
});

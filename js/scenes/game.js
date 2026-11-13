// Tide Tossers v0.5 — GameScene: the swim game. Fixed-rate physics, player, rescues, tide timer, exit, win/lose.
window.TT = window.TT || {};

TT.GameScene = new Phaser.Class({
  Extends: Phaser.Scene,
  initialize: function GameScene() { Phaser.Scene.call(this, { key: 'Game' }); },

  // data: { levelId, mode: 'campaign' | 'puzzle' | 'arcade' }
  init: function (data) { this.levelId = (data && data.levelId) || '1-1'; this.mode = (data && data.mode) || 'campaign'; },

  create: function () {
    var C = TT.CFG, self = this;
    this.puzzle = this.mode === 'puzzle'; this.arcade = this.mode === 'arcade';
    var level = this.level = this.arcade ? TT.Arcade.level() : TT.levelById(this.levelId);
    this.difficulty = this.puzzle || this.arcade ? 'current' : TT.Save.difficulty();
    var D = this.D = C.DIFFICULTY[this.difficulty];
    this.sfx = TT.Sfx;
    // Phaser reuses this scene object on restart, so reset every per-level field here.
    this.state = 'play'; this.result = null; this.uiBlocking = false; this.paused = false;
    this.clock = 0; this.acc = 0; this.hitStop = 0; this.elapsed = 0;
    this.score = 0; this.combo = 0; this.comboUntil = 0; this.stings = 0;
    this.health = level.startHealth;
    this.removeQueue = []; this.lastSilt = 0; this.lights = []; this.botInput = null;
    this.allFreeAt = 0; this.exitOpen = false; this.lit = false;
    this.timed = !this.puzzle && D.time > 0; this.timeMax = this.timeLeft = this.timed ? Math.round(level.time * D.time) : 0; this.lastTick = 99;
    this.movesLeft = this.puzzle ? level.moves : 0; this.movesUsed = 0; this.stillFor = 0; this.lastMoveAt = 0;
    this.wave = 0; this.waveClearAt = 0;
    this.gadgetUsed = false; this.gadgetName = ''; this.cutterUntil = 0;

    var W = this.worldW = level.width, H = C.HEIGHT;
    var cam = this.cameras.main;
    cam.setBounds(0, 0, W, H).setZoom(C.CAMERA_ZOOM);
    cam.setBackgroundColor('#06283a');
    this.matter.world.setGravity(0, C.GRAVITY_Y);
    this.matter.world.autoUpdate = false;       // we step the physics ourselves at a fixed rate (see update)

    // ---------- scene layers ----------
    this.water = new TT.Water(this, level);
    this.scenery = new TT.Scenery(this, level, this.water);
    this.fx = new TT.FX(this);
    this.ocean = new TT.Ocean(this, level, this.water);

    // ---------- physics bodies ----------
    var wall = function (x, y, w, h, kind) { var b = self.matter.add.rectangle(x, y, w, h, { isStatic: true, friction: 0.4 }); b.tt = { kind: kind, alive: true }; return b; };
    wall(W / 2, C.FLOOR_Y + 60, W + 800, 120, 'floor');
    wall(-25, H / 2, 50, 2800, 'static'); wall(W + 25, H / 2, 50, 2800, 'static');
    wall(W / 2, -110, W + 800, 100, 'static');   // sky ceiling: caps the highest leaps

    var hpMult = this.puzzle ? (level.hp || 0.8) : D.hp;   // puzzles: one good hit per net
    this.statics = (level.statics || []).map(function (s, i) { return TT.Entities.staticBody(self, s, i); });
    this.corals = (level.coral || []).map(function (c, i) { return TT.Entities.coral(self, c, i); });
    this.seagrass = (level.seagrass || []).map(function (sg, i) { return TT.Entities.seagrass(self, sg, i); });
    this.objects = (level.objects || []).map(function (o) { return TT.Entities.junk(self, o, hpMult); });
    this.containers = (level.containers || []).map(function (c) { return TT.Entities.container(self, c, hpMult); });
    this.invasives = (level.invasives || []).map(function (l) { return TT.Entities.lionfish(self, l); });

    this.trapped = 0;
    this.containers.forEach(function (c) { self.trapped += c.animals.length; });
    this.totalAnimals = this.trapped; this.freed = 0;

    // reef-health budget: a clean run lands at ~95%
    var budget = 95 - level.startHealth;
    var nObj = this.objects.length, nInv = this.invasives.length;
    var invShare = nInv ? 0.15 : 0, objShare = nObj ? 0.25 : 0, aniShare = 1 - invShare - objShare;
    this.gain = {
      animal: budget * aniShare / Math.max(1, this.totalAnimals),
      object: nObj ? budget * objShare / nObj : 0,
      invasive: nInv ? budget * invShare / nInv : 0
    };
    if (this.arcade) this.gain = { animal: 3, object: 0.6, invasive: 2 };
    this.ocean.setHealth(this.health, level.startHealth);

    // ---------- player, school, exit ----------
    this.player = new TT.Player(this, level.team, level.start.x, level.start.y);
    Phaser.Physics.Matter.Matter.Body.setVelocity(this.player.ent.body, { x: 5, y: -2 });  // tossed in by the tide
    this.player.heading = 0.4;
    this.school = new TT.School(this);
    this.exit = TT.Scenery.exitRing(this, level.exit.x, level.exit.y);
    cam.startFollow(this.player.ent.sprite, false, C.CAMERA_LERP, C.CAMERA_LERP);
    cam.centerOn(level.start.x, Math.max(level.start.y, 200));
    this.lookX = 0; this.lookY = 0;
    this.tutorial = new TT.Tutorial(this);
    if (this.puzzle) this.player.team.forEach(function (m) { m.cdMax = 0.6; });
    if (this.arcade) this.nextWave();

    if (level.grantGlow && !TT.Save.glowGranted(level.id)) {
      TT.Save.addGadget('glow'); TT.Save.markGlowGranted(level.id);
      this.time.delayedCall(900, function () { self.message('A free Glow Lure has been added to your gadgets.', 4000); });
    }

    // ---------- physics events (fired once per fixed step) ----------
    var world = this.matter.world;
    world.on('beforeupdate', function () {
      self.water.applyForces(world.localWorld.bodies);
      self.player.step();
    });
    world.on('collisionstart', function (ev) {
      for (var i = 0; i < ev.pairs.length; i++) {
        var p = ev.pairs[i], a = p.bodyA.parent || p.bodyA, b = p.bodyB.parent || p.bodyB;
        if (!a.tt || !b.tt) continue;
        var va = TT.vel(a), vb = TT.vel(b), rvx = va.x - vb.x, rvy = va.y - vb.y;
        var rel = Math.sqrt(rvx * rvx + rvy * rvy);
        TT.Entities.impact(self, a.tt, b.tt, rel);
        var r = a.tt.kind === 'rescuer' ? a.tt : b.tt.kind === 'rescuer' ? b.tt : null;
        if (r && r === self.player.ent) {
          self.player.onBump(r === a.tt ? b.tt : a.tt, rel);
          if (rel > 6) { self.sfx.play('thud'); if (rel > 9) { TT.Haptics.buzz(14); self.cameras.main.shake(90, 0.0025); } }
        }
      }
    });
    world.on('afterupdate', function () { self.afterPhysics(); });

    this.input.keyboard.on('keydown-R', function () { self.restartLevel(); });

    // ---------- HUD ----------
    if (this.scene.isActive('UI')) this.scene.stop('UI');
    this.scene.launch('UI', { game: this });
    this.events.once('shutdown', function () { self.input.keyboard.removeAllListeners(); world.off('beforeupdate'); world.off('collisionstart'); world.off('afterupdate'); world.autoUpdate = true; });
    cam.fadeIn(350, 5, 20, 30);

    if (!TT.Save.hintSeen(level.id) && !this.tutorial.covers()) { TT.Save.markHintSeen(level.id); this.time.delayedCall(700, function () { self.message(level.hint, 6000); }); }

    window.__TT_GAME = this;   // debug / test hook
  },

  // ---------- per-frame ----------
  update: function (time, delta) {
    var C = TT.CFG, real = Math.min(0.05, delta / 1000 * (TT.DEBUG_SPEED || 1));   // DEBUG_SPEED: tests fast-forward
    if (this.paused) return;
    // hit-stop: a few frozen frames on big moments
    var dt = real;
    if (this.hitStop > 0) { this.hitStop -= real; dt = 0; }

    // fixed-rate physics: the same simulation at 60, 90 or 120 Hz screens and when frames drop
    var stepMs = 1000 / C.PHYSICS_HZ, n = 0;
    this.acc += dt * 1000;
    this.water.update(dt);
    while (this.acc >= stepMs && n < C.MAX_STEPS_PER_FRAME) {
      this.clock += stepMs / 1000;
      this.matter.world.step(stepMs);
      this.acc -= stepMs; n++;
    }
    if (n === C.MAX_STEPS_PER_FRAME) this.acc = 0;
    var t = this.clock, pl = this.player, pb = pl.ent.body;

    pl.update(dt);
    // camera look-ahead
    var pv = TT.vel(pb), cam = this.cameras.main;
    this.lookX += (pv.x * C.CAMERA_LOOKAHEAD - this.lookX) * Math.min(1, real * 2.5);
    this.lookY += (pv.y * C.CAMERA_LOOKAHEAD * 0.5 - this.lookY) * Math.min(1, real * 2.5);
    cam.setFollowOffset(-this.lookX, -this.lookY);

    // lights for dark levels (world coordinates; the UI scene draws the darkness)
    var lights = this.lights; lights.length = 0;
    var dark = !!this.level.dark && !this.lit, gs = this.level.glowSpots || [], i;
    if (dark) {
      for (i = 0; i < gs.length; i++) lights.push({ x: gs[i].x, y: gs[i].y, r: C.GLOW_SPOT_RADIUS * (0.9 + 0.1 * Math.sin(t * 1.5 + i)), a: 0.9 });
      lights.push({ x: pb.position.x, y: pb.position.y, r: C.RESCUER_LIGHT_RADIUS, a: 0.95 });
      if (this.exitOpen) lights.push({ x: this.exit.x, y: this.exit.y, r: 120, a: 0.9 });
    }
    // lionfish patrol
    for (i = 0; i < this.invasives.length; i++) {
      var l = this.invasives[i];
      if (!l.alive || l.fleeing) continue;
      if (l.hunt) {
        // hunting lionfish drift toward a rescuer that comes close (the pufferfish is ignored: it's immune)
        var hx = pb.position.x - l.home.x, hy = pb.position.y - l.home.y, hd = Math.sqrt(hx * hx + hy * hy);
        if (hd < TT.CFG.LIONFISH_HUNT_RANGE && hd > 20 && pl.id() !== 'puffer') {
          var step = TT.CFG.LIONFISH_HUNT_SPEED * dt / hd;
          l.home.x += hx * step; l.home.y = Phaser.Math.Clamp(l.home.y + hy * step, this.water.y + 50, TT.CFG.FLOOR_Y - 40);
        }
      }
      var nx = l.home.x + Math.sin(t * 0.5 + l.phase) * l.patrol, ny = l.home.y + Math.sin(t * 1.3 + l.phase) * 10;
      l.sprite.setFlipX(nx < l.sprite.x); l.sprite.setPosition(nx, ny);
      if (dark) lights.push({ x: nx, y: ny, r: 46, a: 0.45 });
    }
    // trapped animals follow their container and struggle
    for (i = 0; i < this.containers.length; i++) {
      var c = this.containers[i];
      if (!c.alive) continue;
      if (c.ctype === 'line') TT.Entities.drawLine(c, t);
      var cx = c.sprite.x, cy = c.sprite.y, rot = c.ctype === 'trap' ? c.sprite.rotation : 0, cs = Math.cos(rot), sn = Math.sin(rot);
      for (var ai = 0; ai < c.animals.length; ai++) {
        var a = c.animals[ai];
        a.sprite.setPosition(cx + a.ox * cs - a.oy * sn, cy + a.ox * sn + a.oy * cs);
        a.sprite.rotation = rot + Math.sin(t * 5 + a.phase) * 0.12;
      }
      if (c.rope) TT.Scenery.drawRope(c, this.water.y);
      if (dark) lights.push({ x: cx, y: cy, r: 54, a: 0.5 });
    }
    if (dark) {
      if (Math.random() < 0.6) this.fx.plankton(pb.position.x, pb.position.y);
      for (i = 0; i < this.objects.length; i++) { var o = this.objects[i]; if (o.alive && Math.random() < 0.3 && TT.speed(o.body) > 1) this.fx.plankton(o.body.position.x, o.body.position.y); }
    }

    if (this.cutterUntil) {
      if (t > this.cutterUntil) { this.cutterUntil = 0; this.message('The Net Cutter wore off.', 2000); }
      else if (Math.random() < 0.35) this.fx.sparkle(pb.position.x + (Math.random() - 0.5) * 40, pb.position.y + (Math.random() - 0.5) * 40);
    }
    if (this.state === 'play') {
      this.elapsed += dt;
      if (this.combo && t > this.comboUntil) this.combo = 0;
      // tide timer
      if (this.timed) {
        this.timeLeft -= dt;
        var whole = Math.ceil(this.timeLeft);
        if (whole <= 10 && whole < this.lastTick && whole > 0) { this.lastTick = whole; this.sfx.play('tick'); }
        if (this.timeLeft <= 0) { this.timeLeft = 0; this.finish(this.trapped <= 0, 'tide'); }
      }
      if (this.puzzle) this.puzzleCheck(dt);
      if (this.arcade && this.trapped <= 0 && this.waveClearAt && t > this.waveClearAt) { this.waveClearAt = 0; this.nextWave(); }
      // exit: open once everyone is free
      if (this.exitOpen && this.state === 'play') {
        var ex = this.exit, dx = pb.position.x - ex.x, dy = pb.position.y - ex.y;
        if (dx * dx + dy * dy < C.EXIT_RADIUS * C.EXIT_RADIUS) { this.sfx.play('exit'); this.finish(true, 'exit'); }
        else if (!this.cleanupLeft() && time - this.allFreeAt > C.WIN_DELAY_MS) this.finish(true, 'clean');
      }
    }

    this.exit.update(t, this.exitOpen);
    this.school.update(dt, t);
    this.tutorial.update(real);
    this.scenery.update(t, real);
    this.ocean.update(t, real);
  },

  afterPhysics: function () {
    var world = this.matter.world;
    this.player.afterStep();
    while (this.removeQueue.length) { var b = this.removeQueue.pop(); try { world.remove(b); } catch (e) { /* already gone */ } }
  },

  // junk or lionfish still in the level (worth cleaning for reef health)
  cleanupLeft: function () {
    var n = 0, i;
    for (i = 0; i < this.objects.length; i++) if (this.objects[i].alive) n++;
    for (i = 0; i < this.invasives.length; i++) if (this.invasives[i].alive) n++;
    return n;
  },

  // ---------- events from entities ----------
  addHealth: function (d) {
    if (this.state === 'done') return;
    this.health = Phaser.Math.Clamp(this.health + d, 0, 100);
    this.ocean.setHealth(this.health, this.level.startHealth);
  },
  chain: function () {
    var C = TT.CFG;
    this.combo = this.clock < this.comboUntil ? Math.min(C.COMBO_MAX, this.combo + 1) : 1;
    this.comboUntil = this.clock + C.COMBO_WINDOW;
    return this.combo;
  },
  destroyObject: function (t, src) {
    if (!t.alive) return;
    t.alive = false;
    var x = t.body.position.x, y = t.body.position.y, spr = t.sprite, n = this.chain();
    this.removeQueue.push(t.body);
    this.fx.shatter(x, y, t.material);
    this.sfx.play(t.material === 'glass' ? 'glass' : 'crack'); TT.Haptics.buzz(16);
    this.addHealth(this.gain.object);
    this.score += TT.CFG.MATERIALS[t.material].score * n;
    if (n > 1) this.flash(x, y - 20, 'x' + n, '#ffe7a8', 16);
    this.tweens.add({ targets: spr, alpha: 0, scale: spr.scale * 0.8, duration: 200, onComplete: function () { spr.destroy(); } });
  },
  breakContainer: function (c, src) {
    if (!c.alive) return;
    var C = TT.CFG, n = c.animals.length, spr = c.sprite, self = this, k = this.chain();
    c.alive = false;
    this.removeQueue.push(c.body);
    this.fx.shatter(c.sprite.x, c.sprite.y, c.ctype === 'line' ? 'net' : c.ctype);
    this.fx.ring(c.sprite.x, c.sprite.y, 90, 0xbff7d2);
    for (var sp = 0; sp < 14; sp++) this.fx.sparkle(c.sprite.x + (Math.random() - 0.5) * c.w * 1.6, c.sprite.y + (Math.random() - 0.5) * c.h * 1.2);
    this.sfx.play(c.ctype === 'trap' ? 'crack' : 'tear');
    if (c.lineGfx) c.lineGfx.destroy();
    if (c.rope) c.rope.destroy();
    this.tweens.add({ targets: spr, alpha: 0, duration: 300, onComplete: function () { spr.destroy(); } });
    this.school.join(c);
    this.trapped -= n; this.freed += n;
    this.addHealth(this.gain.animal * n);
    this.score += C.SCORE.animal * n * k;
    if (this.timed && !this.arcade) this.timeLeft = Math.min(this.timeMax + 30, this.timeLeft + C.RESCUE_TIME_BONUS * n);
    if (this.arcade && this.trapped <= 0) this.waveClearAt = this.clock + 1.6;
    this.player.recharge();
    var label = (n > 1 ? n + ' freed!' : 'Freed!') + (k > 1 ? '  x' + k : '') + (this.timed && !this.arcade ? '  +' + C.RESCUE_TIME_BONUS * n + 's' : '');
    this.flash(c.x, c.sprite.y - c.h / 2 - 14, label, '#bff7d2', 24);
    this.time.delayedCall(120, function () { TT.Sfx.play('free', k); });
    TT.Haptics.buzz([25, 40, 25]);
    this.hitStop = 0.06; this.cameras.main.shake(140, 0.004);
    this.tutorial.onRescue();
    if (this.puzzle && this.trapped <= 0 && this.state === 'play') { this.time.delayedCall(C.WIN_DELAY_MS, function () { self.finish(true, 'puzzle'); }); return; }
    if (this.arcade) return;
    if (this.trapped <= 0 && this.state === 'play' && !this.exitOpen) {
      this.exitOpen = true; this.allFreeAt = this.time.now;
      if (this.cleanupLeft()) this.time.delayedCall(900, function () { if (self.state === 'play') self.message('Everyone is free! Clean up the junk for more stars, or swim into the glowing current to finish.', 5000); });
    }
  },
  // A big rescue: the net has to be torn several times before the animal is free.
  tearStage: function (c, src) {
    var C = TT.CFG, spr = c.sprite;
    c.stagesLeft--; c.hp = c.maxHp;
    var left = c.stagesLeft;
    spr.setAlpha(0.95 - 0.22 * (c.stages - left));
    this.fx.shatter(spr.x, spr.y, 'net', 10); this.fx.ring(spr.x, spr.y, 110, 0xbff7d2);
    this.sfx.play('tear'); TT.Haptics.buzz([20, 30, 20]);
    this.cameras.main.shake(120, 0.004); this.hitStop = 0.04;
    if (this.timed) this.timeLeft = Math.min(this.timeMax + 30, this.timeLeft + C.STAGE_TIME_BONUS);
    this.player.recharge();
    this.addHealth(this.gain.animal * 0.3);
    this.flash(c.x, spr.y - c.h / 2 - 14, 'Net torn! ' + left + ' more' + (this.timed ? '  +' + C.STAGE_TIME_BONUS + 's' : ''), '#bff7d2', 22);
    c.animals.forEach(function (a) { a.ox += (Math.random() - 0.5) * 10; });
  },
  seagrassHit: function (t, o) {
    var C = TT.CFG;
    if (o && o.kind === 'rescuer' && this.player.shield) { this.player.shield = false; this.sfx.play('shield'); this.flash(t.x, C.FLOOR_Y - 60, 'Bubble Shield popped', '#bff3ff'); return; }
    this.addHealth(-C.SEAGRASS_PENALTY);
    this.score += C.SCORE.coralHit;
    var x = o && o.body ? o.body.position.x : t.x;
    this.fx.silt(x, C.FLOOR_Y);
    this.sfx.play('coral'); TT.Haptics.buzz(30);
    this.flash(x, C.FLOOR_Y - 70, 'Seagrass crushed  -' + C.SEAGRASS_PENALTY + '%', '#ffb39a');
    var self = this;
    t.clumps.forEach(function (cl) { if (Math.abs(cl.x - x) < 70) self.tweens.add({ targets: cl, scaleY: cl.scaleY * 0.55, duration: 120, yoyo: true, hold: 900 }); });
  },
  hitFlash: function (c) {
    var spr = c.sprite; if (!spr || spr.ttPulse) return;
    spr.ttPulse = true;
    var s = spr.scale;
    this.tweens.add({ targets: spr, scale: s * 1.08, duration: 60, yoyo: true, onComplete: function () { spr.ttPulse = false; if (spr.active) spr.setScale(s); } });
    this.fx.shatter(spr.x, spr.y, c.ctype === 'line' ? 'net' : c.ctype, 2);
    this.sfx.play('tear');
  },
  coralHit: function (t, o) {
    if (o && o.kind === 'rescuer' && this.player.shield) { this.player.shield = false; this.fx.ring(t.sprite.x, t.sprite.y - 20, 70, 0xbff3ff); this.sfx.play('shield'); this.flash(t.sprite.x, t.sprite.y - 40, 'Bubble Shield popped', '#bff3ff'); return; }
    this.addHealth(-TT.CFG.CORAL_PENALTY);
    this.score += TT.CFG.SCORE.coralHit;
    this.fx.shatter(t.sprite.x, t.sprite.y - 10, 'wood');
    this.sfx.play('coral'); TT.Haptics.buzz(35);
    this.flash(t.sprite.x, t.sprite.y - 40, 'Living coral hit  -' + TT.CFG.CORAL_PENALTY + '%', '#ffb39a');
  },
  sting: function (r, l) {
    var C = TT.CFG;
    if (r !== this.player.ent || !this.player.sting(l.sprite.x, l.sprite.y)) return;
    this.stings++;
    this.score += C.SCORE.sting;
    if (this.timed) this.timeLeft = Math.max(1, this.timeLeft - C.STING_TIME_PENALTY);
    this.sfx.play('sting'); TT.Haptics.buzz([40, 30, 40]);
    this.cameras.main.shake(160, 0.005);
    this.flash(r.sprite.x, r.sprite.y - 34, 'Spines!' + (this.timed ? '  -' + C.STING_TIME_PENALTY + 's' : ''), '#ffb39a', 22);
  },
  lionfishFlee: function (l) {
    if (l.fleeing || !l.alive) return;
    l.fleeing = true; l.alive = false;
    this.removeQueue.push(l.body);
    var spr = l.sprite, dir = spr.x < this.player.pos().x ? -1 : 1;
    spr.setFlipX(dir < 0);
    this.tweens.add({ targets: spr, x: spr.x + dir * 900, y: spr.y - 80, alpha: 0, duration: 1800, ease: 'Sine.easeIn', onComplete: function () { spr.destroy(); } });
    this.addHealth(this.gain.invasive);
    this.score += TT.CFG.SCORE.invasive * this.chain();
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
      // an impulse (velocity change), so it's the same at any physics rate
      var dv = force * 100 * (1 - d / R) * Math.min(1, 12 / Math.max(1, b.mass)), v = TT.vel(b);
      M.Body.setVelocity(b, { x: v.x + dx / d * dv, y: v.y + dy / d * dv });
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
    this.radialPush(x, y, R, 0.05, src);
  },
  // Sheepshead bite: a short-range crunch that cracks hard junk and traps and cuts nets and lines.
  crunch: function (x, y, R, src) {
    var A = TT.CFG.ABILITY, self = this;
    this.fx.ring(x, y, R, 0xf3efe2); this.fx.bubbles(x, y, 8);
    this.objects.forEach(function (o) {
      if (!o.alive) return;
      var d = Phaser.Math.Distance.Between(x, y, o.body.position.x, o.body.position.y) - Math.max(o.w, o.h) / 2;
      if (d <= R) TT.Entities.damage(self, o, o.material === 'concrete' ? A.crunchOther : A.crunchHard, src);
    });
    this.containers.forEach(function (c) {
      if (!c.alive) return;
      var d = Phaser.Math.Distance.Between(x, y, c.sprite.x, c.sprite.y) - Math.max(c.w, c.h) / 2;
      if (d <= R) TT.Entities.damage(self, c, A.crunchHard, src);
    });
  },
  sediment: function (x, y) {
    if (this.time.now - this.lastSilt < 250) return;
    this.lastSilt = this.time.now;
    this.fx.silt(x, y);
  },
  flash: function (x, y, text, color, size) {
    var tx = this.add.text(x, y, text, { fontFamily: TT.UI.display, fontSize: (size || 18) + 'px', color: color || '#ffffff', stroke: '#06202c', strokeThickness: 5 })
      .setOrigin(0.5).setDepth(20).setScale(0.6);
    this.tweens.add({ targets: tx, scale: 1, duration: 160, ease: 'Back.easeOut' });
    this.tweens.add({ targets: tx, y: y - 46, alpha: 0, duration: 1300, delay: 500, onComplete: function () { tx.destroy(); } });
  },
  message: function (text, ms) { this.events.emit('message', text, ms || 4000); },

  // ---------- gadgets (one per level) ----------
  gadgetAvailable: function (k) {
    if (this.gadgetUsed || this.state !== 'play' || this.puzzle) return false;
    if (TT.CFG.GADGETS[k].darkOnly && !this.level.dark) return false;
    if (k === 'netcutter' && !this.containers.some(function (c) { return c.alive && c.ctype !== 'trap'; })) return false;
    if (k === 'kelp' && !this.timed) return false;
    return TT.Save.gadgetCount(k) > 0;
  },
  useGadget: function (k) {
    if (!this.gadgetAvailable(k) || !TT.Save.useGadget(k)) return false;
    this.gadgetUsed = true; this.gadgetName = TT.CFG.GADGETS[k].name;
    if (k === 'bubble') { this.player.shield = true; this.sfx.play('shield'); }
    if (k === 'kelp') { this.timeLeft += TT.CFG.GADGETS.kelp.time; this.player.recharge(); }
    if (k === 'glow') this.lit = true;
    if (k === 'netcutter') { this.cutterUntil = this.clock + TT.CFG.GADGETS.netcutter.time; this.sfx.play('ready'); }
    return true;
  },
  // Net Cutter: while armed, the first net or line the rescuer touches is cut (one stage of a big net).
  useCutter: function (c) {
    this.cutterUntil = 0;
    this.fx.ring(c.sprite.x, c.sprite.y, 110, 0xffe7a8);
    this.flash(c.sprite.x, c.sprite.y - c.h / 2 - 40, 'Snip!', '#ffe7a8', 24);
    TT.Entities.damage(this, c, c.stagesLeft > 1 ? c.hp : 9999, this.player.ent);
  },

  // ---------- modes ----------
  onAbilityUsed: function () {
    if (!this.puzzle) return;
    this.movesUsed++; this.movesLeft = Math.max(0, this.movesLeft - 1); this.lastMoveAt = this.clock;
    if (this.movesLeft === 0 && this.trapped > 0) this.message('Out of moves!', 1500);
  },
  // Puzzle: out of moves and everything has settled, with animals still trapped = try again.
  puzzleCheck: function (dt) {
    if (this.movesLeft > 0 || this.trapped <= 0 || this.state !== 'play') { this.stillFor = 0; return; }
    var moving = this.player.charging() || TT.speed(this.player.ent.body) > 1.5;
    for (var i = 0; i < this.objects.length && !moving; i++) { var o = this.objects[i]; if (o.alive && TT.speed(o.body) > 0.4) moving = true; }
    this.stillFor = moving ? 0 : this.stillFor + dt;
    if (this.stillFor > TT.CFG.PUZZLE_SETTLE || this.clock - this.lastMoveAt > TT.CFG.PUZZLE_MAX_WAIT) this.finish(false, 'moves');
  },
  // Arcade: spawn the next wave of trapped animals, junk and lionfish into the same arena.
  nextWave: function () {
    var C = TT.CFG, self = this, n = ++this.wave, data = TT.Arcade.wave(n, this.level, this.player.pos());
    var hpMult = this.D.hp * (1 + C.ARCADE_HP_GROWTH * (n - 1));
    var fadeIn = function (spr) { if (!spr) return; var a = spr.alpha; spr.setAlpha(0); self.tweens.add({ targets: spr, alpha: a, duration: 600 }); };
    data.objects.forEach(function (o) { var e = TT.Entities.junk(self, o, hpMult); fadeIn(e.sprite); self.objects.push(e); });
    data.containers.forEach(function (c) {
      var e = TT.Entities.container(self, c, hpMult); fadeIn(e.sprite); e.animals.forEach(function (a) { fadeIn(a.sprite); });
      self.containers.push(e); self.trapped += e.animals.length; self.totalAnimals += e.animals.length;
    });
    data.invasives.forEach(function (l) { var e = TT.Entities.lionfish(self, l); fadeIn(e.sprite); self.invasives.push(e); });
    var add = Math.max(C.ARCADE_WAVE_TIME_MIN, C.ARCADE_WAVE_TIME - 2 * (n - 2));
    if (n > 1) { this.timeLeft += add; this.timeMax = Math.max(this.timeMax, this.timeLeft); this.player.recharge(); this.score += 500 * (n - 1); }
    this.lastTick = 99;
    this.message('Wave ' + n + (n > 1 ? '  ·  +' + add + 's' : '') + '\n' + data.blurb, 2600);
    this.sfx.play('ready');
  },

  // ---------- pause / end ----------
  setPaused: function (on) {
    this.paused = on;
    if (on) this.tweens.pauseAll(); else this.tweens.resumeAll();
  },
  finish: function (win, how) {
    if (this.state === 'done') return;
    var C = TT.CFG;
    this.state = 'done';
    this.player.input.push = 0; this.tutorial.hide();
    var stars = 0, secs = this.timed ? Math.floor(this.timeLeft) : 0;
    if (this.arcade) return this.finishArcade();
    if (win && this.puzzle) {
      stars = this.movesUsed <= this.level.par ? 3 : this.movesUsed <= this.level.par + 1 ? 2 : 1;
      this.score += this.movesLeft * 400;
      this.school.swimOff();
    } else if (win) {
      stars = 1 + (this.health >= C.STAR2_HEALTH ? 1 : 0) + (this.health >= C.STAR3_HEALTH ? 1 : 0);
      this.score += secs * C.SCORE.second;
      this.school.swimOff();
    }
    var finalScore = Math.max(0, Math.round(this.score * this.D.mult));
    var res = { win: win, how: how, stars: stars, health: Math.round(this.health), score: finalScore, freed: this.freed, total: this.totalAnimals,
      time: Math.round(this.elapsed), secondsLeft: secs, junkLeft: this.puzzle ? 0 : this.cleanupLeft(), newCards: [], bonusGadget: null,
      mode: this.mode, moves: this.movesUsed, par: this.level.par };
    if (win) {
      var rec = TT.Save.recordResult(this.level.id, this.puzzle ? 'puzzle' : this.difficulty, stars, res.health, finalScore, res.time);
      if (rec.newThreeStar) { var ks = Object.keys(C.GADGETS), g = ks[Math.floor(Math.random() * ks.length)]; TT.Save.addGadget(g); res.bonusGadget = C.GADGETS[g].name; }
      var ids = [];
      this.level.team.forEach(function (q) { if (ids.indexOf(q) < 0) ids.push(q); });
      (this.level.containers || []).forEach(function (c) { (c.holds || []).forEach(function (h) { if (ids.indexOf(h.k) < 0) ids.push(h.k); }); });
      if ((this.level.invasives || []).length) ids.push('lionfish');
      if (!this.puzzle) ids.push(TT.worldByN(this.level.world).card);
      res.newCards = TT.Save.unlockCards(ids);
      this.sfx.play('win'); TT.Haptics.buzz([30, 60, 30, 60, 70]);
    } else this.sfx.play('lose');
    this.result = res;
    var self = this;
    this.time.delayedCall(win ? 900 : 500, function () { self.events.emit('finished', res); });
  },
  finishArcade: function () {
    var C = TT.CFG, cleared = this.wave - (this.trapped > 0 ? 1 : 0);
    var finalScore = Math.max(0, Math.round(this.score));
    var best = TT.Save.recordArcade(cleared, finalScore);
    var res = { win: cleared > 0, how: 'arcade', mode: 'arcade', wave: this.wave, cleared: cleared, stars: 0, health: Math.round(this.health), score: finalScore,
      freed: this.freed, total: this.totalAnimals, time: Math.round(this.elapsed), newBest: best, best: TT.Save.arcadeBest(), newCards: [], bonusGadget: null };
    this.sfx.play(cleared > 0 ? 'win' : 'lose');
    this.result = res;
    var self = this;
    this.time.delayedCall(700, function () { self.events.emit('finished', res); });
  },
  restartLevel: function () { this.scene.stop('UI'); this.scene.restart({ levelId: this.level.id, mode: this.mode }); },
  toMenu: function () { this.scene.stop('UI'); this.scene.start(this.puzzle ? 'PuzzleSelect' : this.arcade ? 'Title' : 'LevelSelect'); },
  nextLevel: function () {
    var list = this.puzzle ? TT.PUZZLES : TT.LEVELS, i = list.indexOf(this.level), n = list[i + 1];
    this.scene.stop('UI');
    if (n) this.scene.restart({ levelId: n.id, mode: this.mode }); else this.scene.start(this.puzzle ? 'PuzzleSelect' : 'LevelSelect');
  }
});

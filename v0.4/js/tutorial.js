// Tide Tossers v0.2 — show-don't-tell tutorial: a ghost finger demonstrates each move the first time.
//   1-1: drag back and let go     1-2: hold to steer (slow-motion)     1-3: tap for the ability (slow-motion)
window.TT = window.TT || {};

TT.Tutorial = function (game) {
  var C = TT.CFG;
  this.g = game;
  this.step = null;
  var id = game.level.id;
  if (id === '1-1' && !TT.Save.tutDone('aim')) this.step = 'aim';
  if (id === '1-2' && !TT.Save.tutDone('steer')) this.step = 'steer';
  if (id === '1-3' && !TT.Save.tutDone('tap')) this.step = 'tap';
  this.finger = game.add.image(0, 0, 'finger').setDepth(23).setScrollFactor(0).setVisible(false);
  this.ghost = game.add.graphics().setDepth(22);
  this.caption = game.add.text(C.WIDTH / 2, TT.MOBILE ? 205 : 170, '', {
    fontFamily: 'Georgia, "Times New Roman", serif', fontSize: TT.MOBILE ? '44px' : '36px', color: '#ffffff',
    stroke: '#04202c', strokeThickness: 7, align: 'center'
  }).setOrigin(0.5).setDepth(23).setScrollFactor(0).setVisible(false);
  this.t = 0;
};

TT.Tutorial.prototype.covers = function () { return !!this.step; };

TT.Tutorial.prototype.hide = function () {
  this.finger.setVisible(false); this.caption.setVisible(false); this.ghost.clear();
  this.g.tutorialSlow = false;
};

TT.Tutorial.prototype.onLaunch = function () {
  if (this.step === 'aim') { TT.Save.markTut('aim'); this.step = null; this.hide(); }
};

TT.Tutorial.prototype.say = function (text) { this.caption.setText(text).setVisible(true); };

// Screen position of a world point
TT.Tutorial.prototype.scr = function (x, y) { var cam = this.g.cameras.main; return { x: x - cam.scrollX, y: y - cam.scrollY }; };

TT.Tutorial.prototype.update = function (dt) {
  var g = this.g, C = TT.CFG;
  if (!this.step || g.state === 'done') { if (this.finger.visible || this.caption.visible) this.hide(); return; }
  this.t += dt;
  this.ghost.clear();

  if (this.step === 'aim') {
    if (g.state !== 'aim' || g.dragging || !g.aimSprite) { this.finger.setVisible(false); this.caption.setVisible(false); return; }
    // 2.6 s loop: appear on the rescuer, pull back-left, let go
    var cyc = this.t % 2.6, start = this.scr(g.sling.x, g.sling.y), pull = { x: -135, y: 48 };
    var k = Phaser.Math.Clamp((cyc - 0.4) / 1.1, 0, 1), e = Phaser.Math.Easing.Sine.InOut(k);
    var fx = start.x + pull.x * e, fy = start.y + pull.y * e;
    var a = cyc < 0.3 ? cyc / 0.3 : cyc > 2.1 ? Math.max(0, 1 - (cyc - 2.1) / 0.4) : 1;
    this.finger.setVisible(true).setPosition(fx, fy).setAlpha(a * 0.95).setScale(cyc > 0.3 && cyc < 1.9 ? 0.85 : 1);
    if (k > 0.05 && cyc < 1.9) {
      var pts = g.simulate({ x: pull.x * e, y: pull.y * e }, 70);
      for (var i = 0; i < pts.length; i += 4) { this.ghost.fillStyle(0xffffff, 0.5 * (1 - i / 70)); this.ghost.fillCircle(pts[i].x, pts[i].y, 3); }
    }
    this.say(TT.MOBILE ? 'Drag back anywhere on the left, then let go' : 'Drag back and let go');
    return;
  }

  var r = g.current;
  var inFlight = g.state === 'flight' && r && r.alive;
  if (this.step === 'steer') {
    if (inFlight && r.steeredFrames > 40) { TT.Save.markTut('steer'); this.step = null; this.hide(); g.message('Nice steering! Time slows while you steer.', 3000); return; }
    var show = inFlight && g.water.isUnder(r.body.position.y) && !g.steer.isActive(r) && r.stamina > 0;
    if (!show) { this.hide(); if (g.state === 'aim' && g.shots === 0) { this.caption.setVisible(false); } return; }
    g.tutorialSlow = true;
    var cyc2 = this.t % 1.6;
    if (g.steer.mode === 'swipe') {
      var base = { x: C.WIDTH * 0.62, y: C.HEIGHT * 0.72 }, k2 = Phaser.Math.Clamp((cyc2 - 0.25) / 0.8, 0, 1);
      this.finger.setVisible(true).setPosition(base.x + 90 * k2, base.y + 10 * k2).setScale(0.85).setAlpha(cyc2 > 1.35 ? 0.3 : 0.95);
      this.ghost.lineStyle(3, 0xffffff, 0.35); this.ghost.strokeCircle(base.x + g.cameras.main.scrollX, base.y + g.cameras.main.scrollY, C.SWIPE_STICK_RADIUS);
      this.say('Hold and drag the way you want to swim');
    } else {
      var tgt = g.containers.filter(function (c) { return c.alive; })[0];
      var tp = tgt ? this.scr(tgt.sprite.x, tgt.sprite.y) : { x: C.WIDTH * 0.75, y: C.HEIGHT * 0.8 };
      this.finger.setVisible(true).setPosition(tp.x, tp.y).setScale(0.85 + 0.15 * Math.sin(this.t * 8)).setAlpha(0.95);
      this.say('Hold where you want to swim');
    }
    return;
  }

  if (this.step === 'tap') {
    if (inFlight && r.abilityUsed) { TT.Save.markTut('tap'); this.step = null; this.hide(); return; }
    var near = false;
    if (inFlight && r.id === 'pistolshrimp' && g.water.isUnder(r.body.position.y)) {
      var bx = r.body.position.x, by = r.body.position.y;
      near = g.objects.some(function (o) { return o.alive && Phaser.Math.Distance.Between(bx, by, o.body.position.x, o.body.position.y) < 230; });
    }
    if (!near) { this.hide(); return; }
    g.tutorialSlow = true;
    var rp = this.scr(r.body.position.x, r.body.position.y), cyc3 = this.t % 0.9;
    this.finger.setVisible(true).setPosition(rp.x + 70, rp.y - 60).setScale(cyc3 < 0.25 ? 0.75 : 1).setAlpha(0.95);
    this.say('Tap now!');
  }
};

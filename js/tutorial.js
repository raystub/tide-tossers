// Tide Tossers v0.5 — show-don't-tell tutorial for the swim game. Each step shows once, with a big caption and
// (on phones) a ghost finger demonstrating the move.
//   1-1: swim with the stick, then use the ability on a net.     1-2: switch rescuer.
window.TT = window.TT || {};

TT.Tutorial = function (game) {
  this.g = game;
  var id = game.level.id;
  this.step = null; this.t = 0; this.moved = 0; this.last = null;
  if (id === '1-1' && !TT.Save.tutDone('swim')) this.step = 'swim';
  else if (id === '1-1' && !TT.Save.tutDone('ability')) this.step = 'ability';
  else if (id === '1-2' && !TT.Save.tutDone('swap')) this.step = 'swap';
  this.ui = null; this.finger = null; this.caption = null;
};

TT.Tutorial.prototype.covers = function () { return !!this.step; };

// The caption and finger live in the UI scene (screen space); build them once it's running.
TT.Tutorial.prototype.build = function () {
  var ui = this.g.scene.get('UI'), C = TT.CFG;
  if (!ui || !ui.sys.isActive() || !ui.controls) return false;
  this.ui = ui;
  this.finger = ui.add.image(0, 0, 'finger').setDepth(45).setVisible(false);
  this.ring = ui.add.graphics().setDepth(44);
  this.caption = ui.add.text(C.WIDTH / 2, TT.MOBILE ? 215 : 175, '', {
    fontFamily: TT.UI.display, fontStyle: '800', fontSize: TT.MOBILE ? '42px' : '34px', color: '#ffffff', stroke: '#06283a', strokeThickness: 8, align: 'center'
  }).setOrigin(0.5).setDepth(45).setVisible(false);
  return true;
};

TT.Tutorial.prototype.hide = function () {
  if (!this.ui) return;
  this.finger.setVisible(false); this.caption.setVisible(false); this.ring.clear();
};
TT.Tutorial.prototype.done = function (key, next) {
  TT.Save.markTut(key); this.step = next || null; this.t = 0; this.hide();
};
TT.Tutorial.prototype.onAbility = function () {};
TT.Tutorial.prototype.onRescue = function () { if (this.step === 'ability' || this.step === 'swim') { TT.Save.markTut('swim'); this.done('ability'); } };
TT.Tutorial.prototype.onSwap = function () { if (this.step === 'swap') this.done('swap'); };

TT.Tutorial.prototype.update = function (dt) {
  var g = this.g, C = TT.CFG, M = TT.MOBILE;
  if (!this.step) return;
  if (!this.ui && !this.build()) return;
  if (g.state !== 'play' || g.paused) { this.hide(); return; }
  this.t += dt;
  var ui = this.ui, W = C.WIDTH, H = C.HEIGHT, pos = g.player.pos();
  this.ring.clear();

  if (this.step === 'swim') {
    if (this.last) this.moved += Math.abs(pos.x - this.last.x) + Math.abs(pos.y - this.last.y);
    this.last = { x: pos.x, y: pos.y };
    if (ui.controls.used && this.moved > 500) { this.done('swim', 'ability'); return; }
    if (this.t < 1.2) return;                               // let the splash-in finish first
    this.caption.setVisible(true).setText(M ? 'Drag on the left side to swim' : 'Hold the mouse button (or WASD) to swim');
    if (M && !ui.controls.stick) {
      var cyc = this.t % 2.2, bx = W * 0.2, by = H * 0.68, k = Phaser.Math.Clamp((cyc - 0.3) / 1.0, 0, 1), e = Phaser.Math.Easing.Sine.InOut(k);
      this.finger.setVisible(true).setPosition(bx + 80 * e, by + 26 * e).setScale(0.9).setAlpha(cyc > 1.8 ? Math.max(0, 1 - (cyc - 1.8) / 0.4) : 0.95);
      this.ring.lineStyle(3, 0xffffff, 0.35); this.ring.strokeCircle(bx, by, C.STICK_RADIUS * ui.controls.gpx());
    } else this.finger.setVisible(false);
    return;
  }

  if (this.step === 'ability') {
    var near = g.containers.some(function (c) { return c.alive && Phaser.Math.Distance.Between(pos.x, pos.y, c.sprite.x, c.sprite.y) < 330; });
    if (!near) { this.finger.setVisible(false); this.caption.setVisible(true).setText('Follow the arrow to a ghost net'); return; }
    this.caption.setVisible(true).setText(M ? 'Aim at the net and tap DASH' : 'Aim at the net and press Space to dash');
    var pulse = 1 + 0.12 * Math.sin(this.t * 8);
    this.ring.lineStyle(5, 0xffffff, 0.9); this.ring.strokeCircle(ui.actX, ui.actY, (ui.actR + 14) * pulse);
    if (M) this.finger.setVisible(true).setPosition(ui.actX - 6, ui.actY + 10).setScale(this.t % 0.9 < 0.25 ? 0.78 : 1).setAlpha(0.95);
    return;
  }

  if (this.step === 'swap') {
    if (this.t < 2.5) return;
    this.caption.setVisible(true).setText(M ? 'Tap SWITCH to change rescuer' : 'Press Q to switch rescuer');
    if (ui.swapG) {
      var p2 = 1 + 0.12 * Math.sin(this.t * 8);
      this.ring.lineStyle(5, 0xffffff, 0.9); this.ring.strokeCircle(ui.swapX, ui.swapY, (ui.swapR + 12) * p2);
      if (M) this.finger.setVisible(true).setPosition(ui.swapX - 4, ui.swapY + 8).setScale(this.t % 0.9 < 0.25 ? 0.78 : 1).setAlpha(0.95);
    }
  }
};

// Tide Tossers v0.5 — input. Lives in the UI scene (screen space, unaffected by the game camera's zoom).
//   Touch:    left half = floating thumb-stick (swim); right half = tap for the ability. Two thumbs work together.
//   Mouse:    hold the left button to swim toward the pointer; right-click or Space for the ability.
//   Keyboard: arrows / WASD swim, Space or J = ability, Q / E / Shift = switch rescuer, P / Esc = pause.
// Every frame it writes { x, y, push } into game.player.input.
window.TT = window.TT || {};

TT.Controls = function (ui, game) {
  var self = this, C = TT.CFG;
  this.ui = ui; this.game = game;
  this.stick = null;        // { p: pointer, bx, by } while a thumb is steering
  this.mouse = null;        // pointer while the mouse button is held
  this.dir = null;          // filtered stick direction (radians)
  this.push = 0;
  this.used = false;        // true once the player has steered (for the tutorial)
  this.gfx = ui.add.graphics().setDepth(40);
  ui.input.addPointer(2);
  if (ui.input.mouse) ui.input.mouse.disableContextMenu();

  this.onDown = function (p) {
    TT.Sfx.unlock();
    if (game.uiBlocking || game.state !== 'play') return;
    if (game.netCutterArmed) { game.tryNetCut(game.cameras.main.getWorldPoint(p.x, p.y)); return; }
    if (p.wasTouch) {
      if (p.x < C.WIDTH * C.STICK_ZONE && !self.stick) { self.stick = { p: p, bx: p.x, by: p.y }; self.dir = null; }
      else game.player.useAbility();
    } else if (p.rightButtonDown()) game.player.useAbility();
    else self.mouse = p;
  };
  this.onUp = function (p) {
    if (self.stick && self.stick.p === p) { self.stick = null; }
    if (self.mouse === p) self.mouse = null;
  };
  ui.input.on('pointerdown', this.onDown);
  ui.input.on('pointerup', this.onUp);
  ui.input.on('pointerupoutside', this.onUp);

  var kb = ui.input.keyboard;
  this.keys = kb.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT');
  kb.on('keydown-SPACE', function () { game.player.useAbility(); });
  kb.on('keydown-J', function () { game.player.useAbility(); });
  ['Q', 'E', 'SHIFT'].forEach(function (k) { kb.on('keydown-' + k, function () { game.player.swap(); }); });
  ui.events.once('shutdown', function () {
    ui.input.off('pointerdown', self.onDown); ui.input.off('pointerup', self.onUp); ui.input.off('pointerupoutside', self.onUp);
    kb.removeAllListeners();
  });
};

// Game px per screen px, so the stick is the same physical size on every phone.
TT.Controls.prototype.gpx = function () {
  var s = this.ui.scale, d = s.displaySize && s.displaySize.width;
  return d ? s.width / d : 1;
};

TT.Controls.prototype.release = function () { this.stick = null; this.mouse = null; this.gfx.clear(); };

TT.Controls.prototype.update = function (dt) {
  var C = TT.CFG, g = this.game, inp = g.player.input, W = Phaser.Math.Angle.Wrap, gfx = this.gfx;
  gfx.clear();
  if (g.botInput) { inp.x = g.botInput.x; inp.y = g.botInput.y; inp.push = g.botInput.push; return; }
  if (g.state !== 'play' || g.uiBlocking) { inp.push = 0; this.stick = null; this.mouse = null; return; }
  var x = 0, y = 0, push = 0, K = this.keys;

  if (this.stick) {
    var s = this.stick, p = s.p, gpx = this.gpx(), R = C.STICK_RADIUS * gpx, dead = C.STICK_DEADZONE * gpx;
    if (!p.isDown) { this.stick = null; }
    else {
      var sx = p.x - s.bx, sy = p.y - s.by, sl = Math.sqrt(sx * sx + sy * sy);
      // floating base: pulling past the rim drags the stick along, so reversing is a short move
      if (sl > R) { s.bx = p.x - sx / sl * R; s.by = p.y - sy / sl * R; sx = p.x - s.bx; sy = p.y - s.by; sl = R; }
      if (sl > dead) {
        var raw = Math.atan2(sy, sx);
        this.dir = this.dir === null ? raw : this.dir + W(raw - this.dir) * Math.min(1, dt * C.STICK_SMOOTH);
        x = Math.cos(this.dir); y = Math.sin(this.dir); push = Math.min(1, (sl - dead) / (R - dead));
      }
      gfx.fillStyle(0x04202c, 0.28); gfx.fillCircle(s.bx, s.by, R);
      gfx.lineStyle(3, 0xe9fbff, 0.55); gfx.strokeCircle(s.bx, s.by, R);
      gfx.fillStyle(0xe9fbff, 0.85); gfx.fillCircle(s.bx + sx, s.by + sy, R * 0.4);
      gfx.lineStyle(2, 0x04202c, 0.3); gfx.strokeCircle(s.bx + sx, s.by + sy, R * 0.4);
    }
  } else if (this.mouse && this.mouse.isDown) {
    var wp = g.cameras.main.getWorldPoint(this.mouse.x, this.mouse.y), pos = g.player.pos();
    var dx = wp.x - pos.x, dy = wp.y - pos.y, d = Math.sqrt(dx * dx + dy * dy);
    if (d > 14) { x = dx / d; y = dy / d; push = Math.min(1, d / C.MOUSE_FULL_DIST); }
  } else {
    var kx = (K.RIGHT.isDown || K.D.isDown ? 1 : 0) - (K.LEFT.isDown || K.A.isDown ? 1 : 0);
    var ky = (K.DOWN.isDown || K.S.isDown ? 1 : 0) - (K.UP.isDown || K.W.isDown ? 1 : 0);
    if (kx || ky) { var kl = Math.sqrt(kx * kx + ky * ky); x = kx / kl; y = ky / kl; push = 1; }
  }
  if (push > 0) this.used = true;
  inp.x = x; inp.y = y; inp.push = push;
};

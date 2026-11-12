// Tide Tossers v0.5 — UIScene: HUD over the game (team, reef health, tide gauge, ability and switch buttons,
// arrows to trapped animals, messages, pause, gadgets, results) plus the touch/mouse/keyboard controls.
window.TT = window.TT || {};

TT.UI = {
  // Scale text up on phones: small labels the most, big titles a little.
  fs: function (n) { return (TT.MOBILE ? Math.round(n * (n <= 17 ? 1.4 : 1.15)) : n) + 'px'; },
  display: 'system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  font: 'system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  sans: 'system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  // Bold, outlined display text.
  title: function (scene, x, y, str, size, color) {
    return scene.add.text(x, y, str, { fontFamily: TT.UI.display, fontStyle: '800', fontSize: TT.UI.fs(size), color: color || '#ffffff', stroke: '#06283a', strokeThickness: Math.max(4, Math.round(size / 7)) }).setOrigin(0.5);
  },
  // Glossy pill panel drawn into a Graphics object.
  panel: function (g, x, y, w, h, r, fill, alpha, stroke) {
    g.fillStyle(0x02131c, 0.35); g.fillRoundedRect(x + 2, y + 4, w, h, r);
    g.fillStyle(fill, alpha === undefined ? 0.92 : alpha); g.fillRoundedRect(x, y, w, h, r);
    g.fillStyle(0xffffff, 0.1); g.fillRoundedRect(x + 3, y + 3, w - 6, Math.max(4, h * 0.42), { tl: Math.max(2, r - 3), tr: Math.max(2, r - 3), bl: 6, br: 6 });
    g.lineStyle(2, stroke || 0xbdf3ff, 0.75); g.strokeRoundedRect(x, y, w, h, r);
  },
  // A rounded, glossy button. Clicks never reach the game below.
  button: function (scene, x, y, w, h, label, onClick, opts) {
    opts = opts || {};
    var c = scene.add.container(x, y);
    var g = scene.add.graphics();
    var draw = function (hover) {
      g.clear();
      TT.UI.panel(g, -w / 2, -h / 2, w, h, Math.min(h / 2, opts.radius || 16), opts.fill || 0x0f5a78, hover ? 1 : 0.92, opts.stroke);
    };
    draw(false);
    var t = scene.add.text(0, 0, label, { fontFamily: TT.UI.sans, fontStyle: opts.plain ? '' : '700', fontSize: TT.UI.fs(opts.size || 17), color: opts.color || '#ffffff', align: 'center', lineSpacing: 2 }).setOrigin(0.5);
    c.add([g, t]);
    c.setSize(w, h).setInteractive({ useHandCursor: true });
    c.on('pointerover', function () { draw(true); });
    c.on('pointerout', function () { draw(false); c.setScale(1); });
    c.on('pointerdown', function (p, lx, ly, ev) { ev.stopPropagation(); TT.Sfx.unlock(); c.setScale(0.96); });
    c.on('pointerup', function (p, lx, ly, ev) { ev.stopPropagation(); c.setScale(1); onClick(); });
    c.label = t; c.redraw = draw;
    return c;
  },
  ABILITY_HELP: {
    tang: 'Dash: a burst of speed. Ram nets and junk with it.',
    flyingfish: 'Leap: jumps out of the water and glides over walls and floating junk. Hits plastic and glass twice as hard.',
    puffer: 'Puff: blows up to shove junk away and drive off lionfish. Immune to spines.',
    pistolshrimp: 'Snap: an underwater shockwave that shatters nearby glass and plastic.',
    loggerhead: 'Shove: a slow, heavy charge that bashes traps and moves heavy junk.',
    swordfish: 'Pierce: darts straight through wood, plastic and metal. Slices nets and lines on contact. Concrete stops it.',
    hammerhead: 'Ram: a hard charge. The best way to crack concrete.'
  }
};

TT.UIScene = new Phaser.Class({
  Extends: Phaser.Scene,
  initialize: function UIScene() { Phaser.Scene.call(this, { key: 'UI' }); },
  init: function (data) { this.game2 = data.game; },

  create: function () {
    var C = TT.CFG, g = this.game2, self = this, W = C.WIDTH, H = C.HEIGHT, M = TT.MOBILE;
    this.panelOpen = null; this.infoBox = null; this.gadgetPanel = null; this.pausePanel = null;
    this.controls = new TT.Controls(this, g);

    // ---- top bar ----
    this.bar = this.add.graphics();
    this.bar.fillGradientStyle(0x031c2a, 0x031c2a, 0x031c2a, 0x031c2a, 0.7, 0.7, 0, 0);
    this.bar.fillRect(0, 0, W, M ? 120 : 92);
    this.add.text(18, 8, g.level.id + '  ' + g.level.name.toUpperCase() + '  ·  ' + C.DIFFICULTY[g.difficulty].name.toUpperCase(),
      { fontFamily: TT.UI.sans, fontStyle: '700', fontSize: TT.UI.fs(11), color: '#bdf3ff', stroke: '#031c2a', strokeThickness: 3, letterSpacing: 1 });

    // team portraits (tap to switch)
    this.portraits = [];
    var ps = M ? 62 : 46, py = (M ? 30 : 26) + ps / 2;
    g.player.team.forEach(function (m, i) {
      var x = 18 + ps / 2 + i * (ps + 10);
      var ring = self.add.graphics();
      var key = TT.Art.speciesKey(self, m.id);
      var img = self.add.image(x, py, key).setScale(TT.Art.scaleFor(self, key, ps * 0.8));
      var hit = self.add.zone(x, py, ps + 8, ps + 8).setInteractive({ useHandCursor: true });
      hit.on('pointerdown', function (p, lx, ly, ev) { ev.stopPropagation(); });
      hit.on('pointerup', function (p, lx, ly, ev) {
        ev.stopPropagation();
        if (g.player.index === i || g.player.team.length < 2) self.showInfo({ title: m.def.name + (m.def.nick ? ' ("' + m.def.nick + '")' : ''), text: TT.UI.ABILITY_HELP[m.id] }, x + 150, py + ps);
        else g.player.swap(i);
      });
      self.portraits.push({ ring: ring, img: img, x: x, y: py, r: ps / 2 });
    });

    // reef health + animals freed (centre)
    this.healthG = this.add.graphics();
    this.healthText = this.add.text(W / 2, M ? 6 : 8, '', { fontFamily: TT.UI.sans, fontStyle: '700', fontSize: TT.UI.fs(12), stroke: '#031c2a', strokeThickness: 3, color: '#ffffff' }).setOrigin(0.5, 0);
    this.freedText = this.add.text(W / 2, M ? 60 : 50, '', { fontFamily: TT.UI.sans, fontStyle: '700', fontSize: TT.UI.fs(13), stroke: '#031c2a', strokeThickness: 3, color: '#bff7d2' }).setOrigin(0.5, 0);

    // tide gauge (right of centre)
    this.tideG = this.add.graphics();
    this.tideText = this.add.text(0, 0, '', { fontFamily: TT.UI.display, fontStyle: '800', fontSize: TT.UI.fs(20), stroke: '#031c2a', strokeThickness: 4, color: '#ffffff' }).setOrigin(0.5);
    this.tideLabel = this.add.text(0, 0, 'TIDE', { fontFamily: TT.UI.sans, fontStyle: '700', fontSize: TT.UI.fs(10), color: '#bdf3ff', stroke: '#031c2a', strokeThickness: 3 }).setOrigin(0.5);
    this.tideText.setVisible(g.timed); this.tideLabel.setVisible(g.timed);

    // pause + gadgets (top right)
    var bw = M ? 76 : 54, bh = M ? 60 : 40, by = (M ? 14 : 12) + bh / 2;
    TT.UI.button(this, W - 16 - bw / 2, by, bw, bh, 'II', function () { self.togglePause(); }, { size: 17 });
    this.gadgetBtn = TT.UI.button(this, W - 16 - bw - 12 - (M ? 70 : 52), by, M ? 140 : 104, bh, 'Gadgets', function () { self.toggleGadgets(); }, { size: 13, fill: 0x7a5a14, stroke: 0xffe7a8 });
    this.gadgetLabel = this.add.text(W - 16, by + bh / 2 + 8, '', { fontFamily: TT.UI.sans, fontStyle: '700', fontSize: TT.UI.fs(12), color: '#ffe7a8', stroke: '#031c2a', strokeThickness: 3 }).setOrigin(1, 0);

    // ---- ability + switch buttons (bottom right) ----
    var ar = this.actR = M ? 74 : 52;
    this.actX = W - ar - (M ? 34 : 26); this.actY = H - ar - (M ? 30 : 24);
    this.actG = this.add.graphics();
    this.actText = this.add.text(this.actX, this.actY, '', { fontFamily: TT.UI.display, fontStyle: '800', fontSize: TT.UI.fs(M ? 19 : 17), color: '#ffffff', stroke: '#06283a', strokeThickness: 5 }).setOrigin(0.5);
    var az = this.add.zone(this.actX, this.actY, ar * 2.2, ar * 2.2).setInteractive({ useHandCursor: true });
    az.on('pointerdown', function (p, lx, ly, ev) { ev.stopPropagation(); TT.Sfx.unlock(); if (!g.uiBlocking) g.player.useAbility(); });
    if (g.player.team.length > 1) {
      var sr = this.swapR = M ? 46 : 34;
      this.swapX = this.actX - ar - sr - (M ? 14 : 10); this.swapY = H - sr - (M ? 26 : 20);
      this.swapG = this.add.graphics();
      this.swapImg = this.add.image(this.swapX, this.swapY, TT.Art.speciesKey(this, g.player.team[1].id));
      this.swapLabel = this.add.text(this.swapX, this.swapY - sr - 4, 'SWITCH', { fontFamily: TT.UI.sans, fontStyle: '700', fontSize: TT.UI.fs(10), color: '#bdf3ff', stroke: '#031c2a', strokeThickness: 3 }).setOrigin(0.5, 1);
      var sz = this.add.zone(this.swapX, this.swapY, sr * 2.3, sr * 2.3).setInteractive({ useHandCursor: true });
      sz.on('pointerdown', function (p, lx, ly, ev) { ev.stopPropagation(); TT.Sfx.unlock(); if (!g.uiBlocking) g.player.swap(); });
    }
    if (!M) this.add.text(W - 16, H - 8, 'Hold mouse or WASD/arrows to swim  ·  Space = ability  ·  Q = switch  ·  P = pause',
      { fontFamily: TT.UI.sans, fontSize: '12px', color: '#d8f1f4', stroke: '#031c2a', strokeThickness: 3 }).setOrigin(1, 1).setAlpha(0.85).setX(this.actX - ar - (g.player.team.length > 1 ? 90 : 16));

    // arrows to trapped animals / exit
    this.arrowG = this.add.graphics();

    // message banner
    this.msgBox = this.add.container(W / 2, M ? 176 : 134).setAlpha(0);
    this.msgBg = this.add.graphics(); this.msgText = this.add.text(0, 0, '', { fontFamily: TT.UI.sans, fontStyle: '600', fontSize: TT.UI.fs(16), color: '#ffffff', align: 'center', wordWrap: { width: M ? 820 : 640 } }).setOrigin(0.5);
    this.msgBox.add([this.msgBg, this.msgText]);

    g.events.on('message', this.showMessage, this);
    g.events.on('finished', this.showResult, this);
    this.input.keyboard.on('keydown-P', function () { self.togglePause(); });
    this.input.keyboard.on('keydown-ESC', function () { self.togglePause(); });
    this.events.once('shutdown', function () { g.events.off('message', self.showMessage, self); g.events.off('finished', self.showResult, self); });
    // the game pauses itself when the app goes to the background
    this.onHide = function () { if (document.hidden && g.state === 'play' && !self.pausePanel) self.togglePause(); };
    document.addEventListener('visibilitychange', this.onHide);
    this.events.once('shutdown', function () { document.removeEventListener('visibilitychange', self.onHide); });
  },

  // ---------- small cards ----------
  showInfo: function (info, sx, sy) {
    var C = TT.CFG, self = this;
    this.hideInfo();
    var w = TT.MOBILE ? 460 : 360, pad = 16;
    var title = this.add.text(pad, pad, info.title, { fontFamily: TT.UI.display, fontStyle: '800', fontSize: TT.UI.fs(19), color: '#ffffff', wordWrap: { width: w - pad * 2 } });
    var body = this.add.text(pad, pad + title.height + 6, info.text, { fontFamily: TT.UI.sans, fontSize: TT.UI.fs(15), color: '#d8f1f4', wordWrap: { width: w - pad * 2 }, lineSpacing: 3 });
    var h = pad * 2 + title.height + 6 + body.height;
    var x = Phaser.Math.Clamp(sx - w / 2, 12, C.WIDTH - w - 12), y = Phaser.Math.Clamp(sy, 12, C.HEIGHT - h - 12);
    var bg = this.add.graphics(); TT.UI.panel(bg, 0, 0, w, h, 16, 0x0a3d55, 0.97);
    this.infoBox = this.add.container(x, y, [bg, title, body]).setAlpha(0).setDepth(30);
    this.tweens.add({ targets: this.infoBox, alpha: 1, duration: 150 });
    this.infoTimer = this.time.delayedCall(4500, function () { self.hideInfo(); });
  },
  hideInfo: function () {
    if (this.infoTimer) { this.infoTimer.remove(); this.infoTimer = null; }
    if (this.infoBox) { this.infoBox.destroy(); this.infoBox = null; }
  },
  showMessage: function (text, ms) {
    this.msgText.setText(text);
    var b = this.msgText.getBounds(), w = b.width + 44, h = b.height + 24;
    this.msgBg.clear(); TT.UI.panel(this.msgBg, -w / 2, -h / 2, w, h, 16, 0x0a3d55, 0.92);
    this.tweens.killTweensOf(this.msgBox);
    this.msgBox.setAlpha(0);
    this.tweens.add({ targets: this.msgBox, alpha: 1, duration: 250 });
    this.tweens.add({ targets: this.msgBox, alpha: 0, duration: 400, delay: ms || 4000 });
  },

  // ---------- panels ----------
  shade: function () {
    var s = this.add.rectangle(0, 0, TT.CFG.WIDTH, TT.CFG.HEIGHT, 0x020b10, 0.6).setOrigin(0, 0).setInteractive().setDepth(50);
    s.on('pointerdown', function (p, x, y, ev) { ev.stopPropagation(); });
    return s;
  },
  togglePause: function () {
    var g = this.game2, C = TT.CFG, self = this, W = C.WIDTH, H = C.HEIGHT, M = TT.MOBILE;
    if (g.result) return;
    if (this.pausePanel) { this.pausePanel.destroy(); this.pausePanel = null; g.uiBlocking = false; g.paused = false; this.scene.resume('Game'); return; }
    if (this.gadgetPanel) this.toggleGadgets();
    g.uiBlocking = true; g.paused = true; this.controls.release(); this.scene.pause('Game');
    var layer = this.add.container(0, 0).setDepth(50);
    var pw = M ? 560 : 440, bwid = M ? 420 : 320, bh = M ? 64 : 48, gap = M ? 14 : 12;
    var rows = [
      ['Resume', function () { self.togglePause(); }, 0x16806a],
      ['Restart', function () { self.scene.resume('Game'); g.restartLevel(); }],
      ['Levels', function () { self.scene.resume('Game'); g.toMenu(); }],
      ['Sound: ' + (TT.Sfx.isMuted() ? 'Off' : 'On'), function () { TT.Sfx.setMuted(!TT.Sfx.isMuted()); self.togglePause(); self.togglePause(); }]
    ];
    if (TT.Haptics.available()) rows.push(['Vibration: ' + (TT.Save.haptics() ? 'On' : 'Off'), function () { TT.Save.setHaptics(!TT.Save.haptics()); self.togglePause(); self.togglePause(); }]);
    var ph = 150 + rows.length * (bh + gap) + (M ? 90 : 70), py = H / 2 - ph / 2;
    var card = this.add.graphics(); TT.UI.panel(card, W / 2 - pw / 2, py, pw, ph, 22, 0x0a3d55, 0.98);
    layer.add([this.shade(), card, TT.UI.title(this, W / 2, py + 44, 'Paused', 30)]);
    layer.add(this.add.text(W / 2, py + 84, g.level.hint, { fontFamily: TT.UI.sans, fontSize: TT.UI.fs(13), color: '#d8f1f4', align: 'center', wordWrap: { width: pw - 60 } }).setOrigin(0.5, 0));
    rows.forEach(function (r, i) { layer.add(TT.UI.button(self, W / 2, py + 150 + (M ? 30 : 16) + i * (bh + gap) + bh / 2, bwid, bh, r[0], r[1], { size: 16, fill: r[2] })); });
    this.pausePanel = layer;
  },
  toggleGadgets: function () {
    var g = this.game2, C = TT.CFG, self = this, M = TT.MOBILE, W = C.WIDTH;
    if (this.gadgetPanel) { this.gadgetPanel.destroy(); this.gadgetPanel = null; g.uiBlocking = false; g.paused = false; this.scene.resume('Game'); return; }
    if (g.state !== 'play' || g.gadgetUsed) return;
    g.uiBlocking = true; g.paused = true; this.controls.release(); this.scene.pause('Game');
    var keys = Object.keys(C.GADGETS), rowH = M ? 78 : 60, pw = M ? 520 : 400, ph = 110 + keys.length * rowH + (M ? 70 : 56), py = C.HEIGHT / 2 - ph / 2;
    var layer = this.add.container(0, 0).setDepth(50);
    var card = this.add.graphics(); TT.UI.panel(card, W / 2 - pw / 2, py, pw, ph, 22, 0x0a3d55, 0.98);
    layer.add([this.shade(), card, TT.UI.title(this, W / 2, py + 40, 'Gadgets', 28)]);
    layer.add(this.add.text(W / 2, py + 72, 'One gadget per level', { fontFamily: TT.UI.sans, fontSize: TT.UI.fs(12), color: '#bdf3ff' }).setOrigin(0.5));
    keys.forEach(function (k, i) {
      var def = C.GADGETS[k], n = TT.Save.gadgetCount(k), ok = g.gadgetAvailable(k);
      layer.add(TT.UI.button(self, W / 2, py + 100 + i * rowH + rowH / 2, pw - 40, rowH - 10, def.name + '  ×' + n + '\n' + def.desc, function () {
        if (!ok) return;
        self.toggleGadgets();
        if (g.useGadget(k)) self.showMessage(def.name + ' active.', 2500);
      }, { size: 13, fill: ok ? 0x7a5a14 : 0x26343a, stroke: ok ? 0xffe7a8 : 0x55686e, color: ok ? '#ffffff' : '#8fa1a6' }));
    });
    layer.add(TT.UI.button(this, W / 2, py + ph - (M ? 44 : 34), 200, M ? 56 : 42, 'Back', function () { self.toggleGadgets(); }, { size: 15 }));
    this.gadgetPanel = layer;
  },

  // ---------- per-frame HUD ----------
  update: function (time, delta) {
    var g = this.game2, C = TT.CFG, W = C.WIDTH, H = C.HEIGHT, M = TT.MOBILE, pl = g.player;
    if (!g || !g.sys || !pl) return;
    this.controls.update(Math.min(0.05, delta / 1000));
    var playing = g.state === 'play';

    // reef health bar with star ticks
    var hg = this.healthG, bw = M ? 330 : 280, x0 = W / 2 - bw / 2 - (g.timed ? (M ? 56 : 44) : 0), y0 = M ? 30 : 26, hh = M ? 22 : 16;
    hg.clear();
    hg.fillStyle(0x02131c, 0.85); hg.fillRoundedRect(x0 - 3, y0 - 3, bw + 6, hh + 6, (hh + 6) / 2);
    var f = g.health / 100;
    var col = Phaser.Display.Color.Interpolate.ColorWithColor(Phaser.Display.Color.ValueToColor(0xc9a45c), Phaser.Display.Color.ValueToColor(0x2fe0a4), 100, Math.round(f * 100));
    hg.fillStyle(Phaser.Display.Color.GetColor(col.r, col.g, col.b), 1); hg.fillRoundedRect(x0, y0, Math.max(hh, bw * f), hh, hh / 2);
    hg.fillStyle(0xffffff, 0.28); hg.fillRoundedRect(x0 + 3, y0 + 2, Math.max(hh, bw * f) - 6, hh * 0.38, hh * 0.19);
    [C.STAR2_HEALTH, C.STAR3_HEALTH].forEach(function (s) {
      var sx = x0 + bw * s / 100, on = g.health >= s;
      hg.fillStyle(on ? 0xffd75e : 0x02131c, 1); hg.fillCircle(sx, y0 + hh / 2, hh * 0.62);
      hg.lineStyle(2, on ? 0xfff2c8 : 0x5c8794, 1); hg.strokeCircle(sx, y0 + hh / 2, hh * 0.62);
    });
    this.healthText.setX(x0 + bw / 2).setText('REEF HEALTH ' + Math.round(g.health) + '%');
    this.freedText.setX(x0 + bw / 2).setText('Animals freed ' + g.freed + ' / ' + g.totalAnimals + (g.combo > 1 ? '    Chain x' + g.combo : ''));

    // tide gauge: a round dial that drains
    var tg = this.tideG; tg.clear();
    if (g.timed) {
      var tr = M ? 34 : 26, tx = x0 + bw + tr + (M ? 34 : 26), ty = y0 + hh / 2 + (M ? 12 : 8);
      var frac = Phaser.Math.Clamp(g.timeLeft / g.timeMax, 0, 1), low = g.timeLeft <= C.LOW_TIME;
      tg.fillStyle(0x02131c, 0.85); tg.fillCircle(tx, ty, tr + 4);
      tg.fillStyle(low ? 0xff6b4a : 0x2fb6e0, 1); tg.slice(tx, ty, tr, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac, false); tg.fillPath();
      tg.fillStyle(0x06283a, 1); tg.fillCircle(tx, ty, tr * 0.68);
      tg.lineStyle(2, 0xbdf3ff, 0.8); tg.strokeCircle(tx, ty, tr + 4);
      this.tideText.setPosition(tx, ty).setText(String(Math.max(0, Math.ceil(g.timeLeft)))).setColor(low ? '#ffb39a' : '#ffffff')
        .setScale(low && playing ? 1 + 0.08 * Math.sin(time / 90) : 1);
      this.tideLabel.setPosition(tx, ty + tr + (M ? 16 : 12));
    }

    // team portraits with cooldown rings
    for (var i = 0; i < this.portraits.length; i++) {
      var p = this.portraits[i], m = pl.team[i], on = i === pl.index, r = p.r;
      p.ring.clear();
      p.ring.fillStyle(on ? 0x16806a : 0x0a3d55, 0.92); p.ring.fillCircle(p.x, p.y, r);
      p.ring.lineStyle(on ? 4 : 2, on ? 0xbff7d2 : 0x7fb7c6, 1); p.ring.strokeCircle(p.x, p.y, r);
      if (m.cdLeft > 0) { p.ring.fillStyle(0x02131c, 0.6); p.ring.slice(p.x, p.y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (m.cdLeft / m.cdMax), false); p.ring.fillPath(); }
      p.img.setAlpha(on ? 1 : 0.75);
    }

    // ability button
    var ag = this.actG, ax = this.actX, ay = this.actY, ar = this.actR, mem = pl.member(), ready = pl.ready() && playing;
    ag.clear();
    ag.fillStyle(0x02131c, 0.4); ag.fillCircle(ax + 2, ay + 5, ar);
    ag.fillStyle(ready ? 0xff8a3c : 0x4a5a62, 0.95); ag.fillCircle(ax, ay, ar);
    ag.fillStyle(0xffffff, ready ? 0.22 : 0.08); ag.fillEllipse(ax, ay - ar * 0.38, ar * 1.5, ar * 0.8);
    if (mem.cdLeft > 0) { ag.fillStyle(0x02131c, 0.55); ag.slice(ax, ay, ar, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (mem.cdLeft / mem.cdMax), false); ag.fillPath(); }
    ag.lineStyle(4, ready ? 0xffe2c2 : 0x8fa1a6, 1); ag.strokeCircle(ax, ay, ar);
    if (ready) { ag.lineStyle(3, 0xffe2c2, 0.35 + 0.25 * Math.sin(time / 160)); ag.strokeCircle(ax, ay, ar + 7); }
    this.actText.setText(mem.def.ability.toUpperCase()).setAlpha(ready ? 1 : 0.6);

    // switch button shows who comes next
    if (this.swapG) {
      var sg = this.swapG, nx = pl.team[(pl.index + 1) % pl.team.length], sr = this.swapR, canSwap = playing && g.clock >= pl.swapReadyAt;
      sg.clear();
      sg.fillStyle(0x02131c, 0.4); sg.fillCircle(this.swapX + 2, this.swapY + 4, sr);
      sg.fillStyle(0x1d7fa3, canSwap ? 0.95 : 0.6); sg.fillCircle(this.swapX, this.swapY, sr);
      sg.fillStyle(0xffffff, 0.16); sg.fillEllipse(this.swapX, this.swapY - sr * 0.38, sr * 1.5, sr * 0.8);
      sg.lineStyle(3, 0xbdf3ff, 1); sg.strokeCircle(this.swapX, this.swapY, sr);
      var nk = TT.Art.speciesKey(this, nx.id);
      if (this.swapImg.texture.key !== nk) this.swapImg.setTexture(nk);
      this.swapImg.setScale(TT.Art.scaleFor(this, nk, sr * 1.45)).setAlpha(canSwap ? 1 : 0.6);
    }

    // arrows at the screen edge pointing to trapped animals (or the exit)
    var arr = this.arrowG; arr.clear();
    if (playing) {
      var v = g.cameras.main.worldView, z = g.cameras.main.zoom, self = this, targets = [];
      g.containers.forEach(function (c) { if (c.alive && c.animals.length) targets.push({ x: c.sprite.x, y: c.sprite.y, col: 0xffd75e }); });
      if (g.exitOpen) targets.push({ x: g.exit.x, y: g.exit.y, col: 0x7ff7d8 });
      var top = M ? 130 : 100, mx = M ? 54 : 40;
      targets.forEach(function (tgt) {
        if (tgt.x > v.x + 20 && tgt.x < v.right - 20 && tgt.y > v.y + 20 && tgt.y < v.bottom - 20) return;
        var sx = (tgt.x - v.x) * z, sy = (tgt.y - v.y) * z;
        var px = Phaser.Math.Clamp(sx, mx, W - mx), py2 = Phaser.Math.Clamp(sy, top, H - mx - 10);
        var ang = Math.atan2(sy - py2, sx - px), bob = 4 * Math.sin(time / 180), s = M ? 20 : 15;
        px += Math.cos(ang) * bob; py2 += Math.sin(ang) * bob;
        arr.fillStyle(0x02131c, 0.55); arr.fillCircle(px, py2, s + 6);
        arr.fillStyle(tgt.col, 1);
        arr.beginPath();
        arr.moveTo(px + Math.cos(ang) * s, py2 + Math.sin(ang) * s);
        arr.lineTo(px + Math.cos(ang + 2.4) * s * 0.8, py2 + Math.sin(ang + 2.4) * s * 0.8);
        arr.lineTo(px + Math.cos(ang - 2.4) * s * 0.8, py2 + Math.sin(ang - 2.4) * s * 0.8);
        arr.closePath(); arr.fillPath();
      });
    }

    // gadgets
    var any = playing && !g.gadgetUsed && Object.keys(C.GADGETS).some(function (k) { return g.gadgetAvailable(k); });
    this.gadgetBtn.setVisible(any);
    this.gadgetLabel.setText(g.gadgetUsed ? g.gadgetName + (g.netCutterArmed ? ': tap a net' : pl.shield ? ' on' : '') : '');
  },

  // ---------- results ----------
  showResult: function (res) {
    var C = TT.CFG, W = C.WIDTH, H = C.HEIGHT, g = this.game2, self = this, M = TT.MOBILE;
    g.uiBlocking = true; this.controls.release();
    this.tweens.killTweensOf(this.msgBox); this.msgBox.setAlpha(0); this.hideInfo();
    var layer = this.add.container(0, 0).setDepth(50);
    var pw = M ? 660 : 540, ph = M ? 480 : 400, px = W / 2, py = H / 2;
    var card = this.add.graphics(); TT.UI.panel(card, px - pw / 2, py - ph / 2, pw, ph, 24, 0x0a3d55, 0.98);
    var title = res.win ? (res.stars === 3 ? 'Reef restored!' : 'Rescue complete') : (res.how === 'tide' ? 'The tide went out' : 'Animals still trapped');
    layer.add([this.shade(), card, TT.UI.title(this, px, py - ph / 2 + 44, title, 32)]);
    for (var i = 0; i < 3; i++) {
      var on = i < res.stars, sx = px + (i - 1) * 78, sy = py - ph / 2 + 116 - (i === 1 ? 8 : 0);
      var s = this.add.star(sx, sy, 5, 14, 30, on ? 0xffd75e : 0x1c4a5c).setStrokeStyle(3, on ? 0xfff2c8 : 0x3f6f80);
      s.setScale(0); layer.add(s);
      this.tweens.add({ targets: s, scale: 1, angle: on ? 360 : 0, delay: 250 + i * 220, duration: 420, ease: 'Back.easeOut' });
    }
    var lines = [
      'Reef health ' + res.health + '%' + (res.win && res.stars < 3 ? '   (' + (res.stars === 1 ? C.STAR2_HEALTH : C.STAR3_HEALTH) + '% for the next star)' : ''),
      'Animals freed ' + res.freed + ' / ' + res.total,
      'Score ' + res.score.toLocaleString() + (res.win && res.secondsLeft ? '   (' + res.secondsLeft + 's of tide left)' : '')
    ];
    if (res.win && res.junkLeft) lines.push(res.junkLeft + ' piece' + (res.junkLeft === 1 ? '' : 's') + ' of junk left behind');
    if (res.bonusGadget) lines.push('New gadget earned: ' + res.bonusGadget);
    if (res.newCards && res.newCards.length) lines.push('New field-guide cards: ' + res.newCards.length);
    if (!res.win) lines.push(g.difficulty === 'splash' ? '' : 'Tip: Splash difficulty has no time limit.');
    layer.add(this.add.text(px, py + 6, lines.join('\n'), { fontFamily: TT.UI.sans, fontStyle: '600', fontSize: TT.UI.fs(16), color: '#e6f8fa', align: 'center', lineSpacing: 8 }).setOrigin(0.5, 0.3));
    var by = py + ph / 2 - (M ? 50 : 42), bw = M ? 186 : 150, bh = M ? 64 : 48, gap = M ? 204 : 166;
    layer.add(TT.UI.button(this, px - gap, by, bw, bh, 'Retry', function () { g.restartLevel(); }, { size: 16 }));
    layer.add(TT.UI.button(this, px, by, bw, bh, 'Levels', function () { g.toMenu(); }, { size: 16 }));
    if (res.win) layer.add(TT.UI.button(this, px + gap, by, bw, bh, 'Next', function () { g.nextLevel(); }, { size: 16, fill: 0x16806a, stroke: 0xbff7d2 }));
    else layer.add(TT.UI.button(this, px + gap, by, bw, bh, 'Field guide', function () { self.scene.stop('UI'); g.scene.start('FieldGuide'); }, { size: 15 }));
    layer.setAlpha(0); this.tweens.add({ targets: layer, alpha: 1, duration: 250 });
  }
});

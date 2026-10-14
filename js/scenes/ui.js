// Tide Tossers v0.2 — UIScene: HUD over the game (queue, reef health, gadgets, tide, messages, results).
window.TT = window.TT || {};

TT.UI = {
  // Scale text up on phones: small labels the most, big titles a little.
  fs: function (n) { return (TT.MOBILE ? Math.round(n * (n <= 17 ? 1.4 : 1.15)) : n) + 'px'; },
  font: 'Georgia, "Times New Roman", serif',
  sans: '"Helvetica Neue", Arial, sans-serif',
  // A rounded button made of a graphics panel + text. Clicks never reach the game below.
  button: function (scene, x, y, w, h, label, onClick, opts) {
    opts = opts || {};
    var c = scene.add.container(x, y);
    var g = scene.add.graphics();
    var draw = function (hover) {
      g.clear();
      g.fillStyle(opts.fill || 0x0d3443, hover ? 0.98 : 0.86); g.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
      g.lineStyle(1.5, opts.stroke || 0x9fd8e0, hover ? 1 : 0.6); g.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
    };
    draw(false);
    var t = scene.add.text(0, 0, label, { fontFamily: opts.font || TT.UI.sans, fontSize: TT.UI.fs(opts.size || 17), color: opts.color || '#e9f7f8', align: 'center' }).setOrigin(0.5);
    c.add([g, t]);
    c.setSize(w, h).setInteractive({ useHandCursor: true });
    c.on('pointerover', function () { draw(true); });
    c.on('pointerout', function () { draw(false); });
    c.on('pointerdown', function (p, lx, ly, ev) { ev.stopPropagation(); TT.Sfx.unlock(); });
    c.on('pointerup', function (p, lx, ly, ev) { ev.stopPropagation(); onClick(); });
    c.label = t; c.redraw = draw;
    return c;
  }
};

TT.UIScene = new Phaser.Class({
  Extends: Phaser.Scene,
  initialize: function UIScene() { Phaser.Scene.call(this, { key: 'UI' }); },
  init: function (data) { this.game2 = data.game; },

  create: function () {
    var C = TT.CFG, g = this.game2, self = this, W = C.WIDTH;
    this.hudBg = this.add.graphics();
    this.hudBg.fillGradientStyle(0x04161f, 0x04161f, 0x04161f, 0x04161f, 0.65, 0.65, 0, 0);
    var M = TT.MOBILE; this.hudH = M ? 112 : 78;
    this.hudBg.fillRect(0, 0, W, this.hudH);

    // level title
    this.add.text(20, 12, g.level.place.toUpperCase() + '  ·  ' + g.level.id + '  ·  ' + C.DIFFICULTY[g.difficulty].name.toUpperCase(), { fontFamily: TT.UI.sans, fontSize: TT.UI.fs(12), stroke: '#04161f', strokeThickness: 3, color: '#9fd8e0', letterSpacing: 2 });
    this.add.text(20, M ? 30 : 28, g.level.name, { fontFamily: TT.UI.font, fontSize: TT.UI.fs(22), stroke: '#04161f', strokeThickness: 3, color: '#ffffff' });

    // rescuer queue
    this.queueIcons = [];
    this.queueY = M ? 86 : 62;

    // reef health
    this.healthG = this.add.graphics();
    this.healthText = this.add.text(W / 2, M ? 8 : 14, '', { fontFamily: TT.UI.sans, fontSize: TT.UI.fs(13), stroke: '#04161f', strokeThickness: 3, color: '#e9f7f8' }).setOrigin(0.5, 0);
    this.freedText = this.add.text(W / 2, M ? 62 : 52, '', { fontFamily: TT.UI.sans, fontSize: TT.UI.fs(13), stroke: '#04161f', strokeThickness: 3, color: '#bff7d2' }).setOrigin(0.5, 0);

    // right-side buttons
    var bh = M ? 60 : 36, by0 = M ? 38 : 30;
    TT.UI.button(this, W - (M ? 48 : 40), by0, M ? 76 : 52, bh, '↻', function () { g.restartLevel(); }, { size: 20 });
    TT.UI.button(this, W - (M ? 140 : 100), by0, M ? 92 : 60, bh, 'Menu', function () { g.toMenu(); }, { size: 14 });
    this.muteBtn = TT.UI.button(this, W - (M ? 250 : 168), by0, M ? 112 : 66, bh, TT.Sfx.isMuted() ? 'Muted' : 'Sound', function () {
      TT.Sfx.setMuted(!TT.Sfx.isMuted()); self.muteBtn.label.setText(TT.Sfx.isMuted() ? 'Muted' : 'Sound');
    }, { size: 13 });

    // tide indicator
    this.tideText = this.add.text(W - 20, M ? 120 : 92, '', { fontFamily: TT.UI.sans, fontSize: TT.UI.fs(14), color: '#cfeff5', backgroundColor: 'rgba(4,22,31,0.6)', padding: { x: 8, y: 4 } }).setOrigin(1, 0);

    // gadget button + panel
    this.gadgetBtn = TT.UI.button(this, M ? 112 : 92, C.HEIGHT - (M ? 44 : 40), M ? 196 : 150, M ? 64 : 40, 'Gadgets', function () { self.toggleGadgets(); }, { size: 15 });
    this.gadgetPanel = null;
    this.gadgetLabel = this.add.text(20, C.HEIGHT - (M ? 104 : 78), '', { fontFamily: TT.UI.sans, fontSize: TT.UI.fs(13), color: '#ffe7a8' });

    // message banner
    this.msgBox = this.add.container(W / 2, M ? 170 : 128).setAlpha(0);
    this.msgBg = this.add.graphics(); this.msgText = this.add.text(0, 0, '', { fontFamily: TT.UI.sans, fontSize: TT.UI.fs(16), color: '#ffffff', align: 'center', wordWrap: { width: M ? 820 : 640 } }).setOrigin(0.5);
    this.msgBox.add([this.msgBg, this.msgText]);
    g.events.on('message', this.showMessage, this);
    g.events.on('finished', this.showResult, this);
    g.events.on('info', this.showInfo, this);
    g.events.on('info-hide', this.hideInfo, this);
    this.infoBox = null;
    this.events.once('shutdown', function () { g.events.off('message', self.showMessage, self); g.events.off('finished', self.showResult, self); g.events.off('info', self.showInfo, self); g.events.off('info-hide', self.hideInfo, self); });
    this.helpBtn = TT.UI.button(this, M ? 290 : 230, C.HEIGHT - (M ? 44 : 40), M ? 130 : 90, M ? 64 : 40, 'Hint', function () { self.showMessage(g.level.hint, 7000); }, { size: 15 });
  },

  // A small "what is this?" card near the point that was pressed.
  showInfo: function (info, sx, sy) {
    var C = TT.CFG, self = this;
    this.hideInfo();
    var w = TT.MOBILE ? 460 : 360, pad = 16;
    var title = this.add.text(pad, pad, info.title, { fontFamily: TT.UI.font, fontSize: TT.UI.fs(20), color: '#ffffff', wordWrap: { width: w - pad * 2 } });
    var body = this.add.text(pad, pad + title.height + 6, info.text, { fontFamily: TT.UI.sans, fontSize: TT.UI.fs(15), color: '#d8f1f4', wordWrap: { width: w - pad * 2 }, lineSpacing: 3 });
    var h = pad * 2 + title.height + 6 + body.height;
    var x = Phaser.Math.Clamp(sx - w / 2, 12, C.WIDTH - w - 12);
    var y = sy - h - 40 < (TT.MOBILE ? 120 : 90) ? sy + 40 : sy - h - 40;
    y = Phaser.Math.Clamp(y, TT.MOBILE ? 120 : 90, C.HEIGHT - h - 12);
    var bg = this.add.graphics();
    bg.fillStyle(0x04161f, 0.94); bg.fillRoundedRect(0, 0, w, h, 14);
    bg.lineStyle(1.5, 0x9fd8e0, 0.7); bg.strokeRoundedRect(0, 0, w, h, 14);
    this.infoBox = this.add.container(x, y, [bg, title, body]).setAlpha(0);
    this.tweens.add({ targets: this.infoBox, alpha: 1, duration: 150 });
    this.infoTimer = this.time.delayedCall(5000, function () { self.hideInfo(); });
  },
  hideInfo: function () {
    if (this.infoTimer) { this.infoTimer.remove(); this.infoTimer = null; }
    if (this.infoBox) { this.infoBox.destroy(); this.infoBox = null; }
  },

  showMessage: function (text, ms) {
    var self = this;
    this.msgText.setText(text);
    var b = this.msgText.getBounds(), w = b.width + 40, h = b.height + 22;
    this.msgBg.clear(); this.msgBg.fillStyle(0x04161f, 0.85); this.msgBg.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
    this.msgBg.lineStyle(1, 0x9fd8e0, 0.5); this.msgBg.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);
    this.tweens.killTweensOf(this.msgBox);
    this.msgBox.setAlpha(0);
    this.tweens.add({ targets: this.msgBox, alpha: 1, duration: 250 });
    this.tweens.add({ targets: this.msgBox, alpha: 0, duration: 400, delay: ms || 4000 });
  },

  toggleGadgets: function () {
    var g = this.game2, C = TT.CFG, self = this;
    if (this.gadgetPanel) { this.gadgetPanel.destroy(); this.gadgetPanel = null; return; }
    var keys = Object.keys(C.GADGETS);
    var rowH = TT.MOBILE ? 68 : 54;
    var panel = this.add.container(20, C.HEIGHT - (TT.MOBILE ? 96 : 80) - keys.length * rowH);
    var bg = this.add.graphics(); bg.fillStyle(0x04161f, 0.92); bg.fillRoundedRect(0, 0, TT.MOBILE ? 420 : 330, keys.length * rowH + 12, 12);
    panel.add(bg);
    keys.forEach(function (k, i) {
      var def = C.GADGETS[k], n = TT.Save.gadgetCount(k), ok = g.gadgetAvailable(k);
      var b = TT.UI.button(self, TT.MOBILE ? 210 : 165, (TT.MOBILE ? 40 : 32) + i * rowH, TT.MOBILE ? 400 : 310, TT.MOBILE ? 60 : 46, def.name + '  ×' + n + '\n' + def.desc, function () {
        if (g.useGadget(k)) { self.toggleGadgets(); self.showMessage(def.name + ' active.', 2500); }
      }, { size: 13, fill: ok ? 0x0f4a5c : 0x22292c, color: ok ? '#e9f7f8' : '#7d8a8e' });
      panel.add(b);
    });
    this.gadgetPanel = panel;
  },

  update: function () {
    var g = this.game2, C = TT.CFG, W = C.WIDTH;
    if (!g || !g.sys || !g.sys.isActive()) return;
    // health bar
    var hg = this.healthG, bw = TT.MOBILE ? 340 : 300, x0 = W / 2 - bw / 2, y0 = TT.MOBILE ? 38 : 32, hh = TT.MOBILE ? 18 : 14;
    hg.clear();
    hg.fillStyle(0x0a1d24, 0.9); hg.fillRoundedRect(x0, y0, bw, hh, 7);
    var f = g.health / 100;
    var col = Phaser.Display.Color.Interpolate.ColorWithColor(Phaser.Display.Color.ValueToColor(0x8a7d5c), Phaser.Display.Color.ValueToColor(0x3fd6a6), 100, Math.round(f * 100));
    hg.fillStyle(Phaser.Display.Color.GetColor(col.r, col.g, col.b), 1); hg.fillRoundedRect(x0, y0, Math.max(10, bw * f), hh, 7);
    hg.lineStyle(2, 0xffffff, 0.8);
    [C.STAR2_HEALTH, C.STAR3_HEALTH].forEach(function (s) { var sx = x0 + bw * s / 100; hg.lineBetween(sx, y0 - 3, sx, y0 + hh + 3); });
    this.healthText.setText('Reef health ' + Math.round(g.health) + '%');
    this.freedText.setText('Animals freed ' + g.freed + ' / ' + g.totalAnimals);

    // queue icons (rebuild when it changes)
    var sig = g.queue.join(',') + '|' + (g.current ? 1 : 0);
    if (sig !== this.queueSig) {
      this.queueSig = sig;
      this.queueIcons.forEach(function (i) { i.destroy(); });
      this.queueIcons = [];
      var self = this;
      g.queue.forEach(function (id, i) {
        var key = TT.Art.speciesKey(self, id);
        var img = self.add.image(36 + i * 56, self.queueY, key).setScale(TT.Art.scaleFor(self, key, i === 0 ? 50 : 38)).setAlpha(i === 0 ? 1 : 0.7);
        img.setInteractive({ useHandCursor: true });
        img.on('pointerdown', function (p, lx, ly, ev) {
          ev.stopPropagation();
          var d = TT.CFG.RESCUERS[id];
          self.showInfo({ title: d.name + (d.nick ? ' ("' + d.nick + '")' : ''), text: TT.INFO.rescuers[id] }, img.x + 120, img.y + 40);
        });
        self.queueIcons.push(img);
      });
      if (g.queue.length) {
        var nm = TT.CFG.RESCUERS[g.queue[0]];
        var label = this.add.text(36 + g.queue.length * 56, this.queueY - (TT.MOBILE ? 12 : 8), 'Next: ' + nm.name + (nm.nick ? ' ("' + nm.nick + '")' : ''), { fontFamily: TT.UI.sans, fontSize: TT.UI.fs(12), stroke: '#04161f', strokeThickness: 3, color: '#cfeff5' });
        this.queueIcons.push(label);
      }
    }

    // tide
    if (g.water.tide) {
      var d = g.water.nextTideDir();
      this.tideText.setText('Tide ' + (d === 'up' ? '▲ rising' : '▼ falling') + ' after this shot').setVisible(true);
    } else this.tideText.setVisible(false);

    // gadgets: only before the first shot
    var any = Object.keys(C.GADGETS).some(function (k) { return g.gadgetAvailable(k); });
    this.gadgetBtn.setVisible(any && g.state === 'aim' && !g.result);
    if (!this.gadgetBtn.visible && this.gadgetPanel) { this.gadgetPanel.destroy(); this.gadgetPanel = null; }
    this.gadgetLabel.setText(g.gadgetUsed ? 'Gadget: ' + g.gadgetName + (g.netCutterArmed ? ' (tap a net)' : '') : '');
    this.helpBtn.setVisible(!g.result);
  },

  showResult: function (res) {
    var C = TT.CFG, W = C.WIDTH, H = C.HEIGHT, g = this.game2, self = this;
    g.uiBlocking = true;
    this.tweens.killTweensOf(this.msgBox); this.msgBox.setAlpha(0);
    if (this.gadgetPanel) { this.gadgetPanel.destroy(); this.gadgetPanel = null; }
    var shade = this.add.rectangle(0, 0, W, H, 0x020b10, 0.55).setOrigin(0, 0).setInteractive();
    shade.on('pointerdown', function (p, x, y, ev) { ev.stopPropagation(); });
    var pw = TT.MOBILE ? 640 : 520, ph = TT.MOBILE ? 460 : 380, px = W / 2, py = H / 2;
    var card = this.add.graphics();
    card.fillStyle(0x062430, 0.96); card.fillRoundedRect(px - pw / 2, py - ph / 2, pw, ph, 18);
    card.lineStyle(1.5, 0x9fd8e0, 0.6); card.strokeRoundedRect(px - pw / 2, py - ph / 2, pw, ph, 18);
    var title = res.win ? (res.stars === 3 ? 'Reef restored' : 'Rescue complete') : 'Animals still trapped';
    this.add.text(px, py - ph / 2 + 36, title, { fontFamily: TT.UI.font, fontSize: TT.UI.fs(32), color: '#ffffff' }).setOrigin(0.5);
    // stars as shells
    for (var i = 0; i < 3; i++) {
      var on = i < res.stars, sx = px + (i - 1) * 70, sy = py - ph / 2 + 100;
      var s = this.add.star(sx, sy, 5, 12, 26, on ? 0xf4d27a : 0x23404a).setStrokeStyle(2, on ? 0xfff2c8 : 0x3f6470);
      s.setScale(0); this.tweens.add({ targets: s, scale: 1, delay: 250 + i * 220, duration: 380, ease: 'Back.easeOut' });
    }
    var lines = [
      'Reef health: ' + res.health + '%',
      'Animals freed: ' + res.freed + ' / ' + res.total,
      'Score: ' + res.score.toLocaleString() + (res.unused && res.win ? '  (' + res.unused + ' unused rescuer bonus)' : '')
    ];
    if (res.bonusGadget) lines.push('New gadget earned: ' + res.bonusGadget);
    if (res.newCards && res.newCards.length) lines.push('New field-guide cards: ' + res.newCards.length);
    if (!res.win) lines.push('Tip: hold and drag after launch to steer.');
    this.add.text(px, py - 10, lines.join('\n'), { fontFamily: TT.UI.sans, fontSize: TT.UI.fs(17), color: '#d8f1f4', align: 'center', lineSpacing: 8 }).setOrigin(0.5, 0.2);
    var by = py + ph / 2 - 44;
    TT.UI.button(this, px - (TT.MOBILE ? 200 : 160), by, TT.MOBILE ? 180 : 140, TT.MOBILE ? 62 : 46, 'Retry', function () { g.restartLevel(); }, { size: 16 });
    TT.UI.button(this, px, by, TT.MOBILE ? 180 : 140, TT.MOBILE ? 62 : 46, 'Levels', function () { g.toMenu(); }, { size: 16 });
    if (res.win) TT.UI.button(this, px + (TT.MOBILE ? 200 : 160), by, TT.MOBILE ? 180 : 140, TT.MOBILE ? 62 : 46, 'Next', function () { g.nextLevel(); }, { size: 16, fill: 0x14705e });
    else TT.UI.button(this, px + (TT.MOBILE ? 200 : 160), by, TT.MOBILE ? 180 : 140, TT.MOBILE ? 62 : 46, 'Field guide', function () { self.scene.stop('UI'); g.scene.start('FieldGuide'); }, { size: 15 });
  }
});

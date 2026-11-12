// Tide Tossers v0.5 — Boot, Title, LevelSelect and FieldGuide scenes.
window.TT = window.TT || {};

// A shared animated underwater backdrop for menus: the layered reef drifting slowly past, with swimmers.
TT.menuBackdrop = function (scene, shadeAlpha) {
  var C = TT.CFG, W = C.WIDTH, H = C.HEIGHT;
  TT.Scenery.backdrop(scene, 'keys', 96);
  var fishKey = TT.Art.speciesKey(scene, 'smallfish');
  var school = [];
  for (var i = 0; i < 18; i++) {
    var f = scene.add.sprite(0, 0, fishKey).setScale(TT.Art.scaleFor(scene, fishKey, 26)).setDepth(3);
    TT.Art.playSwim(f, 'smallfish');
    school.push({ s: f, ox: Math.random() * 260, oy: 360 + Math.random() * 130, ph: Math.random() * 6 });
  }
  var swimmers = [['loggerhead', 170, 250, 22, true], ['tang', 80, 470, 46, false]].map(function (d) {
    var key = TT.Art.speciesKey(scene, d[0]);
    var sp = scene.add.sprite(0, d[2], key).setScale(TT.Art.scaleFor(scene, key, d[1])).setDepth(3).setFlipX(d[4]);
    TT.Art.playSwim(sp, d[0]);
    return { s: sp, y: d[2], speed: d[3], left: d[4] };
  });
  var shade = scene.add.rectangle(0, 0, W, H, 0x021824, shadeAlpha === undefined ? 0.25 : shadeAlpha).setOrigin(0, 0).setDepth(20);
  var onUpdate = function (time) {
    var t = time / 1000;
    var sx = ((t * 70) % (W + 600)) - 300;
    school.forEach(function (f) { f.s.setPosition(sx + f.ox + Math.sin(t * 1.5 + f.ph) * 8, f.oy + Math.sin(t + f.ph) * 10); });
    swimmers.forEach(function (sw, i) {
      var span = W + 500, p = (t * sw.speed + i * 400) % span;
      sw.s.setPosition(sw.left ? W + 250 - p : p - 250, sw.y + Math.sin(t * 0.6 + i) * 18);
    });
  };
  scene.events.on('update', onUpdate);
  scene.events.once('shutdown', function () { scene.events.off('update', onUpdate); });
  return shade;
};

TT.BootScene = new Phaser.Class({
  Extends: Phaser.Scene,
  initialize: function BootScene() { Phaser.Scene.call(this, { key: 'Boot' }); },
  preload: function () {
    var A = window.TT_ASSETS || { species: [], bg: [] }, self = this;
    (A.species || []).forEach(function (id) { self.load.image('png_' + id, 'assets/species/' + id + '.png'); });
    (A.bg || []).forEach(function (id) { self.load.image('pngbg_' + id, 'assets/bg/' + id + '.png'); });
    var bar = this.add.graphics();
    this.load.on('progress', function (v) { bar.clear(); bar.fillStyle(0x9fd8e0, 1); bar.fillRect(440, 356, 400 * v, 8); });
  },
  create: function () {
    TT.Art.generateAll(this);
    this.scene.start('Title');
  }
});

TT.TitleScene = new Phaser.Class({
  Extends: Phaser.Scene,
  initialize: function TitleScene() { Phaser.Scene.call(this, { key: 'Title' }); },
  create: function () {
    var C = TT.CFG, W = C.WIDTH, self = this;
    TT.menuBackdrop(this, 0.12);
    var D = 30;
    var title = TT.UI.title(this, W / 2, 196, 'TIDE TOSSERS', 96, '#ffffff').setDepth(D);
    title.setStroke('#06405c', 16).setShadow(0, 8, 'rgba(2,24,36,0.55)', 0, true, false);
    title.setFontSize(TT.MOBILE ? '104px' : '100px');
    this.tweens.add({ targets: title, y: 204, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    TT.UI.title(this, W / 2, 286, 'Free the trapped. Restore the reef.', 24, '#d8fbff').setDepth(D);
    this.add.text(W / 2, 326, 'PROTOTYPE ' + TT.VERSION, { fontFamily: TT.UI.sans, fontStyle: '700', fontSize: TT.UI.fs(12), color: '#bdf3ff', stroke: '#06283a', strokeThickness: 3, letterSpacing: 3 }).setOrigin(0.5).setDepth(D);
    TT.UI.button(this, W / 2, 420, 280, 72, 'Play', function () { TT.Sfx.unlock(); self.scene.start('LevelSelect'); }, { size: 26, fill: 0xff8a3c, stroke: 0xffe2c2, radius: 36 }).setDepth(D);
    TT.UI.button(this, W / 2, 506, 240, 52, 'Field guide', function () { self.scene.start('FieldGuide'); }, { size: 17 }).setDepth(D);
    if (TT.MOBILE && !TT.INSTALLED && this.scale.fullscreen.available) {
      TT.UI.button(this, W / 2, 576, 240, 52, 'Full screen', function () {
        try { self.scale.startFullscreen(); if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(function () {}); } catch (e) { /* not allowed here */ }
      }, { size: 15 }).setDepth(D);
    }
    this.add.text(W / 2, 680, TT.MOBILE ? 'Left thumb swims · right thumb uses your ability' : 'Hold the mouse or use WASD to swim · Space for your ability', { fontFamily: TT.UI.sans, fontStyle: '700', fontSize: TT.UI.fs(14), color: '#ffffff', stroke: '#06283a', strokeThickness: 4 }).setOrigin(0.5).setDepth(D);
    this.input.keyboard.once('keydown-ENTER', function () { self.scene.start('LevelSelect'); });
  }
});

TT.LevelSelectScene = new Phaser.Class({
  Extends: Phaser.Scene,
  initialize: function LevelSelectScene() { Phaser.Scene.call(this, { key: 'LevelSelect' }); },
  create: function () {
    var C = TT.CFG, W = C.WIDTH, self = this;
    TT.menuBackdrop(this, 0.5);
    var D = 30;
    TT.UI.title(this, W / 2, 46, 'Choose a rescue', 36).setDepth(D);
    // difficulty pills
    var diff = TT.Save.difficulty();
    this.add.text(W / 2, 92, 'Difficulty: ' + C.DIFFICULTY[diff].blurb, { fontFamily: TT.UI.sans, fontStyle: '700', fontSize: TT.UI.fs(13), color: '#bdf3ff' }).setOrigin(0.5).setDepth(D);
    C.DIFFICULTY_ORDER.forEach(function (k, i) {
      var on = k === diff;
      TT.UI.button(self, W / 2 + (i - 1.5) * 140, 130, 128, 42, C.DIFFICULTY[k].name, function () { TT.Save.setDifficulty(k); self.scene.restart(); },
        { size: 15, fill: on ? 0x16806a : 0x0a3d55, stroke: on ? 0xbff7d2 : 0x7fb7c6, radius: 21 }).setDepth(D);
    });
    var ox = (W - 1280) / 2;
    var rows = [{ title: 'Florida Keys', world: 1 }, { title: 'Galápagos Islands', world: 2 }];
    rows.forEach(function (row, ri) {
      var y = 214 + ri * 200;
      self.add.text(ox + 70, y - 38, row.title, { fontFamily: TT.UI.display, fontStyle: '800', fontSize: TT.UI.fs(22), color: '#ffffff', stroke: '#06283a', strokeThickness: 5 }).setDepth(D);
      var lv = TT.LEVELS.filter(function (l) { return l.world === row.world; });
      lv.forEach(function (l, i) {
        var x = ox + 164 + i * 238, res = TT.Save.levelResult(l.id, diff);
        var tile = TT.UI.button(self, x, y + 60, 222, 124, '', function () { TT.Sfx.unlock(); self.scene.start('Game', { levelId: l.id }); }, { fill: res ? 0x0f5a78 : 0x0a3d55, radius: 18 }).setDepth(D);
        var t1 = self.add.text(-98, -52, l.id, { fontFamily: TT.UI.sans, fontStyle: '700', fontSize: '13px', color: '#bdf3ff' });
        var t2 = self.add.text(0, -16, l.name, { fontFamily: TT.UI.display, fontStyle: '800', fontSize: '18px', color: '#ffffff', align: 'center', wordWrap: { width: 200 } }).setOrigin(0.5);
        tile.add([t1, t2]);
        for (var st = 0; st < 3; st++) {
          var on2 = res && st < res.stars;
          tile.add(self.add.star((st - 1) * 30, 20, 5, 6, 13, on2 ? 0xffd75e : 0x123f52).setStrokeStyle(2, on2 ? 0xfff2c8 : 0x3f6f80));
        }
        // the team as small portraits
        l.team.forEach(function (id, ti) {
          var key = TT.Art.speciesKey(self, id);
          tile.add(self.add.image((ti - (l.team.length - 1) / 2) * 36, 47, key).setScale(TT.Art.scaleFor(self, key, 30)));
        });
        var tag = l.dark ? 'DARK' : l.tide ? 'TIDES' : (l.currents && l.currents.length) ? 'CURRENTS' : '';
        if (tag) tile.add(self.add.text(98, -52, tag, { fontFamily: TT.UI.sans, fontStyle: '700', fontSize: '12px', color: '#ffe7a8' }).setOrigin(1, 0));
      });
    });
    // options
    var oy = 606, hasVib = TT.Haptics.available();
    TT.UI.button(this, W / 2 - (hasVib ? 120 : 0), oy, 220, 46, 'Sound: ' + (TT.Sfx.isMuted() ? 'Off' : 'On'), function () { TT.Sfx.unlock(); TT.Sfx.setMuted(!TT.Sfx.isMuted()); self.scene.restart(); }, { size: 14 }).setDepth(D);
    if (hasVib) {
      TT.UI.button(this, W / 2 + 120, oy, 220, 46, 'Vibration: ' + (TT.Save.haptics() ? 'On' : 'Off'), function () {
        TT.Save.setHaptics(!TT.Save.haptics()); if (TT.Save.haptics()) TT.Haptics.buzz(30); self.scene.restart();
      }, { size: 14 }).setDepth(D);
    }
    var gs = Object.keys(C.GADGETS).map(function (k) { return C.GADGETS[k].name + ' ×' + TT.Save.gadgetCount(k); }).join('    ');
    this.add.text(W / 2, 668, 'Gadgets: ' + gs, { fontFamily: TT.UI.sans, fontStyle: '700', fontSize: TT.UI.fs(13), color: '#ffe7a8', stroke: '#06283a', strokeThickness: 3 }).setOrigin(0.5).setDepth(D);
    TT.UI.button(this, 90, 46, 130, 44, '‹ Title', function () { self.scene.start('Title'); }, { size: 15 }).setDepth(D);
    TT.UI.button(this, W - 110, 46, 170, 44, 'Field guide', function () { self.scene.start('FieldGuide'); }, { size: 15 }).setDepth(D);
    window.__TT_MENU = this;
  }
});

function game_isCanvas(scene) { return scene.game.renderer.type === Phaser.CANVAS; }

TT.FieldGuideScene = new Phaser.Class({
  Extends: Phaser.Scene,
  initialize: function FieldGuideScene() { Phaser.Scene.call(this, { key: 'FieldGuide' }); },
  create: function () {
    var C = TT.CFG, W = C.WIDTH, self = this;
    TT.menuBackdrop(this, 0.62);
    var D = 30;
    var unlocked = TT.GUIDE.filter(function (c) { return TT.Save.cardUnlocked(c.id); }).length;
    TT.UI.title(this, W / 2, 46, 'Field guide', 36).setDepth(D);
    this.add.text(W / 2, 86, unlocked + ' of ' + TT.GUIDE.length + ' cards · clear levels to unlock species and places', { fontFamily: TT.UI.sans, fontStyle: '700', fontSize: TT.UI.fs(13), color: '#bdf3ff' }).setOrigin(0.5).setDepth(D);
    TT.UI.button(this, 90, 46, 130, 44, '‹ Back', function () { self.scene.start('LevelSelect'); }, { size: 15 }).setDepth(D);
    TT.GUIDE.forEach(function (card, i) {
      var col = i % 5, row = Math.floor(i / 5), x = (W - 1280) / 2 + 170 + col * 235, y = 190 + row * 170;
      var on = TT.Save.cardUnlocked(card.id);
      var tile = TT.UI.button(self, x, y, 215, 150, '', function () { if (on) self.showCard(card); }, { fill: on ? 0x0f5a78 : 0x16262e, stroke: on ? 0xbdf3ff : 0x3f5a66 }).setDepth(D);
      var isPlace = card.id.indexOf('place_') === 0;
      if (!isPlace) {
        var key = TT.Art.speciesKey(self, card.id), sz = TT.Art.SPECIES_SIZE[card.id];
        var img = self.add.image(0, -18, key).setScale(TT.Art.scaleFor(self, key, Math.min(150, sz[0] * 1.6)));
        if (!on) img.setTint(0x000000).setAlpha(game_isCanvas(self) ? 0.18 : 0.5);
        tile.add(img);
      } else {
        tile.add(self.add.text(0, -20, on ? '⌖' : '?', { fontFamily: TT.UI.sans, fontSize: TT.UI.fs(40), color: on ? '#9fd8e0' : '#3d5258' }).setOrigin(0.5));
      }
      tile.add(self.add.text(0, 48, on ? card.name : '???', { fontFamily: TT.UI.font, fontSize: TT.UI.fs(16), color: on ? '#ffffff' : '#56707a', align: 'center', wordWrap: { width: 200 } }).setOrigin(0.5));
    });
  },
  showCard: function (card) {
    var C = TT.CFG, W = C.WIDTH, H = C.HEIGHT, self = this;
    var layer = this.add.container(0, 0).setDepth(40);
    var shade = this.add.rectangle(0, 0, W, H, 0x020b10, 0.7).setOrigin(0, 0).setInteractive();
    shade.on('pointerup', function () { layer.destroy(); });
    var g = this.add.graphics(); TT.UI.panel(g, W / 2 - 380, 120, 760, 470, 22, 0x0a3d55, 0.98);
    layer.add([shade, g]);
    if (card.id.indexOf('place_') !== 0) {
      var key = TT.Art.speciesKey(this, card.id);
      layer.add(this.add.image(W / 2 - 200, 300, key).setScale(TT.Art.scaleFor(this, key, 260)));
    }
    var tx = card.id.indexOf('place_') === 0 ? W / 2 - 330 : W / 2 - 20;
    layer.add(this.add.text(tx, 160, card.name, { fontFamily: TT.UI.display, fontStyle: '800', fontSize: TT.UI.fs(30), color: '#ffffff', wordWrap: { width: 380 } }));
    layer.add(this.add.text(tx, 204, card.sci, { fontFamily: TT.UI.font, fontSize: TT.UI.fs(17), color: '#9fd8e0', fontStyle: 'italic' }));
    var body = 'Where: ' + card.where + '\n\nSize: ' + card.size + '\n\nDid you know? ' + card.fact + '\n\nThreats: ' + card.threat;
    layer.add(this.add.text(tx, 246, body, { fontFamily: TT.UI.sans, fontSize: TT.UI.fs(16), color: '#d8f1f4', wordWrap: { width: card.id.indexOf('place_') === 0 ? 660 : 380 }, lineSpacing: 4 }));
    layer.add(this.add.text(W / 2, 560, 'Tap anywhere to close', { fontFamily: TT.UI.sans, fontSize: TT.UI.fs(12), color: '#9fd8e0' }).setOrigin(0.5));
  }
});

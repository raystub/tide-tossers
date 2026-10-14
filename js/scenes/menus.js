// Tide Tossers v0.2 — Boot, Title, LevelSelect and FieldGuide scenes.
window.TT = window.TT || {};

// A shared animated underwater backdrop for menus.
TT.menuBackdrop = function (scene) {
  var C = TT.CFG, W = C.WIDTH, H = C.HEIGHT;
  var bg = TT.Art.backgroundTextures(scene, 'keys_reef', W);
  scene.add.image(0, 0, bg.under).setOrigin(0, 0);
  scene.add.image(0, C.FLOOR_Y - 10, bg.floor).setOrigin(0, 0);
  var caus = scene.add.tileSprite(0, 0, W, H, 'caustics').setOrigin(0, 0).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.1);
  var rays = scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
  var fishKey = TT.Art.speciesKey(scene, 'smallfish');
  var school = [];
  for (var i = 0; i < 18; i++) {
    var f = scene.add.image(-200 - Math.random() * 300, 380 + Math.random() * 120, fishKey).setScale(TT.Art.scaleFor(scene, fishKey, 24)).setAlpha(0.8);
    school.push({ s: f, ox: f.x, oy: f.y, ph: Math.random() * 6 });
  }
  var turtleKey = TT.Art.speciesKey(scene, 'loggerhead');
  var turtle = scene.add.image(W + 160, 250, turtleKey).setScale(TT.Art.scaleFor(scene, turtleKey, 150)).setFlipX(true).setAlpha(0.9);
  var shade = scene.add.rectangle(0, 0, W, H, 0x021018, 0.35).setOrigin(0, 0);
  var onUpdate = function (time) {
    var t = time / 1000;
    caus.tilePositionX = t * 8; caus.tilePositionY = t * 3;
    rays.clear();
    for (var r = 0; r < 6; r++) {
      var x = r * 230 + 60 + Math.sin(t * 0.3 + r) * 40, a = 0.05 + 0.03 * Math.sin(t * 0.8 + r * 1.7);
      rays.fillStyle(0xdff8ff, a); rays.beginPath(); rays.moveTo(x, 0); rays.lineTo(x + 60, 0); rays.lineTo(x + 260, H); rays.lineTo(x + 140, H); rays.closePath(); rays.fillPath();
    }
    var sx = ((t * 70) % (W + 600)) - 300;
    school.forEach(function (f, i) { f.s.setPosition(sx + (f.ox + 300) * 0.5 + Math.sin(t * 1.5 + f.ph) * 8, f.oy + Math.sin(t + f.ph) * 10); f.s.rotation = Math.sin(t * 6 + f.ph) * 0.06; });
    turtle.x = W + 160 - ((t * 25) % (W + 400)); turtle.y = 250 + Math.sin(t * 0.5) * 18; turtle.rotation = Math.sin(t * 0.8) * 0.05;
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
    TT.menuBackdrop(this);
    this.add.text(W / 2, 190, 'Tide Tossers', { fontFamily: TT.UI.font, fontSize: TT.UI.fs(84), color: '#ffffff', stroke: '#04202c', strokeThickness: 6 }).setOrigin(0.5);
    this.add.text(W / 2, 262, 'Free the trapped. Restore the reef.', { fontFamily: TT.UI.font, fontSize: TT.UI.fs(24), color: '#cfeff5', fontStyle: 'italic' }).setOrigin(0.5);
    this.add.text(W / 2, 300, 'PROTOTYPE v0.3', { fontFamily: TT.UI.sans, fontSize: TT.UI.fs(12), color: '#9fd8e0', letterSpacing: 3 }).setOrigin(0.5);
    TT.UI.button(this, W / 2, 400, 240, 58, 'Play', function () { self.scene.start('LevelSelect'); }, { size: 22, fill: 0x14705e });
    TT.UI.button(this, W / 2, 472, 240, 48, 'Field guide', function () { self.scene.start('FieldGuide'); }, { size: 17 });
    if (TT.MOBILE && !TT.INSTALLED && this.scale.fullscreen.available) {
      TT.UI.button(this, W / 2, 548, 240, 52, 'Full screen', function () {
        try { self.scale.startFullscreen(); if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(function () {}); } catch (e) { /* not allowed here */ }
      }, { size: 15 });
      this.scale.on('fullscreenfailed', function () {});
    }
    this.add.text(W / 2, 680, 'Drag back to launch · hold and drag to steer · tap for the ability', { fontFamily: TT.UI.sans, fontSize: TT.UI.fs(14), color: '#ffffff', stroke: '#04202c', strokeThickness: 4 }).setOrigin(0.5);
    this.input.keyboard.once('keydown-ENTER', function () { self.scene.start('LevelSelect'); });
  }
});

TT.LevelSelectScene = new Phaser.Class({
  Extends: Phaser.Scene,
  initialize: function LevelSelectScene() { Phaser.Scene.call(this, { key: 'LevelSelect' }); },
  create: function () {
    var C = TT.CFG, W = C.WIDTH, self = this;
    TT.menuBackdrop(this).setFillStyle(0x021018, 0.55);
    this.add.text(W / 2, 46, 'Choose a rescue', { fontFamily: TT.UI.font, fontSize: TT.UI.fs(38), color: '#ffffff' }).setOrigin(0.5);
    // difficulty pills
    var diff = TT.Save.difficulty();
    this.add.text(W / 2, 92, 'Difficulty', { fontFamily: TT.UI.sans, fontSize: TT.UI.fs(13), color: '#9fd8e0' }).setOrigin(0.5);
    C.DIFFICULTY_ORDER.forEach(function (k, i) {
      var on = k === diff;
      TT.UI.button(self, W / 2 + (i - 1.5) * 130, 126, 118, 38, C.DIFFICULTY[k].name, function () { TT.Save.setDifficulty(k); self.scene.restart(); },
        { size: 15, fill: on ? 0x14705e : 0x0d3443, stroke: on ? 0xbff7d2 : 0x9fd8e0 });
    });
    var ox = (W - 1280) / 2;
    var rows = [{ title: 'Florida Keys', world: 1 }, { title: 'Galápagos Islands', world: 2 }];
    rows.forEach(function (row, ri) {
      var y = 210 + ri * 210;
      self.add.text(ox + 80, y - 36, row.title, { fontFamily: TT.UI.font, fontSize: TT.UI.fs(24), color: '#e9f7f8' });
      var lv = TT.LEVELS.filter(function (l) { return l.world === row.world; });
      lv.forEach(function (l, i) {
        var x = ox + 160 + i * 200, res = TT.Save.levelResult(l.id, diff);
        var tile = TT.UI.button(self, x, y + 60, 180, 120, '', function () { self.scene.start('Game', { levelId: l.id }); }, { fill: 0x0b3442 });
        var t1 = self.add.text(0, -40, l.id, { fontFamily: TT.UI.sans, fontSize: TT.UI.fs(13), color: '#9fd8e0' }).setOrigin(0.5);
        var t2 = self.add.text(0, -14, l.name, { fontFamily: TT.UI.font, fontSize: TT.UI.fs(18), color: '#ffffff', align: 'center', wordWrap: { width: 160 } }).setOrigin(0.5);
        var stars = '';
        for (var s = 0; s < 3; s++) stars += (res && s < res.stars) ? '★' : '☆';
        var t3 = self.add.text(0, 20, stars, { fontFamily: TT.UI.sans, fontSize: TT.UI.fs(22), color: res ? '#f4d27a' : '#4f7480' }).setOrigin(0.5);
        var t4 = self.add.text(0, 44, res ? 'Best reef health ' + res.health + '%' : (l.dark ? 'Dark cave' : l.tide ? 'Tides' : ''), { fontFamily: TT.UI.sans, fontSize: TT.UI.fs(12), color: '#cfeff5' }).setOrigin(0.5);
        tile.add([t1, t2, t3, t4]);
      });
    });
    // control options
    var mode = TT.Save.steerMode();
    TT.UI.button(this, W / 2 - (TT.Haptics.available() ? 130 : 0), 590, 240, 46, 'Steering: ' + (mode === 'swipe' ? 'Swipe stick' : 'Point to swim'), function () {
      TT.Save.setSteerMode(mode === 'swipe' ? 'point' : 'swipe'); self.scene.restart();
    }, { size: 14 });
    if (TT.Haptics.available()) {
      TT.UI.button(this, W / 2 + 130, 590, 200, 46, 'Vibration: ' + (TT.Save.haptics() ? 'On' : 'Off'), function () {
        TT.Save.setHaptics(!TT.Save.haptics()); if (TT.Save.haptics()) TT.Haptics.buzz(30); self.scene.restart();
      }, { size: 14 });
    }
    var gs = Object.keys(C.GADGETS).map(function (k) { return C.GADGETS[k].name + ' ×' + TT.Save.gadgetCount(k); }).join('    ');
    this.add.text(W / 2, 650, 'Gadgets: ' + gs, { fontFamily: TT.UI.sans, fontSize: TT.UI.fs(14), color: '#ffe7a8' }).setOrigin(0.5);
    TT.UI.button(this, 90, 46, 120, 40, '‹ Title', function () { self.scene.start('Title'); }, { size: 15 });
    TT.UI.button(this, W - 110, 46, 160, 40, 'Field guide', function () { self.scene.start('FieldGuide'); }, { size: 15 });
    window.__TT_MENU = this;
  }
});

function game_isCanvas(scene) { return scene.game.renderer.type === Phaser.CANVAS; }

TT.FieldGuideScene = new Phaser.Class({
  Extends: Phaser.Scene,
  initialize: function FieldGuideScene() { Phaser.Scene.call(this, { key: 'FieldGuide' }); },
  create: function () {
    var C = TT.CFG, W = C.WIDTH, self = this;
    TT.menuBackdrop(this).setFillStyle(0x021018, 0.7);
    var unlocked = TT.GUIDE.filter(function (c) { return TT.Save.cardUnlocked(c.id); }).length;
    this.add.text(W / 2, 46, 'Field guide', { fontFamily: TT.UI.font, fontSize: TT.UI.fs(38), color: '#ffffff' }).setOrigin(0.5);
    this.add.text(W / 2, 86, unlocked + ' of ' + TT.GUIDE.length + ' cards · clear levels to unlock species and places', { fontFamily: TT.UI.sans, fontSize: TT.UI.fs(14), color: '#9fd8e0' }).setOrigin(0.5);
    TT.UI.button(this, 90, 46, 120, 40, '‹ Back', function () { self.scene.start('LevelSelect'); }, { size: 15 });
    TT.GUIDE.forEach(function (card, i) {
      var col = i % 5, row = Math.floor(i / 5), x = (W - 1280) / 2 + 170 + col * 235, y = 190 + row * 170;
      var on = TT.Save.cardUnlocked(card.id);
      var tile = TT.UI.button(self, x, y, 215, 150, '', function () { if (on) self.showCard(card); }, { fill: on ? 0x0b3442 : 0x111c20 });
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
    var layer = this.add.container(0, 0);
    var shade = this.add.rectangle(0, 0, W, H, 0x020b10, 0.7).setOrigin(0, 0).setInteractive();
    shade.on('pointerup', function () { layer.destroy(); });
    var g = this.add.graphics(); g.fillStyle(0x062430, 0.98); g.fillRoundedRect(W / 2 - 380, 120, 760, 470, 18);
    g.lineStyle(1.5, 0x9fd8e0, 0.6); g.strokeRoundedRect(W / 2 - 380, 120, 760, 470, 18);
    layer.add([shade, g]);
    if (card.id.indexOf('place_') !== 0) {
      var key = TT.Art.speciesKey(this, card.id);
      layer.add(this.add.image(W / 2 - 200, 300, key).setScale(TT.Art.scaleFor(this, key, 260)));
    }
    var tx = card.id.indexOf('place_') === 0 ? W / 2 - 330 : W / 2 - 20;
    layer.add(this.add.text(tx, 160, card.name, { fontFamily: TT.UI.font, fontSize: TT.UI.fs(32), color: '#ffffff', wordWrap: { width: 380 } }));
    layer.add(this.add.text(tx, 204, card.sci, { fontFamily: TT.UI.font, fontSize: TT.UI.fs(17), color: '#9fd8e0', fontStyle: 'italic' }));
    var body = 'Where: ' + card.where + '\n\nSize: ' + card.size + '\n\nDid you know? ' + card.fact + '\n\nThreats: ' + card.threat;
    layer.add(this.add.text(tx, 246, body, { fontFamily: TT.UI.sans, fontSize: TT.UI.fs(16), color: '#d8f1f4', wordWrap: { width: card.id.indexOf('place_') === 0 ? 660 : 380 }, lineSpacing: 4 }));
    layer.add(this.add.text(W / 2, 560, 'Tap anywhere to close', { fontFamily: TT.UI.sans, fontSize: TT.UI.fs(12), color: '#9fd8e0' }).setOrigin(0.5));
  }
});

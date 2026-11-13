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
    this.add.text(W / 2, 326, 'PREVIEW ' + TT.VERSION, { fontFamily: TT.UI.sans, fontStyle: '700', fontSize: TT.UI.fs(12), color: '#bdf3ff', stroke: '#06283a', strokeThickness: 3, letterSpacing: 3 }).setOrigin(0.5).setDepth(D);
    TT.UI.button(this, W / 2, 404, 300, 72, 'Campaign', function () { TT.Sfx.unlock(); self.scene.start('LevelSelect'); }, { size: 26, fill: 0xff8a3c, stroke: 0xffe2c2, radius: 36 }).setDepth(D);
    var best = TT.Save.arcadeBest();
    TT.UI.button(this, W / 2 - 160, 494, 290, 62, 'Puzzle\n' + TT.PUZZLES.length + ' planning challenges', function () { TT.Sfx.unlock(); self.scene.start('PuzzleSelect'); }, { size: 15, fill: 0x16806a, stroke: 0xbff7d2, radius: 24 }).setDepth(D);
    TT.UI.button(this, W / 2 + 160, 494, 290, 62, 'Arcade\n' + (best.wave ? 'Best: ' + best.wave + ' waves' : 'Endless waves'), function () { TT.Sfx.unlock(); self.scene.start('Game', { mode: 'arcade' }); }, { size: 15, fill: 0x7a5a14, stroke: 0xffe7a8, radius: 24 }).setDepth(D);
    TT.UI.button(this, W / 2 - 130, 574, 220, 48, 'Field guide', function () { self.scene.start('FieldGuide'); }, { size: 15 }).setDepth(D);
    TT.UI.button(this, W / 2 + 130, 574, 220, 48, 'Sound: ' + (TT.Sfx.isMuted() ? 'Off' : 'On'), function () { TT.Sfx.unlock(); TT.Sfx.setMuted(!TT.Sfx.isMuted()); self.scene.restart(); }, { size: 15 }).setDepth(D);
    if (TT.MOBILE && !TT.INSTALLED && this.scale.fullscreen.available) {
      TT.UI.button(this, W - 150, 46, 220, 48, 'Full screen', function () {
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
    // world tabs
    var cur = TT.Save.world(), tabW = 236, ox = (W - 1280) / 2;
    TT.WORLDS.forEach(function (wd, i) {
      var on = wd.n === cur, built = TT.levelsInWorld(wd.n).length;
      var b = TT.UI.button(self, W / 2 + (i - 2) * (tabW + 8), 192, tabW, 50, wd.n + '  ' + wd.name, function () { TT.Save.setWorld(wd.n); self.scene.restart(); },
        { size: 14, fill: on ? 0x16806a : built ? 0x0a3d55 : 0x16262e, stroke: on ? 0xbff7d2 : built ? 0x7fb7c6 : 0x3f5a66, color: built ? '#ffffff' : '#8fa1a6', radius: 20 }).setDepth(D);
    });
    var world = TT.worldByN(cur), levels = TT.levelsInWorld(cur);
    var stars = TT.Save.worldStars(cur, diff);
    this.add.text(W / 2, 236, world.name + '  ·  ' + world.depth + '  ·  ★ ' + stars + ' / ' + world.plan.length * 3, { fontFamily: TT.UI.sans, fontStyle: '700', fontSize: TT.UI.fs(14), color: '#ffe7a8', stroke: '#06283a', strokeThickness: 3 }).setOrigin(0.5).setDepth(D);
    // six tiles: built levels, then "coming soon" for the rest of the world's plan
    world.plan.forEach(function (name, i) {
      var id = cur + '-' + (i + 1), l = TT.levelById(id), col = i % 3, row = Math.floor(i / 3);
      var x = ox + 640 + (col - 1) * 372, y = 330 + row * 158;
      if (!l) {
        var t0 = TT.UI.button(self, x, y, 356, 142, '', function () {}, { fill: 0x16262e, stroke: 0x3f5a66, radius: 18 }).setDepth(D);
        t0.add(self.add.text(-160, -58, id, { fontFamily: TT.UI.sans, fontStyle: '700', fontSize: TT.UI.fs(14), color: '#6f8790' }));
        t0.add(self.add.text(0, -8, name, { fontFamily: TT.UI.display, fontStyle: '800', fontSize: TT.UI.fs(20), color: '#8fa1a6', align: 'center', wordWrap: { width: 320 } }).setOrigin(0.5));
        t0.add(self.add.text(0, 36, 'Coming soon', { fontFamily: TT.UI.sans, fontStyle: '700', fontSize: TT.UI.fs(14), color: '#6f8790' }).setOrigin(0.5));
        return;
      }
      var open = TT.Save.levelOpen(l), res = TT.Save.levelResult(l.id, diff);
      var tile = TT.UI.button(self, x, y, 356, 142, '', function () { if (!open) return; TT.Sfx.unlock(); self.scene.start('Game', { levelId: l.id }); },
        { fill: !open ? 0x16262e : res ? 0x0f5a78 : 0x0a3d55, radius: 18 }).setDepth(D);
      tile.add(self.add.text(-160, -58, l.id, { fontFamily: TT.UI.sans, fontStyle: '700', fontSize: TT.UI.fs(14), color: '#bdf3ff' }));
      tile.add(self.add.text(0, -26, l.name, { fontFamily: TT.UI.display, fontStyle: '800', fontSize: TT.UI.fs(20), color: open ? '#ffffff' : '#8fa1a6', align: 'center', wordWrap: { width: 320 } }).setOrigin(0.5));
      for (var st = 0; st < 3; st++) {
        var on2 = res && st < res.stars;
        tile.add(self.add.star(-130 + st * 26, 44, 5, 5, 11, on2 ? 0xffd75e : 0x123f52).setStrokeStyle(2, on2 ? 0xfff2c8 : 0x3f6f80));
      }
      l.team.forEach(function (id2, ti) {
        var key = TT.Art.speciesKey(self, id2);
        tile.add(self.add.image(40 + ti * 44, 40, key).setScale(TT.Art.scaleFor(self, key, 38)).setAlpha(open ? 1 : 0.4));
      });
      var tag = !open ? 'LOCKED' : l.dark ? 'DARK' : l.tide ? 'TIDES' : (l.containers || []).some(function (c) { return c.stages; }) ? 'BIG RESCUE' : (l.currents && l.currents.length) ? 'CURRENTS' : '';
      if (tag) tile.add(self.add.text(162, -58, tag, { fontFamily: TT.UI.sans, fontStyle: '700', fontSize: TT.UI.fs(12), color: '#ffe7a8' }).setOrigin(1, 0));
    });
    var gs = Object.keys(C.GADGETS).map(function (k) { return C.GADGETS[k].name + ' ×' + TT.Save.gadgetCount(k); }).join('    ');
    this.add.text(W / 2, 668, 'Gadgets: ' + gs, { fontFamily: TT.UI.sans, fontStyle: '700', fontSize: TT.UI.fs(13), color: '#ffe7a8', stroke: '#06283a', strokeThickness: 3 }).setOrigin(0.5).setDepth(D);
    TT.UI.button(this, 90, 46, 130, 44, '‹ Title', function () { self.scene.start('Title'); }, { size: 15 }).setDepth(D);
    TT.UI.button(this, W - 110, 46, 170, 44, 'Field guide', function () { self.scene.start('FieldGuide'); }, { size: 15 }).setDepth(D);
    if (TT.Haptics.available()) TT.UI.button(this, W - 110, 100, 170, 40, 'Vibration: ' + (TT.Save.haptics() ? 'On' : 'Off'), function () {
      TT.Save.setHaptics(!TT.Save.haptics()); if (TT.Save.haptics()) TT.Haptics.buzz(30); self.scene.restart();
    }, { size: 13 }).setDepth(D);
    window.__TT_MENU = this;
  }
});

// Puzzle mode: pick a room. Stars come from moves used against par.
TT.PuzzleSelectScene = new Phaser.Class({
  Extends: Phaser.Scene,
  initialize: function PuzzleSelectScene() { Phaser.Scene.call(this, { key: 'PuzzleSelect' }); },
  create: function () {
    var C = TT.CFG, W = C.WIDTH, self = this, D = 30;
    TT.menuBackdrop(this, 0.5);
    TT.UI.title(this, W / 2, 46, 'Puzzles', 36).setDepth(D);
    this.add.text(W / 2, 92, 'Every ability use is a move, and only abilities break things. Plan each rescue. No tide.', { fontFamily: TT.UI.sans, fontStyle: '700', fontSize: TT.UI.fs(14), color: '#bdf3ff' }).setOrigin(0.5).setDepth(D);
    TT.UI.button(this, 90, 46, 130, 44, '‹ Title', function () { self.scene.start('Title'); }, { size: 15 }).setDepth(D);
    var ox = (W - 1280) / 2;
    TT.PUZZLES.forEach(function (p, i) {
      var col = i % 3, row = Math.floor(i / 3), x = ox + 640 + (col - 1) * 372, y = 230 + row * 190;
      var open = TT.Save.levelOpen(p), res = TT.Save.levelResult(p.id, 'puzzle');
      var tile = TT.UI.button(self, x, y, 356, 170, '', function () { if (!open) return; TT.Sfx.unlock(); self.scene.start('Game', { levelId: p.id, mode: 'puzzle' }); },
        { fill: !open ? 0x16262e : res ? 0x0f5a78 : 0x0a3d55, radius: 18 }).setDepth(D);
      tile.add(self.add.text(-160, -72, 'Puzzle ' + (i + 1), { fontFamily: TT.UI.sans, fontStyle: '700', fontSize: TT.UI.fs(14), color: '#bdf3ff' }));
      tile.add(self.add.text(162, -72, 'PAR ' + p.par + ' · ' + p.moves + ' MOVES', { fontFamily: TT.UI.sans, fontStyle: '700', fontSize: TT.UI.fs(12), color: '#ffe7a8' }).setOrigin(1, 0));
      tile.add(self.add.text(0, -34, p.name, { fontFamily: TT.UI.display, fontStyle: '800', fontSize: TT.UI.fs(22), color: open ? '#ffffff' : '#8fa1a6' }).setOrigin(0.5));
      for (var st = 0; st < 3; st++) {
        var on = res && st < res.stars;
        tile.add(self.add.star(-130 + st * 26, 50, 5, 5, 11, on ? 0xffd75e : 0x123f52).setStrokeStyle(2, on ? 0xfff2c8 : 0x3f6f80));
      }
      p.team.forEach(function (id, ti) {
        var key = TT.Art.speciesKey(self, id);
        tile.add(self.add.image(40 + ti * 48, 44, key).setScale(TT.Art.scaleFor(self, key, 42)).setAlpha(open ? 1 : 0.4));
      });
      if (res) tile.add(self.add.text(0, 6, 'Best: ' + res.score.toLocaleString(), { fontFamily: TT.UI.sans, fontStyle: '700', fontSize: TT.UI.fs(13), color: '#bff7d2' }).setOrigin(0.5));
    });
    window.__TT_MENU = this;
  }
});

function game_isCanvas(scene) { return scene.game.renderer.type === Phaser.CANVAS; }

// The picture for a trash card: the same junk you break in the game.
TT.trashTexture = function (scene, k) {
  if (k === 'net') return TT.Art.netTexture(scene, 74, 110);
  if (k === 'trap') return TT.Art.trapTexture(scene, 100, 70);
  if (k === 'glass') return 'mat_glass_bottle';
  if (k === 'line') {
    if (!scene.textures.exists('trash_line')) {
      // a tangle of monofilament with a hook and a sinker
      var g = scene.make.graphics({ x: 0, y: 0, add: false });
      g.lineStyle(2, 0xdff4ff, 0.95);
      for (var i = 0; i < 7; i++) g.strokeEllipse(60 + Math.cos(i) * 10, 48 + Math.sin(i * 1.7) * 8, 70 - i * 5, 40 - i * 3);
      g.lineBetween(95, 52, 112, 80);
      g.lineStyle(3, 0x9aa7b0, 1); g.beginPath(); g.arc(108, 88, 7, 0, Math.PI, false); g.strokePath(); g.lineBetween(115, 88, 115, 78);
      g.fillStyle(0x6f7a82, 1); g.fillEllipse(30, 82, 12, 16);
      g.generateTexture('trash_line', 124, 104); g.destroy();
    }
    return 'trash_line';
  }
  return 'mat_' + k;
};

TT.FieldGuideScene = new Phaser.Class({
  Extends: Phaser.Scene,
  initialize: function FieldGuideScene() { Phaser.Scene.call(this, { key: 'FieldGuide' }); },
  create: function (data) {
    var C = TT.CFG, W = C.WIDTH, self = this;
    TT.menuBackdrop(this, 0.62);
    var D = 30, tab = (data && data.tab) || 'wildlife', CARDS = tab === 'trash' ? TT.TRASH : TT.GUIDE;
    var unlocked = CARDS.filter(function (c) { return TT.Save.cardUnlocked(c.id); }).length;
    TT.UI.title(this, W / 2, 46, 'Field guide', 36).setDepth(D);
    // two tabs: the wildlife and places you meet, and the trash you clear up
    [['wildlife', 'Wildlife & places'], ['trash', 'Trash']].forEach(function (t, i) {
      var on = t[0] === tab;
      TT.UI.button(self, W / 2 + (i ? 130 : -130), 140, 240, 46, t[1], function () { if (!on) self.scene.restart({ tab: t[0] }); },
        { size: 15, fill: on ? 0x16806a : 0x0a3d55, stroke: on ? 0xbff7d2 : 0x7fb7c6, radius: 20 }).setDepth(D);
    });
    this.add.text(W / 2, 86, unlocked + ' of ' + CARDS.length + ' cards · ' + (tab === 'trash' ? 'clear levels to learn about the trash in them' : 'clear levels to unlock species and places'), { fontFamily: TT.UI.sans, fontStyle: '700', fontSize: TT.UI.fs(13), color: '#bdf3ff' }).setOrigin(0.5).setDepth(D);
    TT.UI.button(this, 90, 46, 130, 44, '‹ Back', function () { self.scene.start('LevelSelect'); }, { size: 15 }).setDepth(D);
    // a scrolling grid of cards (drag or use the mouse wheel when there are more than fit)
    var grid = this.add.container(0, 0).setDepth(D - 1), cols = tab === 'trash' ? 4 : 6, top = 260, rowH = 165, dragged = false;
    var rows = Math.ceil(CARDS.length / cols), minY = Math.min(0, C.HEIGHT - 40 - (top + (rows - 1) * rowH + 75));
    CARDS.forEach(function (card, i) {
      var col = i % cols, row = Math.floor(i / cols), x = W / 2 + (col - (cols - 1) / 2) * 200, y = top + row * rowH;
      var on = TT.Save.cardUnlocked(card.id);
      var tile = TT.UI.button(self, x, y, 188, 150, '', function () { if (on && !dragged) self.showCard(card); }, { fill: on ? 0x0f5a78 : 0x16262e, stroke: on ? 0xbdf3ff : 0x3f5a66 });
      grid.add(tile);
      var isPlace = card.id.indexOf('place_') === 0;
      if (card.trash) {
        var timg = self.add.image(0, -20, TT.trashTexture(self, card.k));
        var tsc = Math.min(130 / timg.width, 84 / timg.height); timg.setScale(tsc);
        if (!on) timg.setTint(0x000000).setAlpha(game_isCanvas(self) ? 0.18 : 0.5);
        tile.add(timg);
      } else if (!isPlace) {
        var key = TT.Art.speciesKey(self, card.id), sz = TT.Art.SPECIES_SIZE[card.id];
        var img = self.add.image(0, -18, key).setScale(TT.Art.scaleFor(self, key, Math.min(140, sz[0] * 1.6)));
        if (!on) img.setTint(0x000000).setAlpha(game_isCanvas(self) ? 0.18 : 0.5);
        tile.add(img);
      } else {
        tile.add(self.add.text(0, -20, on ? '⌖' : '?', { fontFamily: TT.UI.sans, fontSize: TT.UI.fs(40), color: on ? '#9fd8e0' : '#3d5258' }).setOrigin(0.5));
      }
      tile.add(self.add.text(0, 48, on ? card.name : '???', { fontFamily: TT.UI.font, fontSize: TT.UI.fs(15), color: on ? '#ffffff' : '#56707a', align: 'center', wordWrap: { width: 176 } }).setOrigin(0.5));
    });
    if (minY < 0) {
      var startY = 0, startP = 0;
      this.input.on('pointerdown', function (p) { startY = p.y; startP = grid.y; dragged = false; });
      this.input.on('pointermove', function (p) { if (!p.isDown) return; if (Math.abs(p.y - startY) > 10) dragged = true; if (dragged) grid.y = Phaser.Math.Clamp(startP + p.y - startY, minY, 0); });
      this.input.on('wheel', function (p, o, dx, dy) { grid.y = Phaser.Math.Clamp(grid.y - dy, minY, 0); });
      this.add.text(W - 24, 86, 'Drag to see more', { fontFamily: TT.UI.sans, fontStyle: '700', fontSize: TT.UI.fs(12), color: '#ffe7a8' }).setOrigin(1, 0.5).setDepth(D);
    }
    // header strip stays on top of scrolled cards
    this.add.rectangle(0, 0, W, 172, 0x04202c, 0.92).setOrigin(0, 0).setDepth(D - 0.5);
  },
  showCard: function (card) {
    var C = TT.CFG, W = C.WIDTH, H = C.HEIGHT, self = this, isPlace = card.id.indexOf('place_') === 0;
    var layer = this.add.container(0, 0).setDepth(40);
    var shade = this.add.rectangle(0, 0, W, H, 0x020b10, 0.7).setOrigin(0, 0).setInteractive();
    shade.on('pointerup', function () { layer.destroy(); });
    var pw = 940, ph = 590, px = W / 2 - pw / 2, py = H / 2 - ph / 2, leftX = px + 220;
    var g = this.add.graphics(); TT.UI.panel(g, px, py, pw, ph, 22, 0x0a3d55, 0.98);
    layer.add([shade, g]);
    // left column: the animal (or the place marker) with the close hint right under it
    if (card.trash) {
      var ti = this.add.image(leftX, py + 210, TT.trashTexture(this, card.k));
      ti.setScale(Math.min(300 / ti.width, 240 / ti.height)); layer.add(ti);
    } else if (!isPlace) {
      var key = TT.Art.speciesKey(this, card.id);
      layer.add(this.add.image(leftX, py + 210, key).setScale(TT.Art.scaleFor(this, key, Math.min(330, TT.Art.SPECIES_SIZE[card.id][0] * 3))));
    } else layer.add(this.add.text(leftX, py + 210, '⌖', { fontFamily: TT.UI.sans, fontSize: TT.UI.fs(110), color: '#9fd8e0' }).setOrigin(0.5));
    layer.add(TT.UI.button(this, leftX, py + ph - 64, 220, 52, 'Close', function () { layer.destroy(); }, { size: 16 }));
    // right column: name, scientific name and facts, stacked by their real heights so nothing runs off the card
    var tx = px + 430, tw = pw - 430 - 36, y = py + 34;
    var name = this.add.text(tx, y, card.name, { fontFamily: TT.UI.display, fontStyle: '800', fontSize: TT.UI.fs(28), color: '#ffffff', wordWrap: { width: tw } });
    y += name.height + 4;
    var sci = this.add.text(tx, y, card.sci, { fontFamily: TT.UI.font, fontSize: TT.UI.fs(16), color: '#9fd8e0', fontStyle: 'italic', wordWrap: { width: tw } });
    y += sci.height + 16;
    var body = card.trash ?
      'Where it comes from: ' + card.where + '\n\nHow long it lasts: ' + card.size + '\n\nHow it harms wildlife: ' + card.fact + '\n\nHow to help: ' + card.threat :
      'Where: ' + card.where + '\n\nSize: ' + card.size + '\n\nDid you know? ' + card.fact + '\n\nThreats: ' + card.threat;
    var size = 16, bt;
    do { if (bt) bt.destroy(); bt = this.add.text(tx, y, body, { fontFamily: TT.UI.sans, fontSize: TT.UI.fs(size), color: '#d8f1f4', wordWrap: { width: tw }, lineSpacing: 4 }); size--; }
    while (y + bt.height > py + ph - 28 && size > 11);
    layer.add([name, sci, bt]);
  }
});

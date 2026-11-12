// Tide Tossers v0.5 — scenery: everything you see that isn't a game object. (First pass; art upgrade follows.)
window.TT = window.TT || {};

TT.Scenery = function (scene, level, water) {
  var C = TT.CFG, W = level.width, H = C.HEIGHT;
  this.scene = scene; this.level = level; this.water = water;
  var old = { keys: 'keys_reef', galapagos: 'galapagos_open', cave: 'lava_cave' }[level.background];
  var bg = TT.Art.backgroundTextures(scene, old, 1600);
  this.air = scene.add.tileSprite(0, 0, W, H, bg.air).setOrigin(0, 0).setDepth(0);
  this.under = scene.add.tileSprite(0, 0, W, H, bg.under).setOrigin(0, 0).setDepth(1);
  this.floor = scene.add.tileSprite(0, C.FLOOR_Y - 10, W, H - C.FLOOR_Y + 10, bg.floor).setOrigin(0, 0).setDepth(2);
  this.surface = scene.add.graphics().setDepth(15);
  if (level.dark) {
    var cam = scene.cameras.main;
    this.darkRT = scene.add.renderTexture(0, 0, Math.ceil(C.WIDTH / cam.zoom) + 8, Math.ceil(H / cam.zoom) + 8).setOrigin(0, 0).setDepth(18);
    this.stamp = scene.make.image({ key: 'light_brush', add: false });
  }
};

TT.Scenery.prototype.update = function (t) {
  var y = this.water.y, W = this.level.width, s = this.surface, cam = this.scene.cameras.main, v = cam.worldView;
  this.under.setCrop(0, y, W, TT.CFG.HEIGHT - y);
  s.clear(); s.lineStyle(3, 0xeafcff, 0.7); s.beginPath();
  for (var x = Math.floor(v.x / 16) * 16 - 16; x <= v.right + 16; x += 16) {
    var yy = y + Math.sin(x * 0.025 + t * 2.2) * 2.2 + Math.sin(x * 0.011 - t * 1.3) * 1.6;
    if (x <= v.x - 16 + 16) s.moveTo(x, yy); else s.lineTo(x, yy);
  }
  s.strokePath();
  if (this.darkRT) {
    var rt = this.darkRT, g = this.scene;
    rt.setVisible(!g.lit);
    if (!g.lit) {
      rt.setPosition(v.x - 4, v.y - 4); rt.clear(); rt.fill(0x000000, TT.CFG.DARK_ALPHA);
      for (var k = 0; k < g.lights.length; k++) {
        var L = g.lights[k];
        this.stamp.setPosition(L.x - rt.x, L.y - rt.y).setScale((L.r * 2) / 256).setAlpha(L.a === undefined ? 1 : L.a);
        rt.erase(this.stamp);
      }
    }
  }
};

TT.Scenery.exitRing = function (scene, x, y) {
  var g = scene.add.graphics().setDepth(7).setBlendMode(Phaser.BlendModes.ADD);
  return { x: x, y: y, update: function (t, open) {
    g.clear(); if (!open) return;
    for (var i = 0; i < 3; i++) { var r = 30 + ((t * 40 + i * 30) % 90); g.lineStyle(4, 0x9ff7e0, 0.7 * (1 - (r - 30) / 90)); g.strokeCircle(x, y, r); }
  } };
};
TT.Scenery.attachRope = function (scene, ent) { ent.rope = scene.add.graphics().setDepth(7.3); };
TT.Scenery.drawRope = function (c, waterY) {
  var g = c.rope, top = c.sprite.y - c.h / 2;
  g.clear(); g.lineStyle(3, 0x6d5a3c, 1); g.lineBetween(c.x, top, c.x, waterY);
  g.fillStyle(0xe8502c, 1); g.fillCircle(c.x, waterY - 4, 12);
};

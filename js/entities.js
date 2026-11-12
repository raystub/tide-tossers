// Tide Tossers v0.5 — entities: rescuers, junk, containers (nets, lines, traps), coral, lionfish,
// plus impact damage. Every Matter body carries `body.tt` -> its entity. Abilities live in player.js.
window.TT = window.TT || {};

TT.Entities = (function () {
  var C = TT.CFG;
  function M() { return Phaser.Physics.Matter.Matter; }

  function tag(go, ent) { ent.sprite = go; ent.body = go.body; go.body.tt = ent; return ent; }

  // ---------- creation ----------
  // The creature the player swims. It has no ttWater: it moves by the swim rules in player.js, not by buoyancy.
  function rescuer(scene, id, x, y) {
    var def = C.RESCUERS[id];
    var key = TT.Art.speciesKey(scene, id);
    var s = TT.Art.scaleFor(scene, key, def.radius * def.len);
    var go = scene.matter.add.sprite(x, y, key, 0, {
      shape: { type: 'circle', radius: def.radius / s },
      density: def.density, frictionAir: 0, restitution: 0.2, friction: 0.05
    });
    go.setScale(s).setDepth(9).setFixedRotation();
    TT.Art.playSwim(go, id);
    return tag(go, { kind: 'rescuer', id: id, def: def, radius: def.radius, alive: true, baseScale: s, baseMass: go.body.mass });
  }

  function junk(scene, d, hpMult) {
    var mat = C.MATERIALS[d.k];
    var key = d.k === 'glass' ? 'mat_glass_bottle' : 'mat_' + d.k;
    var go = scene.matter.add.image(d.x, d.y, key, null, { density: mat.density, friction: 0.6, restitution: 0.05, frictionAir: 0.01 });
    go.setDisplaySize(d.w, d.h).setDepth(8);
    if (d.angle) go.setRotation(Phaser.Math.DegToRad(d.angle));
    go.body.ttWater = { buoy: mat.buoy };
    return tag(go, { kind: 'object', material: d.k, hp: mat.hp * hpMult, maxHp: mat.hp * hpMult, alive: true, w: d.w, h: d.h });
  }

  function container(scene, d, hpMult) {
    var cdef = C.CONTAINERS[d.k], go, ent;
    if (d.k === 'trap') {
      go = scene.matter.add.image(d.x, d.y, TT.Art.trapTexture(scene, d.w, d.h), null, { density: cdef.density, friction: 0.7, restitution: 0.02 });
      go.setScale(1 / TT.Art.PS);
      go.body.ttWater = { buoy: cdef.buoy };
    } else if (d.k === 'line') {
      // fishing line: a sensor so rescuers pass through and cut it
      go = scene.matter.add.image(d.x, d.y, 'dot', null, { isStatic: true, isSensor: true });
      go.setVisible(false);
      M().Body.scale(go.body, 30 / 32, d.h / 32);
    } else {
      go = scene.matter.add.image(d.x, d.y, TT.Art.netTexture(scene, d.w, d.h), null, { isStatic: true, friction: 0.8 });
      go.setScale(1 / TT.Art.PS);
      go.setAlpha(0.95);
    }
    go.setDepth(7.5);
    ent = tag(go, { kind: 'container', ctype: d.k, hp: cdef.hp * hpMult, maxHp: cdef.hp * hpMult, alive: true, w: d.w, h: d.h, x: d.x, y: d.y, animals: [] });
    if (d.hang) TT.Scenery.attachRope(scene, ent);
    if (d.k === 'line') {
      ent.lineGfx = scene.add.graphics().setDepth(7.6);
      drawLine(ent, 0);
    }
    // trapped animals, drawn behind the net / inside the trap
    var list = [];
    (d.holds || []).forEach(function (h) { for (var i = 0; i < h.n; i++) list.push(h.k); });
    list.forEach(function (k, i) {
      var akey = TT.Art.speciesKey(scene, k), sz = TT.Art.SPECIES_SIZE[k];
      var spr = scene.add.sprite(d.x, d.y, akey).setDepth(7.4);
      TT.Art.playSwim(spr, k);
      var scale = TT.Art.scaleFor(scene, akey, sz[0] * (k === 'fishschool' ? 0.9 : 1.35));
      spr.setScale(scale);
      var n = list.length, ox = n > 1 ? (i - (n - 1) / 2) * Math.min(26, d.w * 0.4) : 0;
      if (d.k === 'line') ox = 14;
      ent.animals.push({ k: k, sprite: spr, ox: ox, oy: (d.k === 'line' ? (i - (n - 1) / 2) * 30 : 6), phase: Math.random() * 6, baseScale: scale });
    });
    return ent;
  }
  function drawLine(ent, t) {
    var g = ent.lineGfx; g.clear();
    g.lineStyle(1.5, 0xe8f0ee, 0.8);
    g.beginPath();
    for (var i = 0; i <= 12; i++) {
      var yy = ent.y - ent.h / 2 + ent.h * i / 12;
      var xx = ent.x + Math.sin(i * 0.9 + t * 1.5) * 3;
      if (i === 0) g.moveTo(xx, yy); else g.lineTo(xx, yy);
    }
    g.strokePath();
    // a few hooks and a float at the top
    g.fillStyle(0xd94c2c, 0.9); g.fillCircle(ent.x, ent.y - ent.h / 2, 6);
    g.lineStyle(1.5, 0x9aa4a8, 0.9);
    for (var k = 1; k < 4; k++) { var hy = ent.y - ent.h / 2 + ent.h * k / 4; g.beginPath(); g.arc(ent.x + 4, hy, 4, 0, Math.PI); g.strokePath(); }
  }

  function coral(scene, d, idx) {
    var go = scene.matter.add.image(d.x, d.y, TT.Art.coralTexture(scene, d.w, d.h, idx), null, { isStatic: true, friction: 0.8 });
    go.setScale(1 / TT.Art.PS).setDepth(6);
    // body only covers the lower 70% so hits look right
    M().Body.scale(go.body, 0.92, 0.7);
    M().Body.setPosition(go.body, { x: d.x, y: d.y + d.h * 0.15 });
    // a soft glow and the odd sparkle mark it as living coral, not background scenery
    var glow = scene.add.image(d.x, d.y + 6, 'light_brush').setDepth(5.9).setBlendMode(Phaser.BlendModes.ADD).setTint(0xfff0a8).setAlpha(0.3).setDisplaySize(d.w * 1.7, d.h * 1.9);
    scene.tweens.add({ targets: glow, alpha: 0.14, duration: 1400 + idx * 170, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    scene.time.addEvent({ delay: 900 + idx * 130, loop: true, callback: function () { if (scene.fx) scene.fx.sparkle(d.x + (Math.random() - 0.5) * d.w * 0.8, d.y - d.h * 0.2 + (Math.random() - 0.5) * d.h * 0.6); } });
    return tag(go, { kind: 'coral', lastHit: -9999, alive: true });
  }

  function lionfish(scene, d) {
    var key = TT.Art.speciesKey(scene, 'lionfish');
    var s = TT.Art.scaleFor(scene, key, 70);
    var go = scene.matter.add.sprite(d.x, d.y, key, 0, { isStatic: true, isSensor: true, shape: { type: 'circle', radius: 26 / s } });
    go.setScale(s).setDepth(10);
    TT.Art.playSwim(go, 'lionfish');
    return tag(go, { kind: 'lionfish', alive: true, home: { x: d.x, y: d.y }, patrol: d.patrol || 80, phase: Math.random() * 6, fleeing: false, dir: 1 });
  }

  function staticBody(scene, d, idx) {
    var go = scene.matter.add.image(d.x, d.y, TT.Art.staticTexture(scene, d, idx), null, { isStatic: true, friction: 0.9 });
    go.setScale(1 / TT.Art.PS).setDepth(5);
    if (d.look === 'root') {
      M().Body.scale(go.body, 0.6 / 4, 1);     // texture is 4x wider than the collision column
      scene.add.image(d.x, d.y - d.h / 2 + 10, TT.Art.canopyTexture(scene)).setDepth(5.1);
    }
    return tag(go, { kind: 'static', look: d.look });
  }

  // ---------- damage ----------
  function otherMass(o) {
    var b = o.body;
    if (!b || b.isStatic) return C.STATIC_MASS_CAP;
    return Math.min(b.mass, C.MASS_CAP);
  }
  function rescuerMult(r, material) {
    var m = 1;
    if (r.def.bonusVs && r.def.bonusVs[material]) m *= r.def.bonusVs[material];
    if (r.ramming && material === 'concrete') m *= C.ABILITY.ramVsConcrete;
    return m;
  }

  // Resolve one collision pair. `game` is the GameScene; rel = relative impact speed.
  function impact(game, a, b, rel) {
    if (!a || !b) return;
    side(game, a, b, rel); side(game, b, a, rel);
  }
  function side(game, t, o, rel) {
    if (!t.alive) return;
    if (t.kind === 'lionfish') {
      if (t.fleeing) return;
      if (o.kind === 'rescuer') {
        if (o.id === 'puffer' || o.inflated) game.lionfishFlee(t); else game.sting(o, t);
      } else if (o.kind === 'object' && rel > C.LIONFISH_FLEE_SPEED) game.lionfishFlee(t);
      return;
    }
    if (t.kind === 'coral') {
      if (o.kind === 'static' || o.kind === 'floor' || o.kind === 'coral') return;
      if (rel > C.CORAL_DAMAGE_SPEED && game.time.now - t.lastHit > C.CORAL_COOLDOWN * 1000) {
        t.lastHit = game.time.now; game.coralHit(t, o);
      }
      return;
    }
    if (t.kind === 'object') {
      if (rel < C.MIN_DAMAGE_SPEED) return;
      if (o.kind === 'rescuer' && o.piercing) {
        if (t.material === 'concrete') { o.stopDead = true; o.piercing = false; }
        else { o.restoreVel = { x: o.pierceVel.x, y: o.pierceVel.y }; game.destroyObject(t, o); return; }
      }
      var dmg = C.DAMAGE_SCALE * rel * otherMass(o);
      if (o.kind === 'rescuer') dmg *= rescuerMult(o, t.material);
      damage(game, t, dmg, o);
      return;
    }
    if (t.kind === 'container') {
      var cd = C.CONTAINERS[t.ctype];
      if (o.kind === 'static' || o.kind === 'floor' || o.kind === 'coral') return;
      if (o.kind === 'rescuer' && o.id === 'swordfish' && t.ctype !== 'trap' && rel > 2) { damage(game, t, 9999, o); return; }
      if (cd.minSpeed && rel < cd.minSpeed) return;
      if (rel < C.MIN_DAMAGE_SPEED) return;
      var d2 = C.DAMAGE_SCALE * rel * otherMass(o);
      if (o.kind === 'rescuer' && o.ramming) d2 *= C.ABILITY.ramVsContainer;
      damage(game, t, d2, o);
    }
    if (t.kind === 'floor' && o.kind !== 'static' && o.body && !o.body.isStatic) {
      var heavy = (o.kind === 'object' && (o.material === 'concrete' || o.material === 'tin')) ||
                  (o.kind === 'rescuer' && (o.id === 'loggerhead' || o.id === 'hammerhead')) || (o.kind === 'container' && o.ctype === 'trap');
      if (heavy && rel > C.SEDIMENT_MIN_SPEED) game.sediment(o.body.position.x, C.FLOOR_Y);
    }
  }
  function damage(game, t, amount, source) {
    if (!t.alive || amount <= 0) return;
    t.hp -= amount;
    if (t.hp <= 0) {
      if (t.kind === 'object') game.destroyObject(t, source);
      else if (t.kind === 'container') game.breakContainer(t, source);
    } else if (t.sprite && t.kind === 'container') {
      game.hitFlash(t);
    } else if (t.sprite && t.kind === 'object') {
      // darken as it weakens
      var f = Phaser.Math.Clamp(t.hp / t.maxHp, 0.35, 1);
      var c = Math.round(255 * f);
      t.sprite.setTint(Phaser.Display.Color.GetColor(c, c, c));
    }
  }

  return { rescuer: rescuer, junk: junk, container: container, coral: coral, lionfish: lionfish, staticBody: staticBody,
    impact: impact, damage: damage, drawLine: drawLine };
})();

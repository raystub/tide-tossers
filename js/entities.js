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
    if (d.pinned) go.setStatic(true);   // snagged on a branch above the water until knocked down
    go.body.ttWater = { buoy: mat.buoy };
    return bury(go, tag(go, { kind: 'object', material: d.k, hp: mat.hp * hpMult, maxHp: mat.hp * hpMult, alive: true, w: d.w, h: d.h, pinned: !!d.pinned }), d);
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
    var stages = d.stages || 1, hp = cdef.hp * hpMult * (stages > 1 ? 1.5 : 1);
    ent = tag(go, { kind: 'container', ctype: d.k, hp: hp, maxHp: hp, alive: true, w: d.w, h: d.h, x: d.x, y: d.y, animals: [], stages: stages, stagesLeft: stages,
      gentle: !!d.gentle, sink: d.sink || 0, sinkTo: d.sinkTo || 0 });
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
      var scale = TT.Art.scaleFor(scene, akey, sz[0] * (TT.isSchool(k) ? 0.9 : sz[0] >= 120 ? 1 : 1.35));
      spr.setScale(scale);
      var n = list.length, ox = n > 1 ? (i - (n - 1) / 2) * Math.min(sz[0] >= 80 ? d.w * 0.8 / n : 26, sz[0] >= 80 ? 90 : d.w * 0.4) : 0;
      if (d.k === 'line') ox = 14;
      ent.animals.push({ k: k, sprite: spr, ox: ox, oy: (d.k === 'line' ? (i - (n - 1) / 2) * 30 : 6), phase: Math.random() * 6, baseScale: scale });
    });
    return bury(go, ent, d);
  }
  // Buried under sand: faint and solid to nothing until a leopard shark senses it or a bat ray digs it out.
  function bury(go, ent, d) {
    if (!d.buried) return ent;
    ent.buried = true; go.setAlpha(0.16);
    if (!go.body.isStatic) { ent.wasDynamic = true; go.setStatic(true); }
    go.body.isSensor = true;
    (ent.animals || []).forEach(function (a) { a.sprite.setAlpha(0.16); });
    return ent;
  }
  function unbury(scene, ent) {
    if (!ent.buried) return false;
    ent.buried = false; ent.body.isSensor = false;
    if (ent.wasDynamic) ent.sprite.setStatic(false);
    var targets = [ent.sprite].concat((ent.animals || []).map(function (a) { return a.sprite; }));
    scene.tweens.add({ targets: targets, alpha: ent.kind === 'container' && ent.ctype === 'net' ? 0.95 : 1, duration: 400 });
    return true;
  }
  // Giant kelp: tall plants from floor to surface. Swimming through a stand is slower (KELP_DRAG).
  function kelp(scene, d, idx) {
    var n = Math.max(2, Math.round(d.w / 70)), plants = [];
    for (var i = 0; i < n; i++) {
      var x = d.x - d.w / 2 + (i + 0.5) * d.w / n + (Math.random() - 0.5) * 20, front = i % 2 === 1;
      var p = scene.add.image(x, C.FLOOR_Y + 6, 'giantkelp').setOrigin(0.5, 1).setDepth(front ? 9.4 : 5.4).setAlpha(front ? 0.7 : 1).setFlipX(Math.random() < 0.5);
      p.setDisplaySize(80 * (0.9 + Math.random() * 0.3), C.FLOOR_Y + 6 - scene.water.y + 10);
      scene.tweens.add({ targets: p, rotation: 0.04, duration: 2200 + Math.random() * 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: Math.random() * 1500 });
      plants.push(p);
    }
    return { kind: 'kelp', x: d.x, w: d.w, plants: plants };
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

  // A living seagrass meadow on the floor: swaying clumps plus a sensor that notices anything crashing into it.
  function seagrass(scene, d, idx) {
    var y = C.FLOOR_Y + 4, n = Math.max(3, Math.round(d.w / 26)), clumps = [];
    for (var i = 0; i < n; i++) {
      var x = d.x - d.w / 2 + (i + 0.5) * d.w / n + (Math.random() - 0.5) * 10;
      var c = scene.add.image(x, y, 'seagrass').setOrigin(0.5, 1).setDepth(i % 3 === 0 ? 8.8 : 5.5).setScale(0.8 + Math.random() * 0.5).setFlipX(Math.random() < 0.5);
      c.rotation = (Math.random() - 0.5) * 0.1;
      scene.tweens.add({ targets: c, rotation: c.rotation + 0.12, duration: 1300 + Math.random() * 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: Math.random() * 900 });
      clumps.push(c);
    }
    var b = scene.matter.add.rectangle(d.x, C.FLOOR_Y - 28, d.w, 56, { isStatic: true, isSensor: true });
    var ent = { kind: 'seagrass', alive: true, lastHit: -9999, clumps: clumps, x: d.x, w: d.w, body: b };
    b.tt = ent;
    return ent;
  }

  // A big, gentle animal resting in the way (a manta at a cleaning station). Bumping it does nothing; a cleaner wrasse calms it.
  function gentle(scene, d) {
    var key = TT.Art.speciesKey(scene, d.k), len = d.len || TT.Art.SPECIES_SIZE[d.k][0] * 1.1, s = TT.Art.scaleFor(scene, key, len);
    var go = scene.matter.add.sprite(d.x, d.y, key, 0, { isStatic: true, shape: { type: 'rectangle', width: len * 0.8 / s, height: len * 0.42 / s } });
    go.setScale(s).setDepth(8.2).setFlipX(!!d.flip);
    TT.Art.playSwim(go, d.k);
    return tag(go, { kind: 'gentle', species: d.k, alive: true, calm: false, x: d.x, y: d.y, w: len * 0.8, h: len * 0.42, phase: Math.random() * 6 });
  }

  function lionfish(scene, d) {
    // d.k: 'lionfish' (patrols) or a crawler (CRAWLERS: crown-of-thorns, green crab, purple urchin) that creeps along the bottom
    var sp = d.k || 'lionfish', key = TT.Art.speciesKey(scene, sp), crawl = CRAWLERS.indexOf(sp) >= 0, size = d.size || (crawl ? 62 : 70);
    var s = TT.Art.scaleFor(scene, key, size);
    var go = scene.matter.add.sprite(d.x, d.y, key, 0, { isStatic: true, isSensor: true, shape: { type: 'circle', radius: 26 * size / 70 / s } });
    go.setScale(s).setDepth(crawl ? 6.5 : 10);
    TT.Art.playSwim(go, sp);
    return tag(go, { kind: 'lionfish', species: sp, alive: true, home: { x: d.x, y: d.y }, patrol: d.patrol || (crawl ? 22 : 80), crawler: crawl, phase: Math.random() * 6, fleeing: false, dir: 1, hunt: !!d.hunt });
  }

  var CRAWLERS = ['cots', 'greencrab', 'purpleurchin'];
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
    if (!t.alive || t.buried || o.buried) return;
    if (t.kind === 'lionfish') {
      if (t.fleeing) return;
      if (o.kind === 'rescuer') {
        if (!t.crawler && (o.id === 'puffer' || o.inflated)) game.lionfishFlee(t); else if (!o.def.spineproof && t.species !== 'purpleurchin') game.sting(o, t);
      } else if (o.kind === 'object' && rel > C.LIONFISH_FLEE_SPEED && !t.crawler) game.lionfishFlee(t);
      return;
    }
    if (t.kind === 'coral') {
      if (o.kind === 'static' || o.kind === 'floor' || o.kind === 'coral') return;
      if (rel > C.CORAL_DAMAGE_SPEED && game.time.now - t.lastHit > C.CORAL_COOLDOWN * 1000) {
        t.lastHit = game.time.now; game.coralHit(t, o);
      }
      return;
    }
    if (t.kind === 'seagrass') {
      var crush = (o.kind === 'object' && C.MATERIALS[o.material].buoy !== 'floats' && rel > C.SEAGRASS_CRUSH_SPEED) ||
                  (o.kind === 'container' && o.ctype === 'trap' && rel > C.SEAGRASS_CRUSH_SPEED) ||
                  (o.kind === 'rescuer' && rel > C.SEAGRASS_DASH_SPEED);
      if (crush && game.time.now - t.lastHit > C.SEAGRASS_COOLDOWN * 1000) { t.lastHit = game.time.now; game.seagrassHit(t, o); }
      return;
    }
    if (t.kind === 'object') {
      if (rel < C.MIN_DAMAGE_SPEED) return;
      if (o.kind === 'rescuer' && o.piercing) {
        if (t.material === 'concrete') { o.stopDead = true; o.piercing = false; }
        else { o.restoreVel = { x: o.pierceVel.x, y: o.pierceVel.y }; game.destroyObject(t, o); return; }
      }
      if (o.kind === 'rescuer' && game.puzzle && !game.player.charging()) return;
      var dmg = C.DAMAGE_SCALE * rel * otherMass(o);
      if (o.kind === 'rescuer') dmg *= rescuerMult(o, t.material);
      damage(game, t, dmg, o);
      return;
    }
    if (t.kind === 'container') {
      var cd = C.CONTAINERS[t.ctype];
      if (o.kind === 'static' || o.kind === 'floor' || o.kind === 'coral') return;
      if (t.gentle) { if (o.kind === 'rescuer') game.gentleWarn(t); return; }
      if (o.kind === 'rescuer' && game.cutterUntil > game.clock && t.ctype !== 'trap') { game.useCutter(t); return; }
      if (o.kind === 'rescuer' && game.puzzle && !game.player.charging()) return;
      if (o.kind === 'rescuer' && o.id === 'swordfish' && t.ctype !== 'trap' && rel > 2) { damage(game, t, t.stagesLeft > 1 ? t.maxHp : 9999, o); return; }
      if (cd.minSpeed && rel < cd.minSpeed) return;
      if (rel < C.MIN_DAMAGE_SPEED) return;
      var d2 = C.DAMAGE_SCALE * rel * otherMass(o);
      if (o.kind === 'rescuer' && o.ramming) d2 *= C.ABILITY.ramVsContainer;
      damage(game, t, d2, o);
    }
    if (t.kind === 'floor' && o.kind !== 'static' && o.body && !o.body.isStatic) {
      var heavy = (o.kind === 'object' && (o.material === 'concrete' || o.material === 'tin')) ||
                  (o.kind === 'rescuer' && (o.id === 'loggerhead' || o.id === 'hammerhead' || o.id === 'manatee')) || (o.kind === 'container' && o.ctype === 'trap');
      if (heavy && rel > C.SEDIMENT_MIN_SPEED) game.sediment(o.body.position.x, C.FLOOR_Y);
    }
  }
  function damage(game, t, amount, source) {
    if (!t.alive || amount <= 0 || t.buried) return;
    if (t.gentle) { game.gentleWarn(t); return; }   // only a cleaner wrasse can free a tangled gentle animal
    t.hp -= amount;
    if (t.hp <= 0) {
      if (t.kind === 'object') game.destroyObject(t, source);
      else if (t.kind === 'container' && t.stagesLeft > 1) game.tearStage(t, source);
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

  return { rescuer: rescuer, junk: junk, container: container, coral: coral, seagrass: seagrass, kelp: kelp, unbury: unbury, CRAWLERS: CRAWLERS, lionfish: lionfish, gentle: gentle, staticBody: staticBody,
    impact: impact, damage: damage, drawLine: drawLine };
})();

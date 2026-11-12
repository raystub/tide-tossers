// Tide Tossers v0.2 — entities: rescuers, junk, containers (nets, lines, traps), coral, lionfish,
// plus impact damage and rescuer abilities. Every Matter body carries `body.tt` -> its entity.
window.TT = window.TT || {};

TT.Entities = (function () {
  var C = TT.CFG;
  function M() { return Phaser.Physics.Matter.Matter; }

  function tag(go, ent) { ent.sprite = go; ent.body = go.body; go.body.tt = ent; return ent; }

  // ---------- creation ----------
  function rescuer(scene, id, x, y) {
    var def = C.RESCUERS[id];
    var key = TT.Art.speciesKey(scene, id);
    var len = def.radius * (id === 'swordfish' ? 5.6 : id === 'hammerhead' ? 4.4 : id === 'loggerhead' ? 3.4 : 3.3);
    var s = TT.Art.scaleFor(scene, key, len);
    var go = scene.matter.add.image(x, y, key, null, {
      shape: { type: 'circle', radius: def.radius / s },
      density: def.density, frictionAir: C.RESCUER_AIR_FRICTION, restitution: 0.25, friction: 0.3
    });
    go.setScale(s).setDepth(9);
    go.body.ttWater = { buoy: def.buoy, ignoreDrag: false };
    return tag(go, {
      kind: 'rescuer', id: id, def: def, radius: def.radius, alive: true, launched: false,
      abilityUsed: false, disarmed: false, skips: 0, stamina: 0, maxStamina: 0, baseScale: s
    });
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
      go.body.ttWater = { buoy: cdef.buoy };
    } else if (d.k === 'line') {
      // fishing line: a sensor so rescuers pass through and cut it
      go = scene.matter.add.image(d.x, d.y, 'dot', null, { isStatic: true, isSensor: true });
      go.setVisible(false);
      M().Body.scale(go.body, 30 / 32, d.h / 32);
    } else {
      go = scene.matter.add.image(d.x, d.y, TT.Art.netTexture(scene, d.w, d.h), null, { isStatic: true, friction: 0.8 });
      go.setAlpha(0.95);
    }
    go.setDepth(7.5);
    ent = tag(go, { kind: 'container', ctype: d.k, hp: cdef.hp * hpMult, maxHp: cdef.hp * hpMult, alive: true, w: d.w, h: d.h, x: d.x, y: d.y, animals: [] });
    if (d.k === 'line') {
      ent.lineGfx = scene.add.graphics().setDepth(7.6);
      drawLine(ent, 0);
    }
    // trapped animals, drawn behind the net / inside the trap
    var list = [];
    (d.holds || []).forEach(function (h) { for (var i = 0; i < h.n; i++) list.push(h.k); });
    list.forEach(function (k, i) {
      var akey = TT.Art.speciesKey(scene, k), sz = TT.Art.SPECIES_SIZE[k];
      var spr = scene.add.image(d.x, d.y, akey).setDepth(7.4);
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
    go.setDepth(6);
    // body only covers the lower 70% so hits look right
    M().Body.scale(go.body, 0.92, 0.7);
    M().Body.setPosition(go.body, { x: d.x, y: d.y + d.h * 0.15 });
    return tag(go, { kind: 'coral', lastHit: -9999, alive: true });
  }

  function lionfish(scene, d) {
    var key = TT.Art.speciesKey(scene, 'lionfish');
    var s = TT.Art.scaleFor(scene, key, 70);
    var go = scene.matter.add.image(d.x, d.y, key, null, { isStatic: true, isSensor: true, shape: { type: 'circle', radius: 26 / s } });
    go.setScale(s).setDepth(10);
    return tag(go, { kind: 'lionfish', alive: true, home: { x: d.x, y: d.y }, patrol: d.patrol || 80, phase: Math.random() * 6, fleeing: false, dir: 1 });
  }

  function staticBody(scene, d, idx) {
    var go = scene.matter.add.image(d.x, d.y, TT.Art.staticTexture(scene, d, idx), null, { isStatic: true, friction: 0.9 });
    go.setDepth(5);
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
    if (r.ramming && r.id === 'hammerhead' && material === 'concrete') m *= 1; // already applied
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
        if (o.id === 'puffer') { game.lionfishFlee(t); }
        else if (!o.disarmed) {
          o.disarmed = true; game.flash(o.sprite.x, o.sprite.y, 'Spines! Ability lost');
          var v = TT.vel(o.body); M().Body.setVelocity(o.body, { x: -v.x * 0.5, y: -v.y * 0.5 - 1 });
        }
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
      if (o.kind === 'rescuer' && o.ramming) d2 *= 1.5;
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
    } else if (t.sprite && t.kind === 'object') {
      // darken as it weakens
      var f = Phaser.Math.Clamp(t.hp / t.maxHp, 0.35, 1);
      var c = Math.round(255 * f);
      t.sprite.setTint(Phaser.Display.Color.GetColor(c, c, c));
    }
  }

  // ---------- abilities ----------
  function ability(game, r) {
    var A = C.ABILITY, Mx = M(), b = r.body, v = TT.vel(b);
    if (r.abilityUsed || !r.alive) return false;
    if (r.disarmed) { game.flash(r.sprite.x, r.sprite.y, 'No ability (spines)'); r.abilityUsed = true; return false; }
    r.abilityUsed = true;
    var speed = Math.sqrt(v.x * v.x + v.y * v.y), ang = Math.atan2(v.y, v.x);
    switch (r.id) {
      case 'tang':
        Mx.Body.setVelocity(b, { x: v.x * A.burstMult, y: v.y * A.burstMult });
        game.fx.bubbles(b.position.x, b.position.y, 10); game.sfx.play('burst');
        break;
      case 'flyingfish':
        r.gliding = true; r.sprite.setIgnoreGravity(true); b.ttWater.ignoreDrag = true;
        game.time.delayedCall(A.glideTime * 1000, function () { if (r.alive) { r.gliding = false; r.sprite.setIgnoreGravity(false); b.ttWater.ignoreDrag = false; } });
        game.sfx.play('whoosh');
        break;
      case 'puffer':
        var steps = 6, m0p = b.mass;
        var roundKey = TT.Art.speciesKey(game, 'puffer_inflated');
        var roundS = (r.radius * 2.3) / game.textures.get(roundKey).getSourceImage().width;
        r.sprite.setTexture(roundKey);
        r.sprite.setScale(roundS);                                   // Phaser also scales the body...
        Mx.Body.scale(b, r.baseScale / roundS, r.baseScale / roundS); // ...so undo that: body radius unchanged
        Mx.Body.setMass(b, m0p);
        for (var i = 1; i <= steps; i++) (function (i) {
          game.time.delayedCall(i * 25, function () {
            if (!r.alive) return;
            r.sprite.setScale(roundS * (1 + (A.inflateScale - 1) * i / steps)); // grows body with sprite
            Mx.Body.setMass(b, m0p * 1.5);
          });
        })(i);
        r.inflated = true;
        game.radialPush(b.position.x, b.position.y, A.inflateRadius, A.inflateForce, r);
        game.lionfishNear(b.position.x, b.position.y, A.inflateRadius, true);
        game.fx.ring(b.position.x, b.position.y, A.inflateRadius, 0xf2e6b8); game.sfx.play('puff');
        break;
      case 'pistolshrimp':
        if (!game.water.isUnder(b.position.y)) { game.flash(b.position.x, b.position.y, 'Fizzle: snaps only work underwater'); game.fx.bubbles(b.position.x, b.position.y, 3); break; }
        game.snap(b.position.x, b.position.y, A.snapRadius, r); game.sfx.play('snap');
        break;
      case 'loggerhead':
        r.diving = true; var m0 = b.mass; Mx.Body.setMass(b, m0 * A.diveMassMult);
        var t0 = game.time.now;
        r.diveUntil = t0 + A.diveTime * 1000;
        game.time.delayedCall(A.diveTime * 1000 + 600, function () { if (r.alive) { r.diving = false; Mx.Body.setMass(b, m0); } });
        game.fx.bubbles(b.position.x, b.position.y, 12); game.sfx.play('whoosh');
        break;
      case 'swordfish':
        var sp = Math.max(speed, 8) * A.pierceSpeedMult;
        r.piercing = true; r.pierceVel = { x: Math.cos(ang) * sp, y: Math.sin(ang) * sp };
        r.sprite.setIgnoreGravity(true); b.ttWater.ignoreDrag = true;
        Mx.Body.setVelocity(b, r.pierceVel);
        game.time.delayedCall(A.pierceTime * 1000, function () { if (r.alive) { r.piercing = false; r.sprite.setIgnoreGravity(false); b.ttWater.ignoreDrag = false; } });
        game.sfx.play('whoosh');
        break;
      case 'hammerhead':
        var dir = v.x >= 0 ? 1 : -1, hs = Math.max(speed, 8) * A.ramSpeedMult;
        Mx.Body.setVelocity(b, { x: dir * hs, y: v.y * 0.2 });
        r.ramming = true;
        game.time.delayedCall(A.ramTime * 1000, function () { r.ramming = false; });
        game.fx.bubbles(b.position.x, b.position.y, 8); game.sfx.play('burst');
        break;
    }
    return true;
  }

  return { rescuer: rescuer, junk: junk, container: container, coral: coral, lionfish: lionfish, staticBody: staticBody,
    impact: impact, damage: damage, ability: ability, drawLine: drawLine };
})();

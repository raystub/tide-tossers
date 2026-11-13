// In-page test bot for the swim game: picks a rescuer, swims around scenery to each net/trap, uses abilities,
// then heads for the exit. Drives the game through game.botInput and the player's public methods.
window.__bot = function (maxGameSeconds, opts) {
  opts = opts || {};
  return new Promise(function (resolve) {
    var G = window.__TT_GAME, C = TT.CFG, P = G.player, log = [], retreatUntil = 0, leapState = null, lastSwap = -9, breathing = false, stuckFor = 0, watch = { c: null };
    var dist = function (a, b) { return Math.hypot(a.x - b.x, a.y - b.y); };
    var has = function (id) { return P.team.findIndex(function (m) { return m.id === id; }); };
    function use(id) { var i = has(id); if (i >= 0 && P.index !== i && G.clock - lastSwap > 1) { if (P.swap(i)) { lastSwap = G.clock; log.push(G.clock.toFixed(1) + ' swap ' + id); } } return i >= 0 && P.index === i; }
    function segHits(p, q, b, pad) {
      for (var i = 0; i <= 24; i++) { var x = p.x + (q.x - p.x) * i / 24, y = p.y + (q.y - p.y) * i / 24;
        if (x > b.min.x - pad && x < b.max.x + pad && y > b.min.y - pad && y < b.max.y + pad) return true; }
      return false;
    }
    function fullWall(b) { return b.min.y < G.water.y - 20 && b.max.y > C.FLOOR_Y - 30; }
    function waypoint(pos, T) {
      var best = null;
      var obst = G.statics.concat(G.corals);
      for (var i = 0; i < obst.length; i++) {
        var b = obst[i].body.bounds;
        if (!segHits(pos, T, b, 34)) continue;
        if (b.max.x - b.min.x > 1500) continue;            // cave roof
        var d = Math.abs((b.min.x + b.max.x) / 2 - pos.x);
        if (!best || d < best.d) best = { d: d, b: b };
      }
      if (!best) return T;
      var b2 = best.b, dirT = T.x >= pos.x ? 1 : -1;
      if (fullWall(b2)) return { wall: b2 };
      var overY = b2.min.y - 60, underY = b2.max.y + 55;
      var canOver = overY > G.water.y + 30, canUnder = underY < C.FLOOR_Y - 25;
      var y = canOver && (!canUnder || Math.abs(pos.y - overY) < Math.abs(pos.y - underY)) ? overY : canUnder ? underY : overY;
      var nearX = dirT > 0 ? b2.min.x - 75 : b2.max.x + 75, farX = dirT > 0 ? b2.max.x + 90 : b2.min.x - 90;
      // get level with the gap beside the obstacle first, then cross to the far side
      if (Math.abs(pos.y - y) > 34 && (pos.x - nearX) * dirT > -20 && (pos.x - nearX) * dirT < 60) return { x: nearX, y: y };
      if (Math.abs(pos.y - y) > 34 && (pos.x - nearX) * dirT <= -20) return { x: nearX, y: y };
      return { x: farX, y: y };
    }
    function pick() {
      var pos = P.pos(), cs = G.containers.filter(function (c) { return c.alive && !(c.botSkip > G.clock); }).sort(function (a, b) { return G.arcade ? dist(a.sprite, pos) - dist(b.sprite, pos) : a.sprite.x - b.sprite.x; });
      if (cs.length) {
        var c = cs[0], cp = { x: c.sprite.x, y: c.sprite.y };
        // watchdog: no damage to this target for a while -> try a different one for a few seconds
        if (watch.c !== c || c.hp < watch.hp) { watch = { c: c, hp: c.hp, t: G.clock }; }
        else if (G.clock - watch.t > 9 && cs.length > 1) { c.botSkip = G.clock + 6; log.push(G.clock.toFixed(1) + ' skip ' + c.ctype + '@' + Math.round(cp.x)); watch = { c: null }; }
        var lion = G.invasives.find(function (l) { return l.alive && dist(l.sprite, cp) < 260; });
        if (lion && has('puffer') >= 0) return { x: lion.sprite.x, y: lion.sprite.y, kind: 'lionfish', who: 'puffer', range: 120 };
        var conc = G.objects.find(function (o) { return o.alive && o.material === 'concrete' && dist(o.body.position, cp) < 110; });
        if (conc && has('hammerhead') >= 0) return { x: conc.body.position.x, y: conc.body.position.y, kind: 'concrete', who: 'hammerhead', range: 260, r: 40 };
        if (conc && has('bullhead') >= 0) return { x: conc.body.position.x, y: conc.body.position.y, kind: 'concrete', who: 'bullhead', range: 100, r: 40 };
        var brittle = G.objects.filter(function (o) { return o.alive && (o.material === 'glass' || o.material === 'plastic') && dist(o.body.position, cp) < 150; });
        if (brittle.length >= 2 && has('pistolshrimp') >= 0) return { x: cp.x, y: cp.y - 30, kind: 'brittle', who: 'pistolshrimp', range: 120 };
        var who = c.ctype === 'trap' ? (has('loggerhead') >= 0 ? 'loggerhead' : has('hammerhead') >= 0 ? 'hammerhead' : 'tang') : (has('swordfish') >= 0 ? 'swordfish' : 'tang');
        if (has('sheepshead') >= 0 && c.ctype !== 'line') who = 'sheepshead';
        if (c.ctype === 'trap' && has('bullhead') >= 0 && has('loggerhead') < 0 && has('hammerhead') < 0) who = 'bullhead';
        if (has(who) < 0 || (who === 'tang' && has('tang') < 0)) who = ['sealion', 'penguin', 'swordfish', 'hammerhead', 'bullhead', 'iguana'].find(function (k) { return has(k) >= 0; }) || P.team[0].id;
        if (c.ctype === 'net' && c.stagesLeft > 1 && has('swordfish') >= 0) who = 'swordfish';
        if (has(who) < 0) who = P.team[0].id === 'pistolshrimp' || P.team[0].id === 'puffer' ? (has('tang') >= 0 ? 'tang' : P.team[0].id) : P.team[0].id;
        var ty = c.ctype === 'line' ? Math.min(C.FLOOR_Y - 60, Math.max(G.water.y + 60, pos.y)) : cp.y;
        var close = who === 'sheepshead' || who === 'bullhead' || who === 'iguana';
        return { x: cp.x, y: ty, kind: c.ctype, who: who, range: close ? Math.max(c.w, c.h) / 2 + 70 : 250, r: Math.max(c.w, c.h) / 2 };
      }
      if (!opts.noClean) {
        // only junk on this side of any full-height wall (the bot crosses walls left to right only)
        var walled = function (o) { return G.statics.some(function (st) { var b = st.body.bounds; return fullWall(b) && (b.min.x - pos.x) * (b.min.x - o.body.position.x) < 0; }); };
        var os = G.objects.filter(function (o) { return o.alive && !walled(o); }).sort(function (a, b) { return dist(a.body.position, pos) - dist(b.body.position, pos); });
        if (os.length) { var o = os[0], w2 = o.material === 'concrete' && has('hammerhead') >= 0 ? 'hammerhead' : (o.material === 'glass' || o.material === 'plastic') && has('pistolshrimp') >= 0 ? 'pistolshrimp' : has('tang') >= 0 ? 'tang' : (['sealion', 'penguin', 'swordfish', 'hammerhead', 'bullhead', 'sheepshead'].find(function (k) { return has(k) >= 0; }) || P.team[0].id);
          return { x: o.body.position.x, y: Math.max(G.water.y + 26, o.body.position.y), kind: 'junk', who: w2, range: w2 === 'pistolshrimp' ? 110 : (w2 === 'bullhead' || w2 === 'sheepshead' || w2 === 'iguana') ? Math.max(o.w, o.h) / 2 + 60 : 220, r: Math.max(o.w, o.h) / 2 }; }
      }
      return { x: G.exit.x, y: G.exit.y, kind: 'exit', who: P.id(), range: 0 };
    }
    var timer = setInterval(function () {
      if (!window.__TT_GAME || G !== window.__TT_GAME) { clearInterval(timer); resolve({ error: 'scene changed' }); return; }
      if (G.state === 'done' || G.clock > maxGameSeconds) {
        clearInterval(timer); G.botInput = null;
        var wait = setInterval(function () { if (G.result || G.clock > maxGameSeconds) { clearInterval(wait);
          resolve({ result: G.result, wave: G.wave, clock: +G.clock.toFixed(1), health: Math.round(G.health), freed: G.freed, total: G.totalAnimals, timeLeft: Math.round(G.timeLeft), stings: G.stings, log: log.slice(-12) }); } }, 100);
        return;
      }
      var pos = P.pos(), T = pick(), under = G.water.isUnder(pos.y), inp = { x: 0, y: 0, push: 1 };
      // air-breathers come up for a breath when the ring runs low
      var mem = P.member();
      if (mem.airMax) {
        if (mem.air / mem.airMax < 0.3) breathing = true;
        if (breathing && mem.air / mem.airMax > 0.95) breathing = false;
        if (breathing) { var ba = Math.atan2(G.water.y - 10 - pos.y, (T.x > pos.x ? 60 : -60)); G.botInput = { x: Math.cos(ba), y: Math.sin(ba), push: 1 }; return; }
      } else breathing = false;
      if (G.puzzle && T.kind !== 'exit') T.range = Math.min(T.range, (T.r || 30) + (T.kind === 'lionfish' || T.kind === 'brittle' ? 60 : 75));
      if (leapState) {
        // crossing a wall with the flying fish: aim up-forward, leap, hold forward while gliding
        var wb = leapState.wall;
        if (pos.x > wb.max.x + 40 && under) leapState = null;
        else if (!leapState.leapt) {
          var sx = wb.min.x - 190, sy = G.water.y + 46;
          if (dist(pos, { x: sx, y: sy }) > 30) { var a0 = Math.atan2(sy - pos.y, sx - pos.x); inp.x = Math.cos(a0); inp.y = Math.sin(a0); }
          else { inp.x = 0.8; inp.y = -0.6; G.botInput = inp; if (P.ready() && P.useAbility()) { leapState.leapt = true; leapState.t = G.clock; log.push(G.clock.toFixed(1) + ' leap'); } return; }
        } else { inp.x = 1; inp.y = -0.15; if (G.clock - leapState.t > 3 && under && pos.x < wb.min.x) leapState.leapt = false; }
        G.botInput = inp; return;
      }
      use(T.who);
      var wp = waypoint(pos, T);
      if (wp.wall) { if (use('flyingfish')) leapState = { wall: wp.wall, leapt: false }; G.botInput = { x: 0, y: 0, push: 0 }; return; }
      var d = dist(pos, T), ang = Math.atan2(wp.y - pos.y, wp.x - pos.x);
      if (G.clock < retreatUntil) ang += Math.PI;
      inp.x = Math.cos(ang); inp.y = Math.sin(ang);
      G.botInput = inp;
      // wedged against something (usually a net in the way): use the ability to break through
      if (TT.speed(P.ent.body) < 0.3 && under) { stuckFor += 0.016 * (TT.DEBUG_SPEED || 1); if (stuckFor > 1.2 && P.ready() && !G.puzzle) { P.useAbility(); stuckFor = 0; log.push(G.clock.toFixed(1) + ' unstick'); } } else stuckFor = 0;
      if (T.kind !== 'exit' && wp === T) {
        if (d < T.range && P.ready() && G.clock >= retreatUntil) { if (P.useAbility()) log.push(G.clock.toFixed(1) + ' ' + P.id() + ' ability -> ' + T.kind); }
        else if (d < (T.r || 30) + 45 && !P.ready() && G.clock >= retreatUntil && TT.speed(P.ent.body) < 2.5) retreatUntil = G.clock + 0.45;
      }
    }, 16);
  });
};

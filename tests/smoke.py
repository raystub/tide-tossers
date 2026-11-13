"""Smoke test: python3 tests/smoke.py
Loads the title, opens every level, swims and uses the ability, and fails on any console error."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import Game

g = Game(); pg = g.page; ok = True
try:
    for lid in g.all_ids():
        g.start(lid); pg.wait_for_timeout(1200)
        x0 = pg.evaluate('__TT_GAME.player.pos().x')
        pg.evaluate('__TT_GAME.botInput = { x: 1, y: 0.2, push: 1 }'); pg.wait_for_timeout(1200)
        used = pg.evaluate('__TT_GAME.player.useAbility()'); pg.wait_for_timeout(500)
        x1 = pg.evaluate('__TT_GAME.player.pos().x')
        good = x1 - x0 > 150 and used
        ok = ok and good
        print(lid, 'ok' if good else 'FAIL', 'swam', round(x1 - x0), 'px, ability', used)
finally:
    print('console errors:', g.errors[:8]); g.close()
sys.exit(0 if ok and not g.errors else 1)

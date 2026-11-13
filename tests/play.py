"""Bot play-through: python3 tests/play.py [level ...]  (env DIFF=current, SPEED=3, CLEAN=1).
Prints win/lose, stars, reef health and time for each level, and saves start/end screenshots to tests/out/."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import Game, ROOT

DIFF = os.environ.get('DIFF', 'current'); SPEED = float(os.environ.get('SPEED', '3'))
OUT = os.path.join(ROOT, 'tests', 'out'); os.makedirs(OUT, exist_ok=True)
g = Game(); pg = g.page; ok = True
try:
    pg.add_script_tag(path=os.path.join(ROOT, 'tests', 'bot.js'))
    levels = sys.argv[1:] or g.all_ids()
    for lid in levels:
        g.start(lid, DIFF); pg.evaluate(f'TT.DEBUG_SPEED = {SPEED}')
        pg.wait_for_timeout(300); g.shot(f'{OUT}/{lid}_start.png')
        if lid == 'arcade':
            # Arcade never ends in a win: pass if the bot clears at least three waves.
            r = pg.evaluate('__bot(150, { noClean: true })')
            pg.wait_for_timeout(400); g.shot(f'{OUT}/{lid}_end.png')
            res = r.get('result') or {}
            cleared = res.get('cleared') if res else (r.get('wave') or 1) - 1   # still going when the bot stopped
            good = cleared >= 3
            ok = ok and good
            print(lid, 'PASS' if good else 'FAIL', 'waves cleared', cleared, 'freed', r.get('freed'), 'clock', r.get('clock'))
            if os.environ.get('LOG'): print('   ', r.get('log'))
            continue
        r = pg.evaluate('__bot(240, { noClean: %s })' % ('false' if os.environ.get('CLEAN', '1') == '1' else 'true'))
        pg.wait_for_timeout(400); g.shot(f'{OUT}/{lid}_end.png')
        res = r.get('result') or {}
        ok = ok and bool(res.get('win'))
        print(lid, 'WIN ' if res.get('win') else 'LOSE', 'stars', res.get('stars'), 'health', r.get('health'), 'freed', r.get('freed'), '/', r.get('total'),
              'clock', r.get('clock'), 'left', r.get('timeLeft'), 'stings', r.get('stings'), 'how', res.get('how'), 'moves', res.get('moves'))
        if os.environ.get('LOG'): print('   ', r.get('log'))
finally:
    print('errors:', g.errors[:8]); g.close()
sys.exit(0 if ok and not g.errors else 1)

"""Shared test helpers: serve the game folder and open it in headless Chromium (Canvas renderer for speed)."""
import functools, http.server, os, socketserver, threading
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

def serve(root=ROOT):
    srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=root))
    srv.daemon_threads = True
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, srv.server_address[1]

class Game:
    def __init__(self, mobile=False, query='canvas=1', size=None):
        self.srv, self.port = serve()
        self.pw = sync_playwright().start()
        self.browser = self.pw.chromium.launch(args=['--disable-gpu'])
        size = size or ({'width': 844, 'height': 390} if mobile else {'width': 1280, 'height': 720})
        self.ctx = self.browser.new_context(viewport=size, is_mobile=mobile, has_touch=mobile)
        self.page = self.ctx.new_page(); self.page.set_default_timeout(30000)
        self.errors = []
        self.page.on('pageerror', lambda e: self.errors.append(str(e)))
        self.page.on('console', lambda m: self.errors.append(m.text) if m.type == 'error' else None)
        self.page.goto(f'http://127.0.0.1:{self.port}/index.html?{query}')
        self.page.wait_for_function('window.TT && TT.game && TT.game.scene.isActive("Title")')
    def start(self, level, difficulty='current', skip_tutorial=True, mode=None):
        mode = mode or ('arcade' if level == 'arcade' else 'puzzle' if level.startswith('P') else 'campaign')
        pg = self.page
        if skip_tutorial: pg.evaluate('["swim","ability","swap"].forEach(k => TT.Save.markTut(k))')
        pg.evaluate(f'TT.Save.setDifficulty("{difficulty}")')
        pg.evaluate('''(id) => { const g = TT.game; g.scene.getScenes(true).forEach(s => g.scene.stop(s.scene.key)); window.__TT_GAME = null; g.scene.start('Game', { levelId: id, mode: '%s' }); }''' % mode, level)
        pg.wait_for_function('window.__TT_GAME && __TT_GAME.level && __TT_GAME.level.id === "%s" && __TT_GAME.player && TT.game.scene.isActive("UI")' % level)
    def all_ids(self):
        return self.page.evaluate('TT.LEVELS.map(l => l.id).concat(TT.PUZZLES.map(p => p.id))') + ['arcade']
    def shot(self, path): self.page.screenshot(path=path, animations='disabled')
    def close(self):
        self.browser.close(); self.pw.stop(); self.srv.shutdown(); self.srv.server_close()

// Tide Tossers v0.2 — Phaser game config.
window.TT = window.TT || {};

window.addEventListener('load', function () {
  TT.game = new Phaser.Game({
    type: /[?&]canvas=1/.test(location.search) ? Phaser.CANVAS : Phaser.AUTO,
    parent: 'game',
    width: TT.CFG.WIDTH,
    height: TT.CFG.HEIGHT,
    backgroundColor: '#05202c',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    input: { activePointers: 2 },
    physics: {
      default: 'matter',
      matter: {
        gravity: { y: TT.CFG.GRAVITY_Y },
        runner: { isFixed: true, fps: 60 },
        positionIterations: 8, velocityIterations: 6,
        enableSleeping: false,
        debug: /[?&]debug=1/.test(location.search)
      }
    },
    scene: [TT.BootScene, TT.TitleScene, TT.LevelSelectScene, TT.GameScene, TT.UIScene, TT.FieldGuideScene]
  });
});

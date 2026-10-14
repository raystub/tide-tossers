// Tide Tossers v0.2 — every tuning number lives here.
// Units: positions in px, velocities in px per physics step (60 steps/s), times in seconds.
window.TT = window.TT || {};

// Phones and tablets (coarse pointer) get bigger HUD text/buttons, looser tap detection and a lighter effects budget.
// Force it on a desktop with ?mobile=1 to preview the phone layout.
TT.MOBILE = /[?&]mobile=1/.test(location.search) ||
  (!!window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
// Installed to the home screen (already full screen, no browser bars).
TT.INSTALLED = !!window.navigator.standalone ||
  (!!window.matchMedia && window.matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches);

TT.CFG = {
  WIDTH: 1280,
  HEIGHT: 720,
  FLOOR_Y: 680,              // top of the sea floor / ground

  // ---- Physics ----
  GRAVITY_Y: 1.0,            // Matter gravity (scale 0.001) -> ~0.278 px/step^2
  STEP_ACCEL: 0.2778,        // gravity accel per step, used by the aim-guide simulation
  RESCUER_AIR_FRICTION: 0.002,

  // ---- Launch ----
  SLING_MAX_PULL: 160,       // px
  LAUNCH_SPEED_MAX: 23,      // px/step at full pull
  SLING_GRAB_RADIUS: 140,    // how close to the pouch a press must start

  // ---- Water feel ----
  BUOYANCY_SCALE: 1.0,       // 1.0 = neutral body exactly cancels gravity when fully submerged
  BUOYANCY: { floats: 1.3, neutral: 1.0, sinks: 0.6, darts: 1.0 },
  WATER_DRAG: 0.04,          // fraction of velocity lost per step underwater
  WATER_ANGULAR_DRAG: 0.06,
  DARTER_DRAG_FACTOR: 0.5,   // darters feel half the drag
  SKIP_MAX_ANGLE: 18,        // degrees below horizontal for a surface skip
  SKIP_MIN_SPEED: 9,         // px/step
  SKIP_BOUNCE: 0.55,         // vy kept (reversed) on a skip
  SKIP_VX_KEEP: 0.9,
  MAX_SKIPS: 2,
  REFRACT_VX: 0.7,           // vx kept when entering the water steeply
  HEAVY_SPLASH_RADIUS: 120,
  HEAVY_SPLASH_FORCE: 0.025,
  SEDIMENT_MIN_SPEED: 5,     // heavy body hitting the floor faster than this raises silt

  // ---- Steering ----
  STEER_BASE_STAMINA: 1.5,   // seconds of steering for a Normal rescuer on Current
  STEER_STAT: { low: 0.5, normal: 1.0, high: 1.5, double: 2.0, glide: 1.0 },
  STEER_TURN_WATER: 150,     // max turn rate underwater, degrees/second
  STEER_TURN_AIR: 35,        // max turn rate in the air, degrees/second
  STEER_THRUST_WATER: 0.45,  // px/step added per step while steering underwater (swimming)
  STEER_MAX_SWIM_SPEED: 11,  // swimming thrust stops adding speed above this
  TAP_MAX_MS: 180,          // desktop: a press shorter than this (ms) is a tap = ability
  TAP_MAX_MOVE: 10,         // desktop: ...and moving less than this (game px)
  TAP_MAX_MS_TOUCH: 260,    // fingers are slower and wobblier
  TAP_MAX_MOVE_TOUCH: 24,

  // ---- Damage ----
  DAMAGE_SCALE: 1.25,
  MIN_DAMAGE_SPEED: 2.2,     // impacts slower than this do nothing
  STATIC_MASS_CAP: 8,        // mass used for static bodies (floor, rocks) in damage math
  MASS_CAP: 40,
  NET_MIN_SPEED: 5,          // nets ignore softer hits
  CORAL_DAMAGE_SPEED: 4,
  CORAL_PENALTY: 5,          // reef health % lost per coral hit
  CORAL_COOLDOWN: 1.0,       // seconds between penalties per coral
  LIONFISH_FLEE_SPEED: 4,    // junk hitting a lionfish faster than this drives it off

  // ---- Shot / level flow ----
  SHOT_SETTLE_SPEED: 0.3,
  SHOT_MAX_TIME: 8,
  WORLD_SETTLE_SPEED: 0.2,
  WORLD_SETTLE_TIME: 1.5,
  WORLD_SETTLE_MAX: 6,
  TIDE_TWEEN_MS: 1500,
  WIN_DELAY_MS: 1400,

  // ---- Reef health / stars ----
  STAR2_HEALTH: 70,
  STAR3_HEALTH: 90,
  SATURATION_AT_START: -0.22, // colour matrix saturation at the level's starting health
  SATURATION_FULL_AT: 90,    // health at which full colour is restored

  // ---- Score ----
  SCORE: { animal: 1500, object: 120, invasive: 800, unusedRescuer: 2000, coralHit: -300 },

  // ---- Darkness ----
  DARK_ALPHA: 0.84,
  GLOW_SPOT_RADIUS: 95,
  RESCUER_LIGHT_RADIUS: 70,

  // ---- Materials (threats you break) ----
  MATERIALS: {
    plastic:  { name: 'Plastic',  density: 0.0012, buoy: 'floats',  hp: 30,  score: 80 },
    glass:    { name: 'Glass',    density: 0.002,  buoy: 'neutral', hp: 25,  score: 80 },
    wood:     { name: 'Wood',     density: 0.002,  buoy: 'floats',  hp: 60,  score: 100 },
    tin:      { name: 'Metal',    density: 0.004,  buoy: 'sinks',   hp: 120, score: 150 },
    concrete: { name: 'Concrete', density: 0.006,  buoy: 'sinks',   hp: 220, score: 250 }
  },
  CONTAINERS: {
    net:  { hp: 75, minSpeed: 5 },
    line: { hp: 40,  minSpeed: 3 },
    trap: { hp: 80, density: 0.003, buoy: 'sinks' }
  },

  // ---- Rescuers ----
  // radius in px; density sets mass; steer = key in STEER_STAT
  RESCUERS: {
    tang:         { name: 'Atlantic blue tang',    radius: 20, density: 0.004,  buoy: 'neutral', steer: 'normal' },
    flyingfish:   { name: 'Flying fish',           radius: 18, density: 0.0035, buoy: 'floats',  steer: 'glide', nick: 'Finny',
                    bonusVs: { plastic: 2, glass: 2 } },
    puffer:       { name: 'Pufferfish',            radius: 20, density: 0.0035, buoy: 'floats',  steer: 'low',    nick: 'Puff' },
    pistolshrimp: { name: 'Pistol shrimp',         radius: 16, density: 0.005,  buoy: 'sinks',   steer: 'normal' },
    loggerhead:   { name: 'Loggerhead sea turtle', radius: 26, density: 0.006,  buoy: 'sinks',   steer: 'low' },
    swordfish:    { name: 'Swordfish',             radius: 19, density: 0.005,  buoy: 'darts',   steer: 'normal', nick: 'Spike' },
    hammerhead:   { name: 'Scalloped hammerhead',  radius: 24, density: 0.006,  buoy: 'darts',   steer: 'normal',
                    bonusVs: { concrete: 1.5 } }
  },

  // ---- Abilities ----
  ABILITY: {
    burstMult: 1.6,
    glideTime: 1.0,
    inflateScale: 3, inflateRadius: 160, inflateForce: 0.06,
    snapRadius: 140, snapDamageBrittle: 110, snapDamageOther: 18,
    diveTime: 0.6, diveForce: 0.0035, diveMassMult: 2,
    pierceSpeedMult: 1.8, pierceTime: 0.6,
    ramSpeedMult: 1.5, ramTime: 0.8, ramVsConcrete: 3
  },

  // ---- Difficulty ----
  DIFFICULTY: {
    splash:  { name: 'Splash',  guide: 1.0,  extraRescuers: 2,  hp: 0.75, stamina: 1.5,  mult: 1.0 },
    current: { name: 'Current', guide: 0.5,  extraRescuers: 0,  hp: 1.0,  stamina: 1.0,  mult: 1.25 },
    riptide: { name: 'Riptide', guide: 0.15, extraRescuers: -1, hp: 1.25, stamina: 0.75, mult: 1.5 },
    abyss:   { name: 'Abyss',   guide: 0,    extraRescuers: -1, hp: 1.5,  stamina: 0.5,  mult: 2.0 }
  },
  DIFFICULTY_ORDER: ['splash', 'current', 'riptide', 'abyss'],
  GUIDE_STEPS: 120,

  // ---- Gadgets ----
  GADGETS: {
    sonar: { name: 'Sonar Scope', desc: 'Full aim guide for your next shot' },
    kelp:  { name: 'Extra Kelp',  desc: '+25% launch power for your next shot', power: 1.25 },
    glow:  { name: 'Glow Lure',   desc: 'Lights up a dark level', darkOnly: true },
    netcutter: { name: 'Net Cutter', desc: 'Tap a net or fishing line to remove it' }
  },
  GADGET_START_COUNT: 3,

  // ---- Phone feel ----
  SLOWMO_SCALE: 0.4,         // physics speed while you steer (1 = normal); makes steering easier on small screens
  SLOWMO_EASE: 12,           // how fast time slows/speeds back up (higher = snappier)
  SLOWMO_VIGNETTE: 0.55,     // darkness of the screen edges during slow-motion
  SWIPE_DEADZONE: 12,        // swipe steering: finger must move this far (game px) before it turns the rescuer
  SWIPE_STICK_RADIUS: 60,    // size of the on-screen steering stick
  AIM_ZONE: 0.5,             // aim from anywhere in the left half of the screen
  LONG_PRESS_MS: 450,        // hold this long on something to see what it is
  VIEW_MAX_WIDTH: 1600       // widest view on long phones (height stays 720)
};

// Fill the screen: keep the height at 720 and widen the view to match the device's shape
// (landscape assumed on phones, so a portrait start still gets the right width after rotating).
(function () {
  var w = window.innerWidth || 1280, h = window.innerHeight || 720;
  var aspect = TT.MOBILE ? Math.max(w, h) / Math.max(1, Math.min(w, h)) : w / Math.max(1, h);
  var width = Math.round(TT.CFG.HEIGHT * aspect / 2) * 2;
  TT.CFG.WIDTH = Math.max(1280, Math.min(TT.CFG.VIEW_MAX_WIDTH, width));
})();

// Velocity in "base" units (px per 1/60 s), independent of slow-motion. Matter's body.velocity is per physics
// update, which shrinks during slow-motion, so always read velocity through this when feeding it back into
// setVelocity or using it for damage/thresholds.
TT.vel = function (body) { return Phaser.Physics.Matter.Matter.Body.getVelocity(body); };
TT.speed = function (body) { var v = TT.vel(body); return Math.sqrt(v.x * v.x + v.y * v.y); };

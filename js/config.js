// Tide Tossers v0.5 — every tuning number lives here.
// Units: positions in px, velocities in px per 1/60 s (independent of the physics rate), times in seconds.
window.TT = window.TT || {};

TT.VERSION = 'v0.5.1';

// Phones and tablets (coarse pointer) get the touch controls, bigger HUD and a closer camera.
// Force it on a desktop with ?mobile=1 to preview the phone layout.
TT.MOBILE = /[?&]mobile=1/.test(location.search) ||
  (!!window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
// Installed to the home screen (already full screen, no browser bars).
TT.NATIVE = !!window.Capacitor;   // running inside the Android app shell
TT.INSTALLED = TT.NATIVE || !!window.navigator.standalone ||
  (!!window.matchMedia && window.matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches);

TT.CFG = {
  WIDTH: 1280,               // view width (widened to fit the screen below)
  HEIGHT: 720,               // view height and world height
  FLOOR_Y: 680,              // top of the sea floor
  VIEW_MAX_WIDTH: 1600,      // widest view on long phones
  CAMERA_ZOOM: TT.MOBILE ? 1.45 : 1.15, // closer camera = bigger creatures
  CAMERA_LERP: 0.1,
  CAMERA_LOOKAHEAD: 14,      // px of look-ahead per unit of swim speed

  // ---- Physics ----
  PHYSICS_HZ: 120,           // fixed physics rate, independent of the screen's refresh rate
  MAX_STEPS_PER_FRAME: 6,
  GRAVITY_Y: 1.0,            // Matter gravity (scale 0.001)

  // ---- Water ----
  BUOYANCY_SCALE: 1.0,       // 1.0 = neutral body exactly cancels gravity when fully submerged
  BUOYANCY: { floats: 1.3, neutral: 1.0, sinks: 0.6 },
  WATER_DRAG: 0.05,          // fraction of velocity lost per 1/60 s underwater (junk and traps)
  WATER_ANGULAR_DRAG: 0.07,
  SEDIMENT_MIN_SPEED: 5,     // heavy body hitting the floor faster than this raises silt
  TIDE_PERIOD: 16,           // seconds for the waterline to rise and fall once on tide levels

  // ---- Swimming ----
  SWIM_IDLE_DRAG: 0.045,     // how quickly you coast to a stop with the stick released
  SWIM_AIR_CONTROL: 0.05,    // sideways push per 1/60 s while airborne
  BREACH_MAX_SPEED: 7.5,     // top speed when a creature leaves the water (dashes don't fling it skyward)
  LEAP_EXIT_MAX: 11,         // the flying fish's leap is allowed a bit more, so it can clear walls
  FLOP_HOP: 5.5,             // hop speed when stranded out of the water
  SWIM_TURN_EASE: 12,        // how fast the sprite turns to face its heading
  STUN_TIME: 0.9,            // seconds without control after a lionfish sting
  STING_TIME_PENALTY: 5,     // seconds of tide lost per sting
  SWAP_COOLDOWN: 0.8,

  // ---- Controls ----
  STICK_ZONE: 0.5,           // touches left of this share of the screen move the stick; right side = ability
  STICK_RADIUS: 58,          // screen px, so the stick is thumb-sized on any phone
  STICK_DEADZONE: 7,
  STICK_SMOOTH: 16,          // filters thumb jitter (higher = more direct)
  STICK_MIN_PUSH: 0.3,       // a light push still swims at this share of full speed
  MOUSE_FULL_DIST: 140,      // desktop: pointer this far from the creature = full speed
  STEER_ASSIST_ANGLE: 16,    // heading within this many degrees of a nearby net or trap...
  STEER_ASSIST_RANGE: 260,   // ...this close...
  STEER_ASSIST_STRENGTH: 0.4, // ...is bent this much of the way onto it (0 = off)

  // ---- Damage ----
  DAMAGE_SCALE: 1.25,
  MIN_DAMAGE_SPEED: 2.2,     // impacts slower than this do nothing
  STATIC_MASS_CAP: 8,
  MASS_CAP: 40,
  CORAL_DAMAGE_SPEED: 8.5,   // only dashes and thrown junk hurt coral; gentle bumps don't
  CORAL_PENALTY: 5,          // reef health % lost per coral hit
  CORAL_COOLDOWN: 1.0,
  LIONFISH_FLEE_SPEED: 4,    // junk hitting a lionfish faster than this drives it off

  // ---- Level flow ----
  RESCUE_TIME_BONUS: 6,      // seconds of tide won back per animal freed
  COMBO_WINDOW: 4,           // seconds between rescues/breaks to keep a chain going
  COMBO_MAX: 5,
  EXIT_RADIUS: 70,
  WIN_DELAY_MS: 1300,
  LOW_TIME: 15,              // tide gauge turns red below this many seconds

  // ---- Reef health / stars ----
  STAR2_HEALTH: 70,
  STAR3_HEALTH: 90,
  SATURATION_AT_START: -0.22,
  SATURATION_FULL_AT: 90,

  // ---- Score ----
  SCORE: { animal: 1500, object: 120, invasive: 800, coralHit: -300, second: 20, sting: -200 },

  // ---- Darkness ----
  DARK_ALPHA: 0.86,
  GLOW_SPOT_RADIUS: 110,
  RESCUER_LIGHT_RADIUS: 150,

  // ---- Materials (junk you break) ----
  MATERIALS: {
    plastic:  { name: 'Plastic',  density: 0.0012, buoy: 'floats',  hp: 30,  score: 80 },
    glass:    { name: 'Glass',    density: 0.002,  buoy: 'neutral', hp: 25,  score: 80 },
    wood:     { name: 'Wood',     density: 0.002,  buoy: 'floats',  hp: 70,  score: 100 },
    tin:      { name: 'Metal',    density: 0.004,  buoy: 'sinks',   hp: 130, score: 150 },
    concrete: { name: 'Concrete', density: 0.006,  buoy: 'sinks',   hp: 400, score: 250 }
  },
  CONTAINERS: {
    net:  { hp: 110, minSpeed: 4.5 },
    line: { hp: 30,  minSpeed: 2.5 },
    trap: { hp: 170, density: 0.003, buoy: 'sinks' }
  },

  // ---- Rescuers ----
  // radius px; density sets mass; speed = top swim speed; accel = how quickly it reaches the stick's heading (0..1);
  // cd = ability cooldown in seconds.
  RESCUERS: {
    tang:         { name: 'Atlantic blue tang',    radius: 20, density: 0.004,  speed: 6.6, accel: 0.16, cd: 1.3, ability: 'Dash',   len: 3.3 },
    flyingfish:   { name: 'Flying fish',           radius: 18, density: 0.0035, speed: 7.0, accel: 0.16, cd: 2.0, ability: 'Leap',   len: 3.4, nick: 'Finny',
                    bonusVs: { plastic: 2, glass: 2 } },
    puffer:       { name: 'Pufferfish',            radius: 20, density: 0.0035, speed: 5.2, accel: 0.13, cd: 3.5, ability: 'Puff',   len: 3.3, nick: 'Puff' },
    pistolshrimp: { name: 'Pistol shrimp',         radius: 16, density: 0.005,  speed: 5.4, accel: 0.15, cd: 2.4, ability: 'Snap',   len: 3.6 },
    loggerhead:   { name: 'Loggerhead sea turtle', radius: 26, density: 0.006,  speed: 5.0, accel: 0.085, cd: 2.8, ability: 'Shove', len: 3.4 },
    swordfish:    { name: 'Swordfish',             radius: 19, density: 0.005,  speed: 8.0, accel: 0.11, cd: 2.0, ability: 'Pierce', len: 5.6, nick: 'Spike' },
    hammerhead:   { name: 'Scalloped hammerhead',  radius: 24, density: 0.006,  speed: 7.0, accel: 0.10, cd: 2.6, ability: 'Ram',    len: 4.4,
                    bonusVs: { concrete: 1.5 } }
  },

  // ---- Abilities ----
  ABILITY: {
    dashSpeed: 15, dashTime: 0.32,
    leapSpeed: 15.5, leapUp: 0.55, glideTime: 1.3, glideSpeed: 11,
    inflateScale: 2.6, inflateTime: 1.3, inflateRadius: 170, inflateForce: 0.07, inflateDamage: 28,
    snapRadius: 150, snapDamageBrittle: 110, snapDamageOther: 30,
    shoveSpeed: 10.5, shoveTime: 0.7, shoveMassMult: 2,
    pierceSpeed: 18, pierceTime: 0.5,
    ramSpeed: 15, ramTime: 0.55, ramVsConcrete: 3, ramVsContainer: 1.5
  },

  // ---- Difficulty ----
  // time: multiplier on each level's tide time (0 = no time limit). hp: junk and net strength.
  DIFFICULTY: {
    splash:  { name: 'Splash',  time: 0,    hp: 0.75, cd: 0.8, mult: 1.0,  blurb: 'No time limit' },
    current: { name: 'Current', time: 1.0,  hp: 1.0,  cd: 1.0, mult: 1.25, blurb: 'Standard tide' },
    riptide: { name: 'Riptide', time: 0.8,  hp: 1.25, cd: 1.15, mult: 1.5, blurb: 'Faster tide, tougher junk' },
    abyss:   { name: 'Abyss',   time: 0.65, hp: 1.5,  cd: 1.3, mult: 2.0,  blurb: 'Fastest tide, toughest junk' }
  },
  DIFFICULTY_ORDER: ['splash', 'current', 'riptide', 'abyss'],

  // ---- Gadgets (one per level) ----
  GADGETS: {
    bubble:    { name: 'Bubble Shield', desc: 'Blocks the next sting or coral hit' },
    kelp:      { name: 'Extra Kelp',    desc: '+15 seconds of tide and a fresh ability', time: 15 },
    glow:      { name: 'Glow Lure',     desc: 'Lights up a dark level', darkOnly: true },
    netcutter: { name: 'Net Cutter',    desc: 'Cuts the nearest net or fishing line' }
  },
  GADGET_START_COUNT: 3
};

// Fill the screen: keep the height at 720 and widen the view to match the device's shape
// (landscape assumed on phones, so a portrait start still gets the right width after rotating).
(function () {
  var w = window.innerWidth || 1280, h = window.innerHeight || 720;
  var aspect = TT.MOBILE ? Math.max(w, h) / Math.max(1, Math.min(w, h)) : w / Math.max(1, h);
  var width = Math.round(TT.CFG.HEIGHT * aspect / 2) * 2;
  TT.CFG.WIDTH = Math.max(1280, Math.min(TT.CFG.VIEW_MAX_WIDTH, width));
})();

// Velocity in base units (px per 1/60 s), whatever the physics rate. Always read velocity through this
// before feeding it back into setVelocity or using it for damage and thresholds.
TT.vel = function (body) { return Phaser.Physics.Matter.Matter.Body.getVelocity(body); };
TT.speed = function (body) { var v = TT.vel(body); return Math.sqrt(v.x * v.x + v.y * v.y); };
// One physics step as a fraction of 1/60 s. Per-step velocity edits (drag, steering) are scaled by this.
TT.STEP = 60 / TT.CFG.PHYSICS_HZ;

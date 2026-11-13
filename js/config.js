// Tide Tossers v0.5 — every tuning number lives here.
// Units: positions in px, velocities in px per 1/60 s (independent of the physics rate), times in seconds.
window.TT = window.TT || {};

TT.VERSION = 'v0.6.4';

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
  SURGE_PERIOD: 5,           // seconds for a wave surge (currents with surge: true) to push in and pull back

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
  COTS_DRAIN: 0.1,           // reef health % per second eaten by each crown-of-thorns starfish still on the reef
  LIONFISH_HUNT_RANGE: 300,  // Arcade lionfish drift toward a rescuer this close...
  LIONFISH_HUNT_SPEED: 48,   // ...at this many px per second

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
    concrete: { name: 'Concrete', density: 0.006,  buoy: 'sinks',   hp: 400, score: 250 },
    rubble:   { name: 'Coral rubble', density: 0.003, buoy: 'sinks', hp: 120, score: 120 }
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
    loggerhead:   { name: 'Loggerhead sea turtle', radius: 26, density: 0.006,  speed: 5.0, accel: 0.085, cd: 2.8, ability: 'Shove', len: 3.4, air: 45 },
    swordfish:    { name: 'Swordfish',             radius: 19, density: 0.005,  speed: 8.0, accel: 0.11, cd: 2.0, ability: 'Pierce', len: 5.6, nick: 'Spike' },
    hammerhead:   { name: 'Scalloped hammerhead',  radius: 24, density: 0.006,  speed: 7.0, accel: 0.10, cd: 2.6, ability: 'Ram',    len: 4.4,
                    bonusVs: { concrete: 1.5 } },
    sheepshead:   { name: 'Sheepshead',            radius: 21, density: 0.0045, speed: 5.8, accel: 0.15, cd: 1.6, ability: 'Crunch', len: 3.1 },
    sealion:      { name: 'Galápagos sea lion',    radius: 22, density: 0.005,  speed: 7.0, accel: 0.2,  cd: 1.4, ability: 'Spin',   len: 3.6, air: 32 },
    iguana:       { name: 'Marine iguana',         radius: 18, density: 0.005,  speed: 4.6, accel: 0.12, cd: 1.8, ability: 'Grip',   len: 4.4, air: 40 },
    penguin:      { name: 'Galápagos penguin',     radius: 17, density: 0.0045, speed: 7.6, accel: 0.26, cd: 0.9, ability: 'Burst',  len: 3.0, air: 24 },
    bullhead:     { name: 'Galápagos bullhead shark', radius: 21, density: 0.0065, speed: 4.6, accel: 0.11, cd: 2.0, ability: 'Crush', len: 4.0,
                    bonusVs: { concrete: 1.5 } },
    archerfish:   { name: 'Archerfish',            radius: 18, density: 0.004,  speed: 6.0, accel: 0.16, cd: 0.9, ability: 'Jet',    len: 3.3 },
    parrotfish:   { name: 'Parrotfish',            radius: 22, density: 0.005,  speed: 5.6, accel: 0.15, cd: 1.2, ability: 'Grind',  len: 3.3,
                    bonusVs: { rubble: 3 } },
    wrasse:       { name: 'Bluestreak cleaner wrasse', radius: 13, density: 0.004, speed: 6.8, accel: 0.3, cd: 0.8, ability: 'Clean', len: 4.2 },
    triton:       { name: 'Giant triton',          radius: 22, density: 0.008,  speed: 3.8, accel: 0.1,  cd: 2.4, ability: 'Scent',  len: 3.4, spineproof: true },
    mantis:       { name: 'Peacock mantis shrimp', radius: 17, density: 0.006,  speed: 5.2, accel: 0.18, cd: 1.5, ability: 'Punch',  len: 3.8 },
    nautilus:     { name: 'Chambered nautilus',    radius: 20, density: 0.004,  speed: 4.6, accel: 0.1,  cd: 1.3, ability: 'Buoy',   len: 3.2 },
    manatee:      { name: 'Florida manatee',       radius: 30, density: 0.008,  speed: 4.3, accel: 0.07, cd: 3.0, ability: 'Push',   len: 3.7, air: 55 }
  },
  // air: seconds of breath for air-breathing rescuers (see AIR_* below).

  // ---- Air (air-breathing rescuers) ----
  AIR_REFILL: 0.45,          // share of a full breath regained per second at the surface
  AIR_BOOST_DRAIN: 1.8,      // breath runs out this much faster while dashing or pushing
  AIR_LOW: 0.25,             // ring turns red and beeps below this share
  AIR_SURFACE_PAD: 14,       // within this many px below the waterline counts as breathing
  AIR_OUT_RISE: 3.2,         // out of breath: pulled up at this speed until it reaches the surface

  // ---- Seagrass ----
  SEAGRASS_PENALTY: 4,       // reef health % lost when sinking junk or a charge crushes a seagrass patch
  SEAGRASS_COOLDOWN: 1.2,
  SEAGRASS_CRUSH_SPEED: 3,   // junk landing faster than this crushes it
  SEAGRASS_DASH_SPEED: 9,    // rescuers only crush it at charge speed

  // ---- Big rescues (staged nets) ----
  STAGE_TIME_BONUS: 4,       // seconds of tide won back per stage torn

  // ---- Puzzle mode ----
  PUZZLE_SETTLE: 0.8,        // out of moves: end once everything has been still this long...
  PUZZLE_MAX_WAIT: 2.5,      // ...or this long after the last move, whichever comes first

  // ---- Arcade mode ----
  ARCADE_START_TIME: 75,     // seconds on the clock for wave 1
  ARCADE_WAVE_TIME: 32,      // seconds added for wave 2; 2 s less each wave after...
  ARCADE_WAVE_TIME_MIN: 16,  // ...down to this. Rescues add no time in Arcade.
  ARCADE_HP_GROWTH: 0.08,    // nets and junk get this much tougher per wave
  ARCADE_LEVEL_WIDTH: 2600,
  ARCADE_SCHOOL_TIME: 14,    // seconds a rescued animal follows you in Arcade before swimming off
  SCHOOL_MAX: 16,            // campaign: the oldest followers swim off past this many

  // ---- Abilities ----
  ABILITY: {
    dashSpeed: 15, dashTime: 0.32,
    leapSpeed: 15.5, leapUp: 0.55, glideTime: 1.3, glideSpeed: 11,
    inflateScale: 2.6, inflateTime: 1.3, inflateRadius: 170, inflateForce: 0.07, inflateDamage: 28,
    snapRadius: 150, snapDamageBrittle: 110, snapDamageOther: 30,
    shoveSpeed: 10.5, shoveTime: 0.7, shoveMassMult: 2,
    pierceSpeed: 18, pierceTime: 0.5,
    ramSpeed: 15, ramTime: 0.55, ramVsConcrete: 3, ramVsContainer: 1.5,
    pushSpeed: 8.5, pushTime: 1.0, pushMassMult: 4,     // manatee: slow, but nothing stops it
    spinSpeed: 13, spinTime: 0.5,                         // sea lion: a twisting dash that bounces off rock instead of stopping
    gripTime: 2.2, gripRadius: 64, gripDamage: 90,         // marine iguana: clings in place (currents can't move it) and scrapes junk loose
    burstSpeed: 15, burstTime: 0.24,                       // penguin: a very short, very quick dash
    crushRadius: 74, crushHard: 170, crushOther: 80,       // bullhead shark: crushes traps, concrete and shells
    jetRange: 400, jetCone: 40, jetDamage: 70,             // archerfish: auto-aimed water jet; knocks snagged junk off branches above the water
    grindRadius: 72, grindRubble: 220, grindOther: 40,     // parrotfish: grinds rubble and algae away
    cleanRadius: 140,                                      // cleaner wrasse: calms big animals, frees tangled gentle ones
    scentRadius: 240,                                      // giant triton: crown-of-thorns starfish move away from its scent
    punchRadius: 62, punchDamage: 460,                     // mantis shrimp: one very hard strike
    buoySpeed: 9, buoyTime: 0.7,                           // nautilus: rises or sinks straight up or down
    crunchRadius: 70, crunchHard: 130, crunchOther: 50, crunchDash: 9   // sheepshead: a lunge and a bite that cracks shells, metal, wood and traps
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
    netcutter: { name: 'Net Cutter',    desc: 'For 12 seconds, the next net or line you touch is cut', time: 12 }
  },
  GADGET_START_COUNT: 3,

  // Every campaign level is open while the game is in testing. Set false to unlock levels in order.
  UNLOCK_ALL: true
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

// Regenerates docs/FACTS_TO_VERIFY.md (and docs/facts.csv) from the cards in js/guide.js plus the
// real-world claims in level hints, so the checklist always matches what players see.
// Run: node tools/facts.js   (keeps any ticks and sources already filled in, matched by card + field)
const fs = require('fs'), path = require('path');
global.window = {}; global.TT = {};
require(path.join(__dirname, '..', 'js', 'guide.js'));
const out = path.join(__dirname, '..', 'docs', 'FACTS_TO_VERIFY.md');

// Real-world claims made in level hints (gameplay instructions are left out).
const HINTS = [
  ['1-2 Mangrove Maze (hint)', 'Claim', 'Sheepshead have strong teeth that look surprisingly human'],
  ['1-5 Stone-Crab Traps (hint)', 'Claim', 'Turtles breathe air and must surface'],
  ['1-6 Seagrass Channel (hint)', 'Claim', 'Manatees breathe air and must come up for air'],
  ['2-1 Mangrove Edge (hint)', 'Claim', 'Archerfish knock things down with jets of water from below the surface'],
  ['2-3 Cleaning Station (hint)', 'Claim', 'Manta rays visit cleaning stations, where cleaner wrasse clean them'],
  ['2-4 Starfish Outbreak (hint)', 'Claim', 'Crown-of-thorns starfish eat coral and move away from the scent of their predator, the giant triton'],
  ['2-5 Spawning Night (hint)', 'Claim', 'On spawning nights, corals release their eggs and sperm together'],
  ['3-2 Lava Shore (hint)', 'Claim', 'Marine iguanas grip rocks against the waves, and breathe air'],
  ['3-6 Darwin\'s Pillars (hint)', 'Claim', 'Darwin\'s Arch fell into the sea in 2021, leaving two pillars; whale sharks gather near Darwin Island'],
  ['4-1 Kelp Canopy (hint)', 'Claim', 'Giant kelp grows in tall forests in Monterey Bay; sea otters breathe air'],
  ['4-2 Elkhorn Slough (hint)', 'Claim', 'Leopard sharks gather in Elkhorn Slough; invasive green crabs live there; sea otters eat crabs'],
  ['4-3 Harbor Breakwater (hint)', 'Claim', 'Octopuses hide in the rocks of breakwaters'],
  ['4-4 Urchin Barren (hint)', 'Claim', 'Too many purple urchins can eat a kelp forest down to bare rock; sunflower sea stars eat urchins'],
  ['4-5 Sand Channel (hint)', 'Claim', 'Bat rays flap their wings to dig clams out of the sand'],
  ['4-6 Canyon Head (hint)', 'Claim', 'Humpback whales get caught in crab-pot lines; elephant seals are deep divers'],
  ['5-1 Dusk at the Rim (hint)', 'Claim', 'By about 200 m deep, sunlight is nearly gone; Risso\'s dolphins hunt squid at night using echolocation'],
  ['5-2 Scattering Layer (hint)', 'Claim', 'The scattering layer is so thick with animals (largely lanternfish) that ship sonar once mistook it for the sea floor; it rises at night and sinks by day'],
  ['5-3 The Night Rise (hint)', 'Claim', 'Every night lanternfish, squid and shrimp rise toward the surface to feed and sink at dawn; Humboldt squid swim by jet propulsion'],
  ['5-4 Mirror Halls (hint)', 'Claim', 'Hatchetfish have mirror-like sides and belly lights that hide their shadow from hunters below; bristlemouths may be the most numerous backboned animals on Earth'],
  ['5-5 Barreleye Window (hint)', 'Claim', 'The barreleye has a see-through head and green tube-shaped eyes that can point straight up'],
  ['5-6 Oxygen Minimum Zone (hint)', 'Claim', 'The vampire squid lives where the water holds very little oxygen and releases glowing mucus instead of ink; Cuvier\'s beaked whale is the deepest-diving mammal known']
];

const strip = (s) => String(s).replace(/\.$/, '');
const rows = [];
TT.GUIDE.forEach((c) => {
  const place = c.id.indexOf('place_') === 0, card = c.name + (c.id === 'lionfish' || c.id === 'cots' ? '' : '');
  rows.push([card, place ? 'Region' : 'Scientific name', place ? c.sci : (/^(Family|Order)/.test(c.sci) || / species$/.test(c.sci) ? c.sci : '*' + c.sci + '*')]);
  rows.push([card, 'Where', c.where]);
  rows.push([card, 'Size', c.size]);
  rows.push([card, 'Did you know?', strip(c.fact)]);
  rows.push([card, 'Threats', strip(c.threat)]);
});
(TT.HABITAT || []).forEach((c) => {
  const card = c.name + ' (habitat)';
  rows.push([card, 'Scientific name', c.sci]);
  rows.push([card, 'Where', c.where]);
  rows.push([card, 'Size', c.size]);
  rows.push([card, 'Did you know?', strip(c.fact)]);
  rows.push([card, 'Threats', strip(c.threat)]);
});
(TT.TRASH || []).forEach((c) => {
  const card = c.name + ' (trash)';
  rows.push([card, 'Where it comes from', strip(c.where)]);
  rows.push([card, 'How long it lasts', strip(c.size)]);
  rows.push([card, 'How it harms wildlife', strip(c.fact)]);
  rows.push([card, 'How to help', strip(c.threat)]);
});
HINTS.forEach((h) => rows.push(h));

// keep ticks and sources already entered
const old = fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : '';
const kept = {};
old.split('\n').forEach((l) => { const p = l.split('|').map((x) => x.trim()); if (p.length >= 7 && p[4] && p[4] !== '☐' && p[4] !== 'Verified?' && p[4] !== '---') kept[p[1] + '|' + p[2]] = [p[4], p[5]]; });
const art = old.indexOf('## Art-accuracy notes') >= 0 ? old.slice(old.indexOf('## Art-accuracy notes')) : '';

let md = '# Facts to verify before release\n\nEvery real-world fact shown in the game: the field-guide cards in `js/guide.js` and the claims in level hints.\n' +
  'Generated by `node tools/facts.js` (re-run it after changing a card; ticks and sources are kept).\n' +
  'Cards are written in metric; the game converts sizes and distances to imperial (Units setting in the field guide), so only the metric figures need checking.\n' +
  'Check each against a trusted source (e.g. NOAA, FWC, IUCN Red List, a university or aquarium site) and note the source.\n\n' +
  rows.length + ' facts.\n\n| Card | Field | Claim as written | Verified? | Source |\n| --- | --- | --- | --- | --- |\n';
const csv = ['Card,Field,Claim,Verified,Source'];
rows.forEach((r) => {
  const k = kept[r[0] + '|' + r[1]] || ['☐', ''];
  md += '| ' + r[0] + ' | ' + r[1] + ' | ' + r[2] + ' | ' + k[0] + ' | ' + k[1] + ' |\n';
  csv.push([r[0], r[1], r[2].replace(/\*/g, ''), k[0] === '☐' ? '' : k[0], k[1]].map((x) => '"' + String(x).replace(/"/g, '""') + '"').join(','));
});
fs.writeFileSync(out, md + (art ? '\n' + art : ''));
fs.writeFileSync(path.join(__dirname, '..', 'docs', 'facts.csv'), csv.join('\n') + '\n');
console.log(rows.length + ' facts written');

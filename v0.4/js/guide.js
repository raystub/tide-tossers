// Tide Tossers v0.2 — field-guide cards. Facts are kept general; every one is listed in
// docs/FACTS_TO_VERIFY.md and must be checked against a trusted source before release.
window.TT = window.TT || {};

TT.GUIDE = [
  { id: 'tang', name: 'Atlantic blue tang', sci: 'Acanthurus coeruleus', where: 'Coral reefs of Florida, the Bahamas and the Caribbean', size: 'Up to about 25–38 cm',
    fact: 'Young blue tangs are bright yellow and turn blue as they grow up.', threat: 'Loss of healthy coral reefs.' },
  { id: 'flyingfish', name: 'Flying fish', sci: 'Family Exocoetidae', where: 'Warm open oceans worldwide, including the Florida Straits', size: 'Most are about 17–30 cm',
    fact: 'They leap out of the water and glide on wing-like fins to escape predators.', threat: 'Overfishing in some regions.' },
  { id: 'puffer', name: 'Checkered puffer', sci: 'Sphoeroides testudineus', where: 'Shallow seagrass beds and mangroves of Florida and the Caribbean', size: 'Up to about 30 cm',
    fact: 'Puffers blow themselves up by quickly gulping water, making them hard for predators to swallow.', threat: 'Loss of seagrass and mangrove habitat.' },
  { id: 'pistolshrimp', name: 'Pistol (snapping) shrimp', sci: 'Family Alpheidae', where: 'Warm coastal waters and reefs worldwide', size: 'Usually about 3–5 cm',
    fact: 'Snapping its big claw shut creates a collapsing bubble with a loud pop that can stun small prey.', threat: 'Damage to reefs and seagrass beds.' },
  { id: 'loggerhead', name: 'Loggerhead sea turtle', sci: 'Caretta caretta', where: 'Oceans worldwide; nests on Florida beaches', size: 'Shell about 90 cm; around 135 kg',
    fact: 'Florida\'s beaches are among the most important loggerhead nesting areas in the world.', threat: 'Getting caught in fishing gear, swallowing plastic, and lights on nesting beaches.' },
  { id: 'swordfish', name: 'Swordfish', sci: 'Xiphias gladius', where: 'Tropical and temperate oceans worldwide, including off the Galápagos', size: 'Commonly up to about 3 m',
    fact: 'Swordfish slash at prey with their flat bill rather than spearing it.', threat: 'Overfishing and being caught on longlines.' },
  { id: 'hammerhead', name: 'Scalloped hammerhead', sci: 'Sphyrna lewini', where: 'Warm coastal waters worldwide; large schools gather around the Galápagos', size: 'Up to about 3–4 m',
    fact: 'The wide head spreads out sensors that pick up the tiny electric fields of hidden prey.', threat: 'Overfishing and shark finning; listed as critically endangered.' },
  { id: 'hatchling', name: 'Sea turtle hatchling', sci: 'Several species', where: 'Sandy beaches, then the open ocean', size: 'About 5 cm at hatching',
    fact: 'Hatchlings usually emerge at night and crawl toward the brightest horizon, which is normally the sea.', threat: 'Artificial lights, predators, plastic and ghost nets.' },
  { id: 'seahorse', name: 'Lined seahorse', sci: 'Hippocampus erectus', where: 'Seagrass beds and mangroves of the western Atlantic, including Florida', size: 'Up to about 15–19 cm',
    fact: 'In seahorses, the male carries the eggs in a pouch until they hatch.', threat: 'Habitat loss and being caught as bycatch.' },
  { id: 'fishschool', name: 'Sardine school', sci: 'Family Clupeidae', where: 'Coastal waters worldwide, including the eastern Pacific', size: 'Usually about 15–25 cm each',
    fact: 'Swimming in a tight school helps sardines confuse predators.', threat: 'Overfishing and lost fishing nets.' },
  { id: 'lionfish', name: 'Red lionfish (invasive)', sci: 'Pterois volitans', where: 'Native to the Indo-Pacific; invasive in the western Atlantic and Caribbean', size: 'Up to about 38 cm',
    fact: 'In the Atlantic they have few natural predators and eat large numbers of small reef fish.', threat: 'They are the threat here: divers remove them to protect native reefs.' },
  { id: 'place_keys', name: 'Florida Keys', sci: 'Florida, USA', where: 'A chain of islands off the southern tip of Florida', size: 'About 1,700 islands',
    fact: 'The Keys are lined by the only living coral barrier reef in the continental United States.', threat: 'Plastic, lost traps and fishing line, coral disease and warming water.' },
  { id: 'place_galapagos', name: 'Galápagos Islands', sci: 'Ecuador', where: 'Volcanic islands about 1,000 km off the coast of Ecuador', size: 'Protected as a marine reserve',
    fact: 'Many animals here, like the Galápagos sea lion, live nowhere else on Earth.', threat: 'Illegal fishing, longline gear, plastic and climate change.' }
];

// Long-press info cards (gameplay help, shown in-game).
TT.INFO = {
  rescuers: {
    tang: 'Tap in flight for a quick burst of speed.',
    flyingfish: 'Tap to glide for a second. Hits plastic and glass twice as hard.',
    puffer: 'Tap to puff up and push junk apart. Immune to lionfish spines.',
    pistolshrimp: 'Tap underwater: its snap sends out a shockwave that shatters glass and plastic.',
    loggerhead: 'Heavy. Tap to dive and shove sunken junk.',
    swordfish: 'Slices nets and fishing lines on contact. Tap to dart straight through wood, plastic and metal. Concrete stops it.',
    hammerhead: 'Tap to ram forward. The best way to crack concrete.'
  },
  materials: {
    plastic: 'Floats and breaks easily. Try the flying fish or a pistol-shrimp snap.',
    glass: 'Brittle. A pistol-shrimp snap shatters it.',
    wood: 'Floats. Medium strength.',
    tin: 'Heavy, rusty metal. Swordfish pierce it.',
    concrete: 'Very heavy and tough. A hammerhead ram breaks it; it stops swordfish dead.'
  },
  containerNames: { net: 'Ghost net', line: 'Fishing line', trap: 'Abandoned trap' },
  containers: {
    net: '{n} trapped inside. Hit it hard, or slice it with a swordfish.',
    line: '{n} tangled here. A rescuer swimming through cuts it.',
    trap: '{n} trapped inside. Smash it with a heavy hit.'
  },
  coral: 'Avoid it: each hit costs 5% reef health.',
  lionfish: 'Its spines knock out a rescuer\'s ability. The pufferfish is immune, and a snap or a puff scares it away.'
};

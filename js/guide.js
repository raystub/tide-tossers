// Tide Tossers v0.2 — field-guide cards. Facts are kept general; every one is listed in
// docs/FACTS_TO_VERIFY.md and must be checked against a trusted source before release.
window.TT = window.TT || {};

TT.GUIDE = [
  { id: 'tang', name: 'Atlantic blue tang', sci: 'Acanthurus coeruleus', where: 'Coral reefs and nearby shallow grassy or rocky areas of Florida, the Bahamas and the Caribbean', size: 'Usually 25–30 cm; rarely up to about 37 cm',
    fact: 'Young blue tangs are bright yellow. They pass through a yellow-and-blue stage before turning blue as adults.', threat: 'Damage to coral reefs and the shallow habitats where they feed and shelter.' },
  { id: 'flyingfish', name: 'Flying fish', sci: 'Family Exocoetidae', where: 'Warm open oceans worldwide, including the Florida Straits', size: 'Most are about 17–30 cm',
    fact: 'They leap out of the water and glide on wing-like fins to escape predators.', threat: 'They are fished in some regions, so local fishing pressure can be a concern.' },
  { id: 'puffer', name: 'Checkered puffer', sci: 'Sphoeroides testudineus', where: 'Shallow bays, tidal creeks, seagrass beds and mangroves from Florida through the Caribbean', size: 'Commonly about 20 cm; rarely up to about 35 cm',
    fact: 'Puffers blow themselves up by quickly gulping water, making them hard for predators to swallow.', threat: 'Loss of seagrass and mangrove habitat.' },
  { id: 'pistolshrimp', name: 'Pistol (snapping) shrimp', sci: 'Family Alpheidae', where: 'Shallow coastal waters worldwide, including coral reefs and rocky bottoms', size: 'Most are only a few centimetres long',
    fact: 'Snapping its big claw shut creates a collapsing bubble with a loud pop that can stun small prey.', threat: 'Damage to reefs and seagrass beds.' },
  { id: 'loggerhead', name: 'Loggerhead sea turtle', sci: 'Caretta caretta', where: 'Oceans worldwide; nests on Florida beaches', size: 'Shell about 90 cm; around 135 kg',
    fact: 'Florida\'s beaches are among the most important loggerhead nesting areas in the world.', threat: 'Getting caught in fishing gear, swallowing plastic, and lights on nesting beaches.' },
  { id: 'swordfish', name: 'Swordfish', sci: 'Xiphias gladius', where: 'Tropical and temperate oceans worldwide, including off the Galápagos', size: 'Large adults reach about 3 m; most are smaller',
    fact: 'Swordfish slash at prey with their flat bill rather than spearing it.', threat: 'Caught mainly on longlines. Careful management helped the North Atlantic population recover from overfishing.' },
  { id: 'hammerhead', name: 'Scalloped hammerhead', sci: 'Sphyrna lewini', where: 'Warm coastal waters worldwide; large schools gather around the Galápagos', size: 'Up to about 3–4 m',
    fact: 'The wide head spreads out sensors that pick up the tiny electric fields of hidden prey.', threat: 'Overfishing and shark finning; listed as Critically Endangered on the IUCN Red List.' },
  { id: 'sheepshead', name: 'Sheepshead', sci: 'Archosargus probatocephalus', where: 'Oyster bars, mangroves, jetties, pilings and seawalls of the western Atlantic and Gulf of Mexico', size: 'Commonly about 30–45 cm',
    fact: 'Sheepshead have strong front teeth that look surprisingly human, plus back teeth for crushing barnacles, shellfish and crabs.', threat: 'Loss of oyster reefs and mangroves.' },
  { id: 'reddrum', name: 'Red drum (redfish)', sci: 'Sciaenops ocellatus', where: 'Coastal bays, mangroves and seagrass of the western Atlantic and Gulf of Mexico', size: 'Many adults are 50–90 cm; big ones grow much larger',
    fact: 'The black spot near the tail may trick predators into attacking the tail instead of the head.', threat: 'Loss of the mangrove and seagrass nurseries where young red drum grow up.' },
  { id: 'manatee', name: 'Florida manatee', sci: 'Trichechus manatus latirostris', where: 'Warm, shallow coastal waters, rivers and springs of Florida', size: 'Adults about 3 m and often 360–550 kg; a few are much heavier',
    fact: 'Manatees are plant-eaters that may graze for up to eight hours a day, and they must surface to breathe air.', threat: 'Boat strikes, loss of seagrass and warm-water refuges, cold stress, and tangling in fishing gear.' },
  { id: 'sawfish', name: 'Smalltooth sawfish', sci: 'Pristis pectinata', where: 'Shallow coastal waters of southern Florida', size: 'Adults are often 3.5–4.5 m; the biggest reach about 5.5 m',
    fact: 'A sawfish is a ray, not a shark. It swings its toothed saw from side to side to stun small fish.', threat: 'Getting tangled in fishing nets; listed as endangered in the United States.' },
  { id: 'sealion', name: 'Galápagos sea lion', sci: 'Zalophus wollebaeki', where: 'Coasts and beaches of the Galápagos Islands', size: 'Up to about 2.5 m; adult males often around 250 kg',
    fact: 'Galápagos sea lions breed only in the Galápagos and on one island off mainland Ecuador.', threat: 'Tangling in fishing gear, El Niño years that cut their food, and diseases spread by dogs.' },
  { id: 'iguana', name: 'Marine iguana', sci: 'Amblyrhynchus cristatus', where: 'Rocky shores of the Galápagos Islands', size: 'Up to about 1.3 m, much of it tail',
    fact: 'The marine iguana is the only lizard in the world that feeds in the sea, grazing on algae.', threat: 'Introduced cats, dogs and rats, El Niño years and climate change, and plastic pollution.' },
  { id: 'penguin', name: 'Galápagos penguin', sci: 'Spheniscus mendiculus', where: 'The western Galápagos Islands, where cold currents bring food', size: 'About 50 cm tall',
    fact: 'It is the only penguin that lives on the equator.', threat: 'Warm El Niño years that drive away its food, and introduced predators.' },
  { id: 'bullhead', name: 'Galápagos bullhead shark', sci: 'Heterodontus quoyi', where: 'Rocky reefs and nearby sandy bottoms of the Galápagos and Peru', size: 'A small shark: up to about 60 cm',
    fact: 'Bullhead sharks have pointed front teeth for gripping and flat back teeth for crushing crabs and shellfish.', threat: 'Scientists know little about its threats. Fishing near rocky reefs may catch it by accident.' },
  { id: 'whaleshark', name: 'Whale shark', sci: 'Rhincodon typus', where: 'Warm oceans worldwide; large females gather near Darwin Island in the Galápagos', size: 'Most seen are 4–12 m; the biggest reach about 18 m',
    fact: 'The whale shark is the largest fish in the world, yet it filters tiny plankton and small fish from the water.', threat: 'Fishing, getting caught in nets, and boat strikes; listed as Endangered on the IUCN Red List.' },
  { id: 'archerfish', name: 'Archerfish', sci: 'Toxotes chatareus', where: 'Mangroves, estuaries and rivers of Southeast Asia and northern Australia', size: 'Up to about 30–40 cm',
    fact: 'Archerfish spit jets of water to knock insects off leaves above the water.', threat: 'Loss and pollution of mangroves, estuaries and rivers.' },
  { id: 'parrotfish', name: 'Parrotfish', sci: 'Family Scaridae', where: 'Coral reefs worldwide, including the Great Barrier Reef', size: 'Most are about 30–50 cm',
    fact: 'Parrotfish graze algae with beak-like teeth and bite off bits of reef. What passes through them comes out as sand.', threat: 'Overfishing and coral reef decline.' },
  { id: 'wrasse', name: 'Bluestreak cleaner wrasse', sci: 'Labroides dimidiatus', where: 'Coral reefs of the Indian and Pacific Oceans, including the Great Barrier Reef', size: 'Up to about 12 cm',
    fact: 'Big fish, and in some places manta rays, visit its cleaning station to have parasites picked off.', threat: 'Collection for aquariums and reef damage may affect some populations.' },
  { id: 'triton', name: 'Giant triton', sci: 'Charonia tritonis', where: 'Coral reefs of the Indian and Pacific Oceans', size: 'Shell up to about 50 cm',
    fact: 'The giant triton is one of the few animals that eats crown-of-thorns starfish, and the starfish move away from its scent.', threat: 'Collection for its beautiful shell.' },
  { id: 'mantis', name: 'Peacock mantis shrimp', sci: 'Odontodactylus scyllarus', where: 'Shallow tropical waters of the Indian and Pacific Oceans, including reefs', size: 'Usually about 10–18 cm',
    fact: 'Its club-like arms strike fast and hard enough to crack snail shells: one of the fastest strikes known in nature.', threat: 'Damage to shallow reef habitat may affect it; collection for aquariums also happens.' },
  { id: 'nautilus', name: 'Chambered nautilus', sci: 'Nautilus pompilius', where: 'Deep slopes of coral reefs in the Indian and Pacific Oceans, including Osprey Reef', size: 'Shell usually about 20 cm across',
    fact: 'It controls the gas and liquid in its shell chambers to rise and sink.', threat: 'Collection for its shell.' },
  { id: 'manta', name: 'Reef manta ray', sci: 'Mobula alfredi', where: 'Tropical and subtropical waters of the Indian Ocean and western Pacific, often around reefs, including the Great Barrier Reef', size: 'Wings up to about 3–5 m across',
    fact: 'Manta rays visit cleaning stations where small fish clean them.', threat: 'Fishing and tangling in nets and lines; boat strikes in busy waters.' },
  { id: 'cots', name: 'Crown-of-thorns starfish', sci: 'Genus Acanthaster (several species)', where: 'Coral reefs of the Indian and Pacific Oceans', size: 'Usually about 25–35 cm across',
    fact: 'Outbreaks of crown-of-thorns starfish can eat large areas of living coral.', threat: 'They are the threat here: outbreaks harm coral, so teams monitor and remove them on some reefs.' },
  { id: 'clownfish', name: 'Clownfish (anemonefish)', sci: 'Genus Amphiprion (many species)', where: 'Coral reefs of the Indian and Pacific Oceans', size: 'Many are 8–11 cm; it depends on the species',
    fact: 'Clownfish live among a sea anemone\'s stinging tentacles. A special coat of mucus keeps the anemone from stinging them.', threat: 'Collection for aquariums, and damage to reefs and the anemones they live in.' },
  { id: 'place_gbr', name: 'Great Barrier Reef', sci: 'Queensland, Australia', where: 'Off the coast of Queensland, Australia', size: 'About 2,300 km long',
    fact: 'It is the largest coral reef system in the world. Astronauts can see it from orbit (but not from the Moon).', threat: 'Warming water and coral bleaching, crown-of-thorns outbreaks and pollution.' },
  { id: 'hatchling', name: 'Sea turtle hatchling', sci: 'Several species', where: 'Sandy beaches, then the open ocean', size: 'Most are about 4–6 cm at hatching',
    fact: 'Hatchlings usually emerge at night and head for the brightest horizon, which is normally the sea. Artificial lights can lead them the wrong way.', threat: 'Artificial lights, predators, plastic and ghost nets.' },
  { id: 'seahorse', name: 'Lined seahorse', sci: 'Hippocampus erectus', where: 'Seagrass beds and mangroves of the western Atlantic, including Florida', size: 'Up to about 15–19 cm',
    fact: 'The female puts her eggs in the male\'s pouch. He carries them as they grow, then gives birth to tiny live seahorses.', threat: 'Habitat loss and being caught as bycatch.' },
  { id: 'fishschool', name: 'Sardine school', sci: 'Herring family (Clupeidae)', where: 'Coastal waters in many parts of the world, including the eastern Pacific', size: 'Usually about 15–25 cm each',
    fact: 'A tight school makes it hard for a predator to pick out one sardine, and many eyes watch for danger.', threat: 'Overfishing of some populations, and lost fishing nets.' },
  { id: 'lionfish', name: 'Red lionfish (invasive)', sci: 'Pterois volitans', where: 'Native to the Indo-Pacific; invasive in the western Atlantic, Gulf of Mexico and Caribbean', size: 'Up to about 38 cm',
    fact: 'In the Atlantic they have few predators and eat many small reef fish. A close cousin, the devil firefish, invaded too.', threat: 'They are the threat here: divers remove them to protect native reefs.' },
  { id: 'place_keys', name: 'Florida Keys', sci: 'Florida, USA', where: 'A chain of islands off the southern tip of Florida', size: 'About 1,700 islands',
    fact: 'Offshore lies Florida\'s Coral Reef, the only extensive coral barrier reef in the continental United States.', threat: 'Plastic, lost traps and fishing line, coral disease and warming water.' },
  { id: 'place_galapagos', name: 'Galápagos Islands', sci: 'Ecuador', where: 'Volcanic islands about 1,000 km off the coast of Ecuador', size: '13 large islands and many small ones; about 8,000 km² of land',
    fact: 'The islands sit inside one of the world\'s largest marine reserves, and many animals here live nowhere else on Earth.', threat: 'Illegal fishing, longline gear, plastic and climate change.' }
];

// Trash cards: what each kind of junk in the game is, where it comes from and how it harms wildlife.
// Unlocked by clearing a level that has that kind of junk. Facts are listed in docs/FACTS_TO_VERIFY.md.
TT.TRASH = [
  { id: 'trash_plastic', k: 'plastic', trash: true, name: 'Plastic crates, bags and bottles', sci: 'Floating plastic', where: 'Litter carried from land by rivers, storm drains and wind, and things lost from boats', size: 'Decades to centuries. It does not biodegrade: sunlight and waves break it into tiny pieces called microplastics',
    fact: 'Sea turtles can mistake floating bags for jellyfish, and seabirds and fish swallow small pieces. Animals also get tangled in it.', threat: 'Use less single-use plastic, recycle, and join beach and river cleanups.' },
  { id: 'trash_glass', k: 'glass', trash: true, name: 'Glass bottles and jars', sci: 'Glass', where: 'Litter left on beaches and thrown from boats', size: 'Glass does not biodegrade. Waves slowly grind it into sea glass over a very long time',
    fact: 'Broken glass can cut animals, and some small animals may get trapped inside bottles and jars.', threat: 'Recycle glass and never leave bottles on the beach.' },
  { id: 'trash_tin', k: 'tin', trash: true, name: 'Metal cans and drums', sci: 'Metal', where: 'Drink cans, paint tins and old drums that are dumped or lost overboard', size: 'Years to decades or more, depending on the metal and the water. Salt water rusts steel; aluminium corrodes more slowly',
    fact: 'Sharp edges can cut animals, and old drums can leak oil, paint or chemicals that pollute the water and harm wildlife.', threat: 'Recycle cans, and take old paint and chemicals to a proper disposal site.' },
  { id: 'trash_wood', k: 'wood', trash: true, name: 'Pallets and lumber', sci: 'Wood debris', where: 'Shipping pallets, building scraps and storm wreckage', size: 'Untreated wood decays over years; painted or treated wood lasts longer and can leak chemicals',
    fact: 'Storms and waves throw heavy floating debris onto coral and seagrass, breaking and smothering them.', threat: 'Tie down building materials before storms, and report large floating debris.' },
  { id: 'trash_concrete', k: 'concrete', trash: true, name: 'Concrete blocks', sci: 'Concrete', where: 'Weights for traps and moorings, and dumped building waste', size: 'Decades or longer',
    fact: 'A heavy block dropped or dragged across a reef or seagrass bed can crush coral and scar the seagrass.', threat: 'Tie up to fixed moorings instead of anchoring on reefs, and report dumped blocks so trained teams can remove them.' },
  { id: 'trash_net', k: 'net', trash: true, name: 'Ghost nets', sci: 'Lost fishing nets', where: 'Fishing nets lost in storms, snagged on reefs or abandoned at sea', size: 'Nylon and plastic nets can last for decades, and the pieces last even longer',
    fact: 'Lost nets keep catching fish, turtles, seals and dolphins for years. This is called ghost fishing.', threat: 'Gear recovery and recycling programs, and marking fishing gear so lost nets can be found.' },
  { id: 'trash_line', k: 'line', trash: true, name: 'Fishing line and longlines', sci: 'Monofilament line', where: 'Line snapped off or thrown away by anglers, and longlines lost by fishing boats', size: 'Monofilament line can last for decades or longer, slowly wearing into tiny plastic pieces',
    fact: 'Fine line wraps around flippers, fins, wings and beaks and cuts in as animals grow. Hooks get swallowed.', threat: 'Never leave line behind: put it in the line-recycling tubes at piers and boat ramps where there are any.' },
  { id: 'trash_trap', k: 'trap', trash: true, name: 'Lost crab and lobster traps', sci: 'Derelict traps', where: 'Traps whose buoy lines are cut by boats or that storms carry away', size: 'Wire traps can last for years or longer',
    fact: 'A lost trap keeps catching animals, and animals that die inside can lure more in.', threat: 'Trap cleanup programs, escape panels that rot away in lost traps, and reporting lost traps.' },
];

// Long-press info cards (gameplay help, shown in-game).
TT.INFO = {
  rescuers: {
    tang: 'Tap in flight for a quick burst of speed.',
    flyingfish: 'Tap to glide for a second. Hits plastic and glass twice as hard.',
    puffer: 'Tap to puff up and push junk apart. Immune to lionfish spines.',
    pistolshrimp: 'Tap underwater: its snap sends out a shockwave that shatters glass and plastic.',
    loggerhead: 'Heavy. Tap to dive and shove sunken junk. Breathes air: surface before the ring runs out.',
    sheepshead: 'Tap to crunch: a short lunge and bite that cracks traps, cans, wood and nets up close.',
    sealion: 'Spin: a twisting dash that bounces off rock instead of stopping. Breathes air.',
    iguana: 'Grip: clings in place so waves can\'t move it, and scrapes nearby junk and nets loose. Breathes air.',
    penguin: 'Burst: a very quick dart that recharges fast. Very short breath.',
    bullhead: 'Crush: a short lunge and a bite that cracks traps, concrete and shells.',
    archerfish: 'Jet: a water jet that auto-aims at junk in front of it, even above the water. Knocks snagged plastic off branches.',
    parrotfish: 'Grind: grinds coral rubble and algae away so the reef can recover.',
    wrasse: 'Clean: big gentle animals calm down and move aside. The only way to free a tangled gentle animal.',
    triton: 'Scent: crown-of-thorns starfish nearby move away. Slow, armoured and not hurt by their spines.',
    mantis: 'Punch: one very hard strike that cracks concrete, traps and shells.',
    nautilus: 'Buoy: rises or sinks straight up or down, shoving junk aside.',
    manatee: 'The slowest and heaviest. Its push keeps going through nets and junk. Breathes air.',
    swordfish: 'Slices nets and fishing lines on contact. Tap to dart straight through wood, plastic and metal. Concrete stops it.',
    hammerhead: 'Tap to ram forward. The best way to crack concrete.'
  },
  materials: {
    plastic: 'Floats and breaks easily. Try the flying fish or a pistol-shrimp snap.',
    glass: 'Brittle. A pistol-shrimp snap shatters it.',
    wood: 'Floats. Medium strength.',
    tin: 'Heavy, rusty metal. Swordfish pierce it.',
    rubble: 'Dead coral rubble smothered in algae. A parrotfish grinds it away.',
    concrete: 'Very heavy and tough. A hammerhead ram breaks it; it stops swordfish dead.'
  },
  containerNames: { net: 'Ghost net', line: 'Fishing line', trap: 'Abandoned trap' },
  containers: {
    net: '{n} trapped inside. Hit it hard, or slice it with a swordfish.',
    line: '{n} tangled here. A rescuer swimming through cuts it.',
    trap: '{n} trapped inside. Smash it with a heavy hit.'
  },
  coral: 'Avoid it: each hit costs 5% reef health.',
  cots: 'Crown-of-thorns starfish eat coral. A giant triton\'s scent moves them off the reef.',
  lionfish: 'Its spines knock out a rescuer\'s ability. The pufferfish is immune, and a snap or a puff scares it away.'
};

// Habitat cards: the corals, plants, algae and background life of each place. Unlocked by clearing a level
// where they appear (tags: background family, 'coral', 'seagrass', 'mangrove', 'dark', 'any'). img: what the card shows.
TT.HABITAT = [
  { id: 'hab_coral', habitat: true, name: 'Reef-building coral', sci: 'Many species (stony corals)', where: 'Warm, clear, shallow seas around the world', size: 'Each polyp is often just a few millimetres; reefs can stretch for thousands of kilometres',
    fact: 'Corals are animals. Tiny algae living inside their tissues make food from sunlight and give corals much of their colour.', threat: 'Marine heatwaves cause bleaching: the coral loses its algae and turns white, and may starve if the heat lasts.', img: 'coral', tags: ['coral'] },
  { id: 'hab_brain', habitat: true, name: 'Brain coral', sci: 'Several species, e.g. grooved brain coral', where: 'Coral reefs of Florida and the Caribbean', size: 'Colonies can grow to about 1–2 m across',
    fact: 'Its winding grooves are rows of polyps sharing a skeleton. Big brain corals can be well over a hundred years old.', threat: 'Warming water and coral diseases such as stony coral tissue loss disease.', img: 'prop:brain', tags: ['keys'] },
  { id: 'hab_staghorn', habitat: true, name: 'Staghorn coral', sci: 'Acropora cervicornis', where: 'Shallow reefs of Florida and the Caribbean', size: 'Branches can form thickets several metres wide',
    fact: 'One of the fastest-growing corals. Teams grow pieces in underwater nurseries and plant them back on reefs.', threat: 'Disease, bleaching and storms; listed as threatened under the US Endangered Species Act.', img: 'prop:staghorn', tags: ['keys'] },
  { id: 'hab_seafan', habitat: true, name: 'Sea fan', sci: 'Gorgonia species', where: 'Reefs of Florida and the Caribbean', size: 'Commonly up to about 1 m across',
    fact: 'A sea fan is a soft coral colony. It grows across the current so its tiny polyps can catch plankton drifting past.', threat: 'Disease, warming water and damage from anchors and fishing gear.', img: 'prop:fan', tags: ['keys'] },
  { id: 'hab_sponge', habitat: true, name: 'Tube sponges', sci: 'Many species', where: 'Coral reefs worldwide, including Florida and the Caribbean', size: 'Tubes from a few centimetres to over 1 m tall',
    fact: 'Sponges are simple animals. They pump water through tiny pores and filter out food, which helps keep reef water clear.', threat: 'Warming water, disease and pollution.', img: 'prop:tubes', tags: ['keys'] },
  { id: 'hab_anemone', habitat: true, name: 'Sea anemone', sci: 'Many species', where: 'Coral reefs and rocky shores worldwide', size: 'Most are a few centimetres to about 30 cm across',
    fact: 'Anemones are relatives of corals and jellyfish. They catch food with stinging tentacles, and some shelter small fish and shrimp.', threat: 'Warming water (anemones can bleach like corals) and collection for aquariums.', img: 'prop:anemone', tags: ['keys'] },
  { id: 'hab_turtlegrass', habitat: true, name: 'Turtle grass', sci: 'Thalassia testudinum', where: 'Shallow, sandy bays of Florida, the Gulf of Mexico and the Caribbean', size: 'Ribbon-like leaves often 10–30 cm long',
    fact: 'Seagrasses are true flowering plants that live underwater. Meadows shelter young fish and feed manatees and green turtles.', threat: 'Boat propeller scars, murky water from pollution, and coastal building.', img: 'seagrass', tags: ['seagrass'] },
  { id: 'hab_mangrove', habitat: true, name: 'Red mangrove', sci: 'Rhizophora mangle', where: 'Sheltered tropical coasts, including Florida and the Caribbean', size: 'Trees often 5–10 m tall; prop roots arch down into the water',
    fact: 'Its arching prop roots hold the tree up in soft mud and make a nursery where young fish hide.', threat: 'Clearing for coastal building and farming, pollution, and rising seas.', img: 'static:root', tags: ['mangrove'] },
  { id: 'hab_kelp', habitat: true, name: 'Kelp and seaweeds', sci: 'Large brown algae', where: 'Cool, nutrient-rich water; in the Galápagos only where cold currents rise', size: 'Some giant kelp grows tens of metres long',
    fact: 'Kelp is an alga, not a plant: it has no roots or flowers. Gas-filled floats hold its blades up toward the light.', threat: 'Warm-water events, and too many sea urchins grazing it away.', img: 'prop:kelp', tags: ['galapagos'] },
  { id: 'hab_cupcoral', habitat: true, name: 'Orange cup coral', sci: 'Tubastraea coccinea', where: 'Shaded rock, caves and overhangs in warm seas, including the Galápagos', size: 'Each cup is about 1–2 cm across',
    fact: 'Unlike reef-building corals, it has no algae inside, so it can live in dark caves and catches plankton at night.', threat: 'It is native in the Pacific but invasive in parts of the Atlantic, where it spreads on reefs and structures.', img: 'prop:cups', tags: ['galapagos', 'cave'] },
  { id: 'hab_urchin', habitat: true, name: 'Sea urchins', sci: 'Many species', where: 'Rocky reefs and kelp forests worldwide, including the Galápagos', size: 'Most are about 3–10 cm across without their spines',
    fact: 'Urchins graze algae with five teeth on the underside. A healthy number keeps algae in check; too many can strip a reef.', threat: 'Disease outbreaks, and losing the predators that keep their numbers balanced.', img: 'prop:urchin', tags: ['galapagos', 'cave'] },
  { id: 'hab_seastar', habitat: true, name: 'Sea stars', sci: 'Many species', where: 'Oceans worldwide, from tide pools to the deep sea', size: 'Most are about 10–30 cm across',
    fact: 'Sea stars move on hundreds of tiny tube feet, and many can regrow a lost arm.', threat: 'Sea star wasting disease has killed huge numbers of some species.', img: 'prop:star', tags: ['keys', 'galapagos'] },
  { id: 'hab_lava', habitat: true, name: 'Volcanic rock', sci: 'Basalt lava', where: 'The Galápagos Islands, built by volcanoes', size: 'Some of the islands are still volcanically active',
    fact: 'The Galápagos sit over a volcanic hotspot. New lava rock becomes a home for algae, crabs and marine iguanas.', threat: 'Lava itself is not threatened, but the life on it faces warming water and pollution.', img: 'static:lava', tags: ['galapagos'] },
  { id: 'hab_glowplankton', habitat: true, name: 'Glowing plankton', sci: 'Bioluminescent dinoflagellates and others', where: 'Oceans worldwide, often in warm coastal waters', size: 'Each is a single cell, too small to see on its own',
    fact: 'Many plankton make their own light. When the water is stirred, they flash blue-green.', threat: 'Pollution and changes in water temperature can shift where they bloom.', img: 'prop:glowtube', tags: ['dark'] },
  { id: 'hab_marinesnow', habitat: true, name: 'Marine snow', sci: 'Drifting organic particles', where: 'Every ocean, falling from the surface to the deep sea', size: 'Flakes are usually a few millimetres or smaller',
    fact: 'Marine snow is bits of dead plankton, waste and dust slowly sinking. It feeds many deep-sea animals.', threat: 'Changes at the surface, like warming water, change how much food falls to the deep.', img: 'snow', tags: ['any'] },
];

// The trash and habitat cards a level unlocks when it is cleared.
TT.cardsForLevel = function (level) {
  var ids = [], add = function (id) { if (ids.indexOf(id) < 0) ids.push(id); };
  (level.objects || []).forEach(function (o) { if (o.k !== 'rubble') add('trash_' + o.k); });
  (level.containers || []).forEach(function (c) { add('trash_' + c.k); });
  var tags = ['any', level.background];
  if ((level.coral || []).length) tags.push('coral');
  if ((level.seagrass || []).length) tags.push('seagrass');
  if ((level.statics || []).some(function (st) { return st.look === 'root'; })) tags.push('mangrove');
  if (level.dark) tags.push('dark');
  (TT.HABITAT || []).forEach(function (h) { if (h.tags.some(function (t) { return tags.indexOf(t) >= 0; })) add(h.id); });
  return ids;
};

// ---------- Units ----------
// Card text is written in metric. TT.Units.text() rewrites every measurement for the player's choice:
// 'metric', 'imperial', or 'both' (metric first, imperial in brackets). The default follows the device:
// imperial in the US, metric elsewhere.
TT.Units = (function () {
  var RX = /(\d[\d,]*(?:\.\d+)?)(\s*[–-]\s*(\d[\d,]*(?:\.\d+)?))?\s*(km²|km|cm|m|kg)(?![A-Za-z²])/g;
  var CONV = { cm: [0.393701, 'in'], m: [3.28084, 'ft'], kg: [2.20462, 'lb'], km: [0.621371, 'mi'], 'km²': [0.386102, 'sq mi'] };
  function num(s) { return parseFloat(String(s).replace(/,/g, '')); }
  // round to a sensible precision for a field guide
  function nice(v) {
    var r;
    if (v >= 1000) { var p = Math.pow(10, Math.floor(Math.log10(v)) - 1); r = Math.round(v / p) * p; }
    else if (v >= 100) r = Math.round(v / 10) * 10;
    else if (v >= 3) r = Math.round(v);
    else r = Math.round(v * 10) / 10;
    return r.toLocaleString('en-US');
  }
  function mode() {
    var m = TT.Save && TT.Save.units ? TT.Save.units() : null;
    if (m === 'metric' || m === 'imperial' || m === 'both') return m;
    var lang = (navigator.language || '').toLowerCase();
    return lang === 'en-us' || lang === 'en-lr' || lang === 'my' ? 'imperial' : 'metric';
  }
  function text(s, m) {
    m = m || mode();
    if (!s || m === 'metric') return s;
    return String(s).replace(RX, function (all, a, rng, b, u) {
      var c = CONV[u], dash = rng ? rng.replace(/[\d,.\s]/g, '') || '–' : '';
      var imp = nice(num(a) * c[0]) + (rng ? dash + nice(num(b) * c[0]) : '') + ' ' + c[1];
      return m === 'imperial' ? imp : all + ' (' + imp + ')';
    });
  }
  return { text: text, mode: mode, NAMES: { metric: 'Metric', imperial: 'Imperial', both: 'Both' }, ORDER: ['metric', 'imperial', 'both'] };
})();

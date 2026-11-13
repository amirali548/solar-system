/**
 * Heliocentric data for the eight planets and the Sun.
 * Physical figures follow NASA / JPL planetary fact sheets (2026).
 * Sizes and orbit radii are artistically compressed for a navigable scene.
 */

export const SUN = {
  id: 'sun',
  name: 'Sun',
  order: '00',
  kind: 'star',
  type: 'G2V main-sequence star',
  tagline: 'The star that anchors every orbit.',
  description:
    'The Sun holds 99.86% of the Solar System\u2019s mass. In its core, 600 million tonnes of hydrogen fuse into helium every second, releasing the light and heat that make the planets what they are.',
  texture: 'assets/textures/sun.jpg',
  color: '#ffb75e',
  colorHex: 0xffb75e,
  radius: 9.5,
  atmosphereColor: 0xff9a3c,
  rotationSpeed: 0.004,
  focusDistance: 6.0,
  stats: [
    { label: 'Distance from Sun', value: '0 km', note: 'System barycenter' },
    { label: 'Diameter', value: '1,391,000 km', note: '109 \u00d7 Earth' },
    { label: 'Mass', value: '1.989 \u00d7 10\u00b3\u2070 kg', note: '333,000 \u00d7 Earth' },
    { label: 'Orbital period', value: '225 Myr', note: 'Around the Milky Way' },
    { label: 'Rotation period', value: '25.4 days', note: 'At the equator' },
    { label: 'Average temperature', value: '5,500 \u00b0C', note: 'Core: 15 million \u00b0C' },
    { label: 'Known moons', value: '\u2014', note: 'Eight planets orbit it' },
    { label: 'Surface gravity', value: '274 m/s\u00b2', note: '27.9 \u00d7 Earth' }
  ],
  facts: [
    'Sunlight takes 8 minutes 20 seconds to reach Earth, but a photon born in the core may wander for 100,000 years before escaping.',
    'The Sun fuses roughly 600 million tonnes of hydrogen into helium every second, converting about 4 million tonnes of mass into energy.',
    'Its magnetic activity rises and falls on an 11-year cycle, producing sunspots, solar flares and coronal mass ejections.'
  ]
};

export const PLANETS = [
  {
    id: 'mercury',
    name: 'Mercury',
    order: '01',
    kind: 'planet',
    type: 'Terrestrial planet',
    classification: 'TERRESTRIAL',
    tagline: 'Swift, scorched and locked in the Sun\u2019s glare.',
    description:
      'The smallest planet races around the Sun in just 88 days. Its airless, crater-scarred surface swings between extremes hot enough to melt lead and cold enough to freeze air, while ice survives in polar shadows.',
    texture: 'assets/textures/mercury.jpg',
    color: '#b3a99c',
    colorHex: 0xb3a99c,
    radius: 1.15,
    orbitRadius: 18,
    eccentricity: 0.2056,
    inclination: 7.0,
    axialTilt: 0.03,
    orbitSpeed: 0.18,
    spinSpeed: 0.025,
    startAngle: 0.7,
    focusDistance: 7.3,
    atmosphereColor: null,
    stats: [
      { label: 'Distance from Sun', value: '57.9 million km', note: '0.39 AU' },
      { label: 'Diameter', value: '4,879 km', note: '0.38 \u00d7 Earth' },
      { label: 'Mass', value: '3.30 \u00d7 10\u00b2\u00b3 kg', note: '0.055 \u00d7 Earth' },
      { label: 'Orbital period', value: '88.0 days', note: 'Fastest planet' },
      { label: 'Rotation period', value: '58.6 days', note: 'Sidereal day' },
      { label: 'Average temperature', value: '167 \u00b0C', note: '\u2212173 to 427 \u00b0C' },
      { label: 'Known moons', value: '0', note: 'No natural satellites' },
      { label: 'Surface gravity', value: '3.7 m/s\u00b2', note: '0.38 \u00d7 Earth' }
    ],
    facts: [
      'One solar day on Mercury lasts 176 Earth days \u2014 twice as long as its 88-day year.',
      'Its iron core fills roughly 85% of the planet\u2019s radius, making Mercury second only to Earth in density.',
      'Permanently shadowed craters near its poles hold water ice, confirmed by NASA\u2019s MESSENGER orbiter.'
    ]
  },
  {
    id: 'venus',
    name: 'Venus',
    order: '02',
    kind: 'planet',
    type: 'Terrestrial planet',
    classification: 'TERRESTRIAL',
    tagline: 'Earth\u2019s twin, turned into a greenhouse inferno.',
    description:
      'Beneath a veil of sulfuric-acid clouds, Venus hides a volcanic plain hot enough to melt lead. A runaway greenhouse effect traps heat, making it the hottest planet even though Mercury orbits closer to the Sun.',
    texture: 'assets/textures/venus.jpg',
    color: '#dbc38f',
    colorHex: 0xdbc38f,
    radius: 1.85,
    orbitRadius: 24,
    eccentricity: 0.0068,
    inclination: 3.39,
    axialTilt: 177.4,
    orbitSpeed: 0.13,
    spinSpeed: -0.012,
    startAngle: 2.2,
    focusDistance: 7.3,
    atmosphereColor: 0xffd9a0,
    stats: [
      { label: 'Distance from Sun', value: '108.2 million km', note: '0.72 AU' },
      { label: 'Diameter', value: '12,104 km', note: '0.95 \u00d7 Earth' },
      { label: 'Mass', value: '4.87 \u00d7 10\u00b2\u2074 kg', note: '0.815 \u00d7 Earth' },
      { label: 'Orbital period', value: '224.7 days', note: 'Retrograde rotation' },
      { label: 'Rotation period', value: '243 days', note: 'Retrograde' },
      { label: 'Average temperature', value: '464 \u00b0C', note: 'Hottest planet' },
      { label: 'Known moons', value: '0', note: 'No natural satellites' },
      { label: 'Surface gravity', value: '8.87 m/s\u00b2', note: '0.90 \u00d7 Earth' }
    ],
    facts: [
      'Venus spins backwards: on its surface, the Sun rises in the west and sets in the east.',
      'Its atmosphere is 96.5% carbon dioxide, and the surface pressure is 92 times that of Earth.',
      'A day on Venus (243 Earth days) is longer than its year (225 Earth days).'
    ]
  },
  {
    id: 'earth',
    name: 'Earth',
    order: '03',
    kind: 'planet',
    type: 'Terrestrial planet',
    classification: 'TERRESTRIAL',
    tagline: 'The only known world to harbor life.',
    description:
      'Oceans cover 71% of Earth\u2019s surface, a magnetic field deflects the solar wind, and a stabilising Moon keeps its seasons steady. Together these make Earth the only planet known to support life.',
    texture: 'assets/textures/earth.jpg',
    color: '#6ea8ff',
    colorHex: 0x6ea8ff,
    radius: 1.95,
    orbitRadius: 31,
    eccentricity: 0.0167,
    inclination: 0.0,
    axialTilt: 23.44,
    orbitSpeed: 0.1,
    spinSpeed: 0.13,
    startAngle: 3.7,
    focusDistance: 7.4,
    atmosphereColor: 0x5ea7ff,
    stats: [
      { label: 'Distance from Sun', value: '149.6 million km', note: '1.00 AU' },
      { label: 'Diameter', value: '12,742 km', note: 'Reference planet' },
      { label: 'Mass', value: '5.97 \u00d7 10\u00b2\u2074 kg', note: '1.00 \u00d7 Earth' },
      { label: 'Orbital period', value: '365.25 days', note: '1 tropical year' },
      { label: 'Rotation period', value: '23h 56m', note: 'Sidereal day' },
      { label: 'Average temperature', value: '15 \u00b0C', note: '\u221289 to 57 \u00b0C' },
      { label: 'Known moons', value: '1', note: 'The Moon' },
      { label: 'Surface gravity', value: '9.81 m/s\u00b2', note: '1.00 g' }
    ],
    facts: [
      'Earth is the only known world with stable liquid surface water, covering about 71% of the planet.',
      'Its molten iron core generates a magnetic shield that protects the atmosphere from the solar wind.',
      'Tidal friction with the Moon is gradually slowing Earth\u2019s rotation, lengthening the day by about 1.8 ms per century.'
    ]
  },
  {
    id: 'mars',
    name: 'Mars',
    order: '04',
    kind: 'planet',
    type: 'Terrestrial planet',
    classification: 'TERRESTRIAL',
    tagline: 'The rust-red frontier of exploration.',
    description:
      'Mars is a cold desert world of iron-oxide dust, towering volcanoes and a canyon system that would span a continent. Ancient riverbeds and polar ice hint at a warmer, wetter past.',
    texture: 'assets/textures/mars.jpg',
    color: '#e0714a',
    colorHex: 0xe0714a,
    radius: 1.45,
    orbitRadius: 38.5,
    eccentricity: 0.0934,
    inclination: 1.85,
    axialTilt: 25.19,
    orbitSpeed: 0.08,
    spinSpeed: 0.12,
    startAngle: 4.9,
    focusDistance: 7.6,
    atmosphereColor: 0xffa07a,
    stats: [
      { label: 'Distance from Sun', value: '227.9 million km', note: '1.52 AU' },
      { label: 'Diameter', value: '6,779 km', note: '0.53 \u00d7 Earth' },
      { label: 'Mass', value: '6.42 \u00d7 10\u00b2\u00b3 kg', note: '0.107 \u00d7 Earth' },
      { label: 'Orbital period', value: '687 days', note: '1.88 Earth years' },
      { label: 'Rotation period', value: '24h 37m', note: 'Sidereal day' },
      { label: 'Average temperature', value: '\u221265 \u00b0C', note: '\u2212125 to 20 \u00b0C' },
      { label: 'Known moons', value: '2', note: 'Phobos & Deimos' },
      { label: 'Surface gravity', value: '3.71 m/s\u00b2', note: '0.38 \u00d7 Earth' }
    ],
    facts: [
      'Olympus Mons is the tallest volcano known in the Solar System, rising about 22 km above the Martian plains.',
      'Valles Marineris stretches over 4,000 km \u2014 roughly the width of the United States.',
      'Its thin carbon-dioxide atmosphere exerts less than 1% of Earth\u2019s surface pressure, yet drives planet-wide dust storms.'
    ]
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    order: '05',
    kind: 'planet',
    type: 'Gas giant',
    classification: 'GAS GIANT',
    tagline: 'The Solar System\u2019s colossal guardian.',
    description:
      'Jupiter is a world of swirling ammonia clouds and violent storms, more massive than every other planet combined. Its immense gravity shapes the asteroid belt and shields the inner planets from many comets.',
    texture: 'assets/textures/jupiter.jpg',
    color: '#d8a878',
    colorHex: 0xd8a878,
    radius: 5.6,
    orbitRadius: 58,
    eccentricity: 0.0489,
    inclination: 1.3,
    axialTilt: 3.13,
    orbitSpeed: 0.045,
    spinSpeed: 0.26,
    startAngle: 1.4,
    focusDistance: 7.2,
    atmosphereColor: 0xffd2a1,
    stats: [
      { label: 'Distance from Sun', value: '778.5 million km', note: '5.20 AU' },
      { label: 'Diameter', value: '139,820 km', note: '11.2 \u00d7 Earth' },
      { label: 'Mass', value: '1.898 \u00d7 10\u00b2\u2077 kg', note: '317.8 \u00d7 Earth' },
      { label: 'Orbital period', value: '11.86 years', note: 'One Jovian year' },
      { label: 'Rotation period', value: '9h 56m', note: 'Fastest rotation' },
      { label: 'Average temperature', value: '\u2212110 \u00b0C', note: 'At cloud tops' },
      { label: 'Known moons', value: '115', note: 'As of April 2026' },
      { label: 'Surface gravity', value: '24.79 m/s\u00b2', note: '2.53 \u00d7 Earth' }
    ],
    facts: [
      'The Great Red Spot is a storm wider than Earth that has been observed since at least the 1830s.',
      'Jupiter contains 2.5 times the mass of all the other planets in the Solar System combined.',
      'Its moon Ganymede is the largest moon in the Solar System \u2014 bigger than the planet Mercury.'
    ]
  },
  {
    id: 'saturn',
    name: 'Saturn',
    order: '06',
    kind: 'planet',
    type: 'Gas giant',
    classification: 'GAS GIANT',
    tagline: 'A jeweled giant wrapped in ice.',
    description:
      'Saturn\u2019s rings span nearly 300,000 km yet are astonishingly thin. The planet itself is a hydrogen-helium giant so light that it would float in water, circled by a remarkable family of icy moons.',
    texture: 'assets/textures/saturn.jpg',
    color: '#e6cf9b',
    colorHex: 0xe6cf9b,
    radius: 4.8,
    orbitRadius: 76,
    eccentricity: 0.0565,
    inclination: 2.49,
    axialTilt: 26.73,
    orbitSpeed: 0.032,
    spinSpeed: 0.24,
    startAngle: 5.6,
    focusDistance: 11.8,
    atmosphereColor: 0xffe6b0,
    hasRings: true,
    stats: [
      { label: 'Distance from Sun', value: '1.434 billion km', note: '9.58 AU' },
      { label: 'Diameter', value: '116,460 km', note: '9.1 \u00d7 Earth' },
      { label: 'Mass', value: '5.68 \u00d7 10\u00b2\u2076 kg', note: '95.2 \u00d7 Earth' },
      { label: 'Orbital period', value: '29.45 years', note: 'One Saturnian year' },
      { label: 'Rotation period', value: '10h 42m', note: 'Sidereal day' },
      { label: 'Average temperature', value: '\u2212140 \u00b0C', note: 'At cloud tops' },
      { label: 'Known moons', value: '293', note: 'As of June 2026' },
      { label: 'Surface gravity', value: '10.44 m/s\u00b2', note: '1.06 \u00d7 Earth' }
    ],
    facts: [
      'Saturn\u2019s rings are about 99.9% water ice, spanning 282,000 km but often only tens of metres thick.',
      'With an average density of 0.687 g/cm\u00b3, Saturn is the only planet less dense than water.',
      'A hexagonal jet stream more than 29,000 km wide circles the planet\u2019s north pole.'
    ]
  },
  {
    id: 'uranus',
    name: 'Uranus',
    order: '07',
    kind: 'planet',
    type: 'Ice giant',
    classification: 'ICE GIANT',
    tagline: 'The tilted ice world on its side.',
    description:
      'Uranus rolls around the Sun at a 98\u00b0 tilt, likely knocked over by a colossal impact. Methane in its deep atmosphere absorbs red light, giving the ice giant its serene blue-green color.',
    texture: 'assets/textures/uranus.jpg',
    color: '#9fdce6',
    colorHex: 0x9fdce6,
    radius: 2.6,
    orbitRadius: 93,
    eccentricity: 0.0457,
    inclination: 0.77,
    axialTilt: 97.77,
    orbitSpeed: 0.022,
    spinSpeed: -0.14,
    startAngle: 2.9,
    focusDistance: 9.6,
    atmosphereColor: 0x9ff2ff,
    hasRings: true,
    faintRings: true,
    stats: [
      { label: 'Distance from Sun', value: '2.871 billion km', note: '19.2 AU' },
      { label: 'Diameter', value: '50,724 km', note: '4.0 \u00d7 Earth' },
      { label: 'Mass', value: '8.68 \u00d7 10\u00b2\u2075 kg', note: '14.5 \u00d7 Earth' },
      { label: 'Orbital period', value: '84.0 years', note: 'One Uranian year' },
      { label: 'Rotation period', value: '17h 14m', note: 'Retrograde' },
      { label: 'Average temperature', value: '\u2212195 \u00b0C', note: 'Minimum \u2212224 \u00b0C' },
      { label: 'Known moons', value: '29', note: 'As of 2026' },
      { label: 'Surface gravity', value: '8.87 m/s\u00b2', note: '0.90 \u00d7 Earth' }
    ],
    facts: [
      'Uranus rotates on its side at 98\u00b0, so each pole spends 42 years in sunlight and 42 years in darkness.',
      'Its blue-green color comes from methane, which absorbs red wavelengths of sunlight.',
      'Uranus is the coldest planet, with atmospheric temperatures dropping to about \u2212224 \u00b0C.'
    ]
  },
  {
    id: 'neptune',
    name: 'Neptune',
    order: '08',
    kind: 'planet',
    type: 'Ice giant',
    classification: 'ICE GIANT',
    tagline: 'The wind-blasted blue frontier.',
    description:
      'Neptune is the most distant planet, a deep-blue ice giant where supersonic winds tear through methane clouds. It was the first world found by mathematics before it was ever seen through a telescope.',
    texture: 'assets/textures/neptune.jpg',
    color: '#5f7dff',
    colorHex: 0x5f7dff,
    radius: 2.5,
    orbitRadius: 108,
    eccentricity: 0.0113,
    inclination: 1.77,
    axialTilt: 28.32,
    orbitSpeed: 0.016,
    spinSpeed: 0.15,
    startAngle: 0.2,
    focusDistance: 7.6,
    atmosphereColor: 0x5b8cff,
    stats: [
      { label: 'Distance from Sun', value: '4.495 billion km', note: '30.1 AU' },
      { label: 'Diameter', value: '49,244 km', note: '3.9 \u00d7 Earth' },
      { label: 'Mass', value: '1.02 \u00d7 10\u00b2\u2076 kg', note: '17.1 \u00d7 Earth' },
      { label: 'Orbital period', value: '164.8 years', note: 'One Neptunian year' },
      { label: 'Rotation period', value: '16h 6m', note: 'Sidereal day' },
      { label: 'Average temperature', value: '\u2212200 \u00b0C', note: 'At cloud tops' },
      { label: 'Known moons', value: '16', note: 'Largest: Triton' },
      { label: 'Surface gravity', value: '11.15 m/s\u00b2', note: '1.14 \u00d7 Earth' }
    ],
    facts: [
      'Neptune has the fastest winds in the Solar System, exceeding 2,000 km/h.',
      'It was the first planet discovered by mathematical prediction, identified in 1846 within a degree of its predicted position.',
      'Sunlight takes about 4.2 hours to reach Neptune, and one Neptunian year lasts 165 Earth years.'
    ]
  }
];

export const BODIES = [SUN, ...PLANETS];

export function getBodyById(id) {
  return BODIES.find((body) => body.id === id) ?? null;
}

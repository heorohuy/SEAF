export const planets = [
  { id: 'super-earth', name: 'Super Earth', x: 480, y: 480, owner: 'Super Earth', faction: 'super-earth', liberation: 100, sector: 'Sol', status: 'Controlled', index: 0 },
  { id: 'vernen-wells', name: 'Vernen Wells', x: 760, y: 280, owner: 'Terminids', faction: 'terminids', liberation: 72.4, sector: 'Xzar', status: 'Liberating', index: 1 },
  { id: 'malevelon-creek', name: 'Malevelon Creek', x: 200, y: 280, owner: 'Automatons', faction: 'automatons', liberation: 18.7, sector: 'Severin', status: 'Enemy Controlled', index: 2 },
  { id: 'meridia', name: 'Meridia', x: 760, y: 680, owner: 'Illuminate', faction: 'illuminate', liberation: 42.1, sector: 'Mirin', status: 'Under Attack', index: 3 },
  { id: 'cyberstan', name: 'Cyberstan', x: 220, y: 720, owner: 'Super Earth', faction: 'super-earth', liberation: 5.8, sector: 'Yed Prior', status: 'Enemy Controlled', index: 4 }
];

export const connections = [
  ['super-earth', 'vernen-wells'],
  ['super-earth', 'malevelon-creek'],
  ['super-earth', 'meridia'],
  ['super-earth', 'cyberstan'],
  ['vernen-wells', 'malevelon-creek'],
  ['malevelon-creek', 'meridia']
];

export const sectors = [
  {
    id: 'sol',
    name: 'SOL SYSTEM',
    points: [
      [424, 400],
      [536, 400],
      [560, 480],
      [536, 560],
      [424, 560],
      [400, 480],
    ],
    centerX: 480,
    centerY: 480,
    faction: 'super-earth',
  },
  {
    id: 'xzar',
    name: 'XZAR SECTOR',
    points: [
      [718, 220],
      [802, 220],
      [820, 280],
      [802, 340],
      [718, 340],
      [700, 280],
    ],
    centerX: 760,
    centerY: 280,
    faction: 'super-earth',
  },
  {
    id: 'severin',
    name: 'SEVERIN SECTOR',
    points: [
      [218, 220],
      [282, 220],
      [300, 280],
      [282, 340],
      [218, 340],
      [200, 280],
    ],
    centerX: 240,
    centerY: 280,
    faction: 'automatons',
  },
  {
    id: 'mirin',
    name: 'MIRIN SECTOR',
    points: [
      [704, 600],
      [816, 600],
      [840, 680],
      [816, 760],
      [704, 760],
      [680, 680],
    ],
    centerX: 760,
    centerY: 680,
    faction: 'terminids',
  },
];

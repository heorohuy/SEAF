import {
  planets as galaxyPlanets,
  connections as galaxyConnections,
  sectors as galaxySectors,
} from './galaxy';

import {
  voidPlanets,
  voidConnections,
  voidSectors,
} from './void';

export const MAP_DIMENSIONS = {
  galaxy: {
    id: 'galaxy',
    label: 'GALACTIC SPACE',
    shortLabel: 'GALAXY',

    planets: galaxyPlanets,
    connections: galaxyConnections,
    sectors: galaxySectors,

    theme: 'galaxy',

    title: 'GALACTIC MAP',

    description: 'KNOWN GALACTIC SPACE',
  },

  void: {
    id: 'void',
    label: 'THE VOID',
    shortLabel: 'VOID',

    planets: voidPlanets,
    connections: voidConnections,
    sectors: voidSectors,

    theme: 'void',

    title: 'VOID SPACE',

    description: 'ILLUMINATE ANOMALOUS SPACE',
  },
};

export const DEFAULT_MAP_DIMENSION = 'galaxy';
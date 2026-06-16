import { Schema, MapSchema, type } from '@colyseus/schema';
import { TankState } from './TankState.js';
import { BulletState } from './BulletState.js';

export class GameState extends Schema {
  constructor() {
    super();
    this.tanks = new MapSchema();
    this.bullets = new MapSchema();
    this.redScore = 0;
    this.blueScore = 0;
    this.phase = 'waiting';
  }
}

type({ map: TankState })(GameState.prototype, 'tanks');
type({ map: BulletState })(GameState.prototype, 'bullets');
type('int16')(GameState.prototype, 'redScore');
type('int16')(GameState.prototype, 'blueScore');
type('string')(GameState.prototype, 'phase');

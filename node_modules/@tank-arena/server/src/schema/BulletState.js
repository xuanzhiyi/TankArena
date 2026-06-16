import { Schema, type } from '@colyseus/schema';

export class BulletState extends Schema {
  constructor() {
    super();
    this.id = '';
    this.ownerId = '';
    this.ownerTeam = '';
    this.x = 0;
    this.y = 0;
    this.angle = 0;
    this.lifetime = 0;
    this.damage = 34;
  }
}

type('string')(BulletState.prototype, 'id');
type('string')(BulletState.prototype, 'ownerId');
type('string')(BulletState.prototype, 'ownerTeam');
type('float32')(BulletState.prototype, 'x');
type('float32')(BulletState.prototype, 'y');
type('float32')(BulletState.prototype, 'angle');
type('float32')(BulletState.prototype, 'lifetime');
type('int16')(BulletState.prototype, 'damage');

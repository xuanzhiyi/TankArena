import { Schema, type } from '@colyseus/schema';

export class TankState extends Schema {
  constructor() {
    super();
    this.id = '';
    this.name = '';
    this.team = '';
    this.x = 0;
    this.y = 0;
    this.angle = 0;
    this.turretAngle = 0;
    this.hp = 100;
    this.alive = true;
    this.shieldActive = false;
    this.turboActive = false;
    this.shieldCooldown = 0;
    this.turboCooldown = 0;
    this.respawnIn = 0;
    this.kills = 0;
    this.deaths = 0;
    this.tankType = 'scout';
    this.speed = 5;
  }
}

type('string')(TankState.prototype, 'id');
type('string')(TankState.prototype, 'name');
type('string')(TankState.prototype, 'team');
type('float32')(TankState.prototype, 'x');
type('float32')(TankState.prototype, 'y');
type('float32')(TankState.prototype, 'angle');
type('float32')(TankState.prototype, 'turretAngle');
type('int16')(TankState.prototype, 'hp');
type('boolean')(TankState.prototype, 'alive');
type('boolean')(TankState.prototype, 'shieldActive');
type('boolean')(TankState.prototype, 'turboActive');
type('float32')(TankState.prototype, 'shieldCooldown');
type('float32')(TankState.prototype, 'turboCooldown');
type('float32')(TankState.prototype, 'respawnIn');
type('int16')(TankState.prototype, 'kills');
type('int16')(TankState.prototype, 'deaths');
type('string')(TankState.prototype, 'tankType');
type('float32')(TankState.prototype, 'speed');

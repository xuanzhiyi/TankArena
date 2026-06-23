import { TICK_RATE, BULLET_LIFETIME, RESPAWN_DELAY, TEAM_RED, TEAM_BLUE } from '@tank-arena/shared';
import { applyMovement, applyBullets } from './Physics.js';
import { checkBulletHits, checkWinCondition, respawnTank } from './CombatSystem.js';
import { tryActivateShield, tickShield } from './equipment/ShieldModules.js';
import { tryActivateTurbo, tickTurbo, isTurboActive } from './equipment/TurboModules.js';
import { getSpawnPoints } from '../map/OvalArena.js';
import { BulletState } from '../schema/BulletState.js';
import { TANK_DEFS } from './tanks/TankDefinitions.js';

export class GameLoop {
  constructor(room) {
    this.room = room;
    this.inputs = new Map();          // sessionId → latest input
    this.respawnTimers = new Map();   // sessionId → seconds remaining
    this.fireCooldowns = new Map();   // sessionId → seconds until next shot
    this._bulletCounter = 0;
    this._interval = null;
  }

  start() {
    const dt = 1 / TICK_RATE;
    this._interval = setInterval(() => this._tick(dt), 1000 / TICK_RATE);
  }

  setInput(sessionId, input) {
    this.inputs.set(sessionId, input);
  }

  removePlayer(sessionId) {
    this.inputs.delete(sessionId);
    this.respawnTimers.delete(sessionId);
    this.fireCooldowns.delete(sessionId);
  }

  _tick(dt) {
    const { state } = this.room;
    if (state.phase !== 'playing') return;

    for (const [sid, tank] of state.tanks) {
      if (!tank.alive) {
        // Count down respawn
        const timer = (this.respawnTimers.get(sid) ?? 0) - dt;
        if (timer <= 0) {
          const spawn = getSpawnPoints().find(s => s.team === tank.team);
          if (spawn) respawnTank(tank, spawn);
          this.respawnTimers.delete(sid);
        } else {
          this.respawnTimers.set(sid, timer);
          tank.respawnIn = timer;
        }
        continue;
      }

      const input = this.inputs.get(sid) || {};

      // Equipment
      tryActivateShield(sid, tank, input.shield);
      tickShield(sid, tank, dt);
      tryActivateTurbo(sid, tank, input.turbo);
      tickTurbo(sid, tank, dt);

      // Movement
      applyMovement(tank, input, dt, isTurboActive(sid));

      // Shooting
      const fireCd = (this.fireCooldowns.get(sid) ?? 0) - dt;
      this.fireCooldowns.set(sid, Math.max(0, fireCd));
      if (input.shoot && fireCd <= 0 && tank.alive) {
        this._spawnBullet(sid, tank);
        const def = TANK_DEFS[tank.tankType ?? 'scout'];
        this.fireCooldowns.set(sid, def.fireRate);
      }
    }

    applyBullets(state.bullets, dt);
    checkBulletHits(state.tanks, state.bullets, state);

    // Check for deaths that need respawn timers started
    for (const [sid, tank] of state.tanks) {
      if (!tank.alive && !this.respawnTimers.has(sid)) {
        this.respawnTimers.set(sid, RESPAWN_DELAY);
        tank.respawnIn = RESPAWN_DELAY;
      }
    }

    const winner = checkWinCondition(state);
    if (winner) {
      state.phase = 'ended';
      this.room.broadcast('gameOver', { winner });
      this.stop();
    }
  }

  _spawnBullet(ownerId, tank) {
    const id = `b${++this._bulletCounter}`;
    const def = TANK_DEFS[tank.tankType ?? 'scout'];
    const b = new BulletState();
    b.id = id;
    b.ownerId = ownerId;
    b.ownerTeam = tank.team;
    // Spawn at cannon tip so bullet visually exits the barrel
    const CANNON_LENGTH = 0.5; // world units — matches client CL (0.44) + a small gap
    b.x = tank.x + Math.cos(tank.turretAngle) * CANNON_LENGTH;
    b.y = tank.y + Math.sin(tank.turretAngle) * CANNON_LENGTH;
    b.angle = tank.turretAngle;
    b.lifetime = BULLET_LIFETIME;
    b.damage = def.bulletDamage;
    this.room.state.bullets.set(id, b);
  }

  stop() {
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }
  }
}

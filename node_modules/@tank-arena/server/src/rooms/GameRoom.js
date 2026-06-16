import pkg from 'colyseus';
const { Room } = pkg;
import { GameState } from '../schema/GameState.js';
import { TankState } from '../schema/TankState.js';
import { GameLoop } from '../game/GameLoop.js';
import { getSpawnPoints } from '../map/OvalArena.js';
import { TEAM_RED, TEAM_BLUE, MAX_PLAYERS } from '@tank-arena/shared';
import { TANK_DEFS } from '../game/tanks/TankDefinitions.js';
import { removeShieldState } from '../game/equipment/ShieldModules.js';
import { removeTurboState } from '../game/equipment/TurboModules.js';

export class GameRoom extends Room {
  onCreate(options) {
    this.setState(new GameState());
    this.maxClients = MAX_PLAYERS;
    this.loop = new GameLoop(this);

    this.onMessage('input', (client, data) => {
      this.loop.setInput(client.sessionId, data);
    });

    // Dev shortcut: start with however many players are present
    this.onMessage('devStart', () => {
      if (this.state.phase === 'waiting') this._startMatch();
    });
  }

  onJoin(client, options = {}) {
    const team = this._assignTeam();
    const spawn = getSpawnPoints().find(s => s.team === team);
    const def = TANK_DEFS['scout'];

    const tank = new TankState();
    tank.id = client.sessionId;
    tank.name = options.name ?? 'Tank';
    tank.team = team;
    tank.tankType = 'scout';
    tank.speed = def.speed;
    tank.x = spawn.x;
    tank.y = spawn.y;
    tank.hp = 100;
    tank.alive = true;

    this.state.tanks.set(client.sessionId, tank);

    // Auto-start when room is full
    if (this.clients.length >= MAX_PLAYERS && this.state.phase === 'waiting') {
      this._startMatch();
    }
  }

  onLeave(client) {
    this.state.tanks.delete(client.sessionId);
    this.loop.removePlayer(client.sessionId);
    removeShieldState(client.sessionId);
    removeTurboState(client.sessionId);

    if (this.clients.length === 0) this.loop.stop();
  }

  _startMatch() {
    this.state.phase = 'playing';
    this.loop.start();
    this.broadcast('matchStarted', {});
  }

  _assignTeam() {
    let red = 0, blue = 0;
    for (const [, t] of this.state.tanks) {
      if (t.team === TEAM_RED) red++;
      else blue++;
    }
    // Enforce max 3 per team
    if (red >= 3) return TEAM_BLUE;
    if (blue >= 3) return TEAM_RED;
    return red <= blue ? TEAM_RED : TEAM_BLUE;
  }
}

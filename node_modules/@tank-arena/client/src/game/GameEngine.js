import { TANK_MAX_HP, TURBO_MULTIPLIER, OVAL_MAP, MAP_COLS, MAP_ROWS } from '@tank-arena/shared';

function isWalkable(wx, wy) {
  const col = Math.floor(wx);
  const row = Math.floor(wy);
  if (col < 0 || col >= MAP_COLS || row < 0 || row >= MAP_ROWS) return false;
  return OVAL_MAP[row][col] !== 0;
}

function debugBoundaries() {
  console.log('=== VISUAL TILES (rendered, OVAL_MAP !== 0) ===');
  for (let r = 0; r < MAP_ROWS; r++) {
    let minC = -1, maxC = -1;
    for (let c = 0; c < MAP_COLS; c++) {
      if (OVAL_MAP[r][c] !== 0) { if (minC === -1) minC = c; maxC = c; }
    }
    if (minC !== -1) console.log(`  row ${r}: col ${minC}–${maxC}  (world x ${minC}–${maxC + 1})`);
  }

  console.log('=== WALKABLE BOUNDARY (isWalkable edges) ===');
  for (let r = 0; r < MAP_ROWS; r++) {
    let minW = -1, maxW = -1;
    for (let c = 0; c < MAP_COLS; c++) {
      if (isWalkable(c + 0.5, r + 0.5)) { if (minW === -1) minW = c; maxW = c; }
    }
    if (minW !== -1) console.log(`  row ${r}: col ${minW}–${maxW}  (world x ${minW}–${maxW + 1})`);
  }
}
debugBoundaries();

// Mirrors server Physics.applyMovement for client-side prediction
function applyMovementClient(ghost, input, dt) {
  if (!ghost || !input) return;
  let dx = 0, dy = 0;
  if (input.w) dy -= 1;
  if (input.s) dy += 1;
  if (input.a) dx -= 1;
  if (input.d) dx += 1;
  if (dx !== 0 || dy !== 0) {
    const len = Math.hypot(dx, dy);
    dx /= len; dy /= len;
    ghost.angle = Math.atan2(dy, dx);
    const speed = ghost.speed * (input.turbo ? TURBO_MULTIPLIER : 1);
    const nx = ghost.x + dx * speed * dt;
    const ny = ghost.y + dy * speed * dt;
    if (isWalkable(nx, ghost.y)) ghost.x = nx;
    if (isWalkable(ghost.x, ny)) ghost.y = ny;
  }
  ghost.turretAngle = input.turretAngle ?? ghost.turretAngle;
}

export class GameEngine {
  constructor(renderer, inputHandler, room) {
    this.renderer = renderer;
    this.input = inputHandler;
    this.room = room;
    // Local prediction ghost — mirrors own tank with immediate response
    this.localGhost = null;
    this._lastTime = null;
    this._rafId = null;
  }

  start() {
    // Initialize ghost from current server state
    const serverTank = this.room.state.tanks.get(this.room.sessionId);
    if (serverTank) {
      this.localGhost = {
        x: serverTank.x,
        y: serverTank.y,
        angle: serverTank.angle,
        turretAngle: serverTank.turretAngle,
        speed: serverTank.speed,
      };
    }
    this._rafId = requestAnimationFrame(t => this._loop(t));
  }

  _loop(timestamp) {
    const dt = this._lastTime ? Math.min((timestamp - this._lastTime) / 1000, 0.05) : 0;
    this._lastTime = timestamp;

    // 1. Get input using current local tank screen position
    const tankScreenPos = this.renderer.getTankScreenPos(this.room.sessionId);
    const packet = this.input.getInputPacket(tankScreenPos);

    // 2. Client-side prediction
    if (!this.localGhost) {
      const st = this.room.state.tanks.get(this.room.sessionId);
      if (st) this.localGhost = { x: st.x, y: st.y, angle: st.angle, turretAngle: st.turretAngle, speed: st.speed };
    }
    if (this.localGhost) {
      applyMovementClient(this.localGhost, packet, dt);
    }

    // 3. Send input to server (natural ~60Hz via rAF)
    this.room.send('input', packet);

    // 4. Reconcile: if ghost diverges too far from server, snap back
    const serverTank = this.room.state.tanks.get(this.room.sessionId);
    if (serverTank && this.localGhost) {
      const err = Math.hypot(serverTank.x - this.localGhost.x, serverTank.y - this.localGhost.y);
      if (err > 1.5) {
        this.localGhost.x = serverTank.x;
        this.localGhost.y = serverTank.y;
      }
      // Always sync speed from server (might change with turbo state)
      this.localGhost.speed = serverTank.speed;
    }

    // 5. Render
    this.renderer.render(this.room.state, this.localGhost, this.room.sessionId);

    // DEBUG: print tank world coordinates
    if (this.localGhost) {
      const x = this.localGhost.x.toFixed(2);
      const y = this.localGhost.y.toFixed(2);
      document.title = `x=${x} y=${y}`;
    }

    this._rafId = requestAnimationFrame(t => this._loop(t));
  }

  stop() {
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }
}

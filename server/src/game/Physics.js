import { BULLET_SPEED, BULLET_LIFETIME, TURBO_MULTIPLIER } from '@tank-arena/shared';
import { isWalkable } from '../map/OvalArena.js';

export function applyMovement(tank, input, dt, turboActive) {
  if (!tank.alive || !input) return;

  let dx = 0, dy = 0;
  if (input.w) dy -= 1;
  if (input.s) dy += 1;
  if (input.a) dx -= 1;
  if (input.d) dx += 1;

  if (dx !== 0 || dy !== 0) {
    const len = Math.hypot(dx, dy);
    dx /= len;
    dy /= len;
    tank.angle = Math.atan2(dy, dx);

    const speed = tank.speed * (turboActive ? TURBO_MULTIPLIER : 1);
    const nx = tank.x + dx * speed * dt;
    const ny = tank.y + dy * speed * dt;

    // Axis-separated collision so tanks can slide along walls
    if (isWalkable(nx, tank.y)) tank.x = nx;
    if (isWalkable(tank.x, ny)) tank.y = ny;
  }

  tank.turretAngle = input.turretAngle ?? tank.turretAngle;
}

export function applyBullets(bullets, dt) {
  for (const [id, b] of bullets) {
    b.x += Math.cos(b.angle) * BULLET_SPEED * dt;
    b.y += Math.sin(b.angle) * BULLET_SPEED * dt;
    b.lifetime -= dt;
    if (b.lifetime <= 0 || !isWalkable(b.x, b.y)) {
      bullets.delete(id);
    }
  }
}

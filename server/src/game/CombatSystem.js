import { TANK_RADIUS, KILLS_TO_WIN, TANK_MAX_HP } from '@tank-arena/shared';

export function checkBulletHits(tanks, bullets, state) {
  for (const [bid, bullet] of bullets) {
    for (const [tid, tank] of tanks) {
      if (!tank.alive) continue;
      if (tid === bullet.ownerId) continue;
      if (tank.team === bullet.ownerTeam) continue; // no friendly fire
      if (tank.shieldActive) continue;

      const dist = Math.hypot(tank.x - bullet.x, tank.y - bullet.y);
      if (dist < TANK_RADIUS) {
        tank.hp -= bullet.damage;
        bullets.delete(bid);

        if (tank.hp <= 0) {
          tank.alive = false;
          tank.deaths += 1;
          const shooter = tanks.get(bullet.ownerId);
          if (shooter) shooter.kills += 1;
          if (bullet.ownerTeam === 'red') state.redScore += 1;
          else state.blueScore += 1;
        }
        break;
      }
    }
  }
}

export function checkWinCondition(state) {
  if (state.redScore >= KILLS_TO_WIN) return 'red';
  if (state.blueScore >= KILLS_TO_WIN) return 'blue';
  return null;
}

export function respawnTank(tank, spawnPoint) {
  tank.x = spawnPoint.x;
  tank.y = spawnPoint.y;
  tank.hp = TANK_MAX_HP;
  tank.alive = true;
  tank.respawnIn = 0;
}

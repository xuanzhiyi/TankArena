import { OVAL_MAP, MAP_SPAWNS, MAP_ROWS, MAP_COLS } from '@tank-arena/shared';

export function isWalkable(wx, wy) {
  const col = Math.floor(wx);
  const row = Math.floor(wy);
  if (col < 0 || col >= MAP_COLS || row < 0 || row >= MAP_ROWS) return false;
  return OVAL_MAP[row][col] !== 0;
}

export function getSpawnPoints() {
  return MAP_SPAWNS;
}

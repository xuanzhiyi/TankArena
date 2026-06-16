import { TILE_W, TILE_H } from '@tank-arena/shared';

export function worldToScreen(wx, wy) {
  return {
    sx: (wx - wy) * (TILE_W / 2),
    sy: (wx + wy) * (TILE_H / 2),
  };
}

export function screenToWorld(sx, sy) {
  return {
    wx: (sx / (TILE_W / 2) + sy / (TILE_H / 2)) / 2,
    wy: (sy / (TILE_H / 2) - sx / (TILE_W / 2)) / 2,
  };
}

export function tileToScreen(col, row) {
  return worldToScreen(col, row);
}

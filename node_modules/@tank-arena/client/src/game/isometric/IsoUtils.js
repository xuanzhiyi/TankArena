import { TILE_W, TILE_H as DEFAULT_TILE_H } from '@tank-arena/shared';

let _tileH = DEFAULT_TILE_H;

export function getTileH() { return _tileH; }
export function setTileH(h) { _tileH = h; }

export function worldToScreen(wx, wy) {
  return {
    sx: (wx - wy) * (TILE_W / 2),
    sy: (wx + wy) * (_tileH / 2),
  };
}

export function screenToWorld(sx, sy) {
  return {
    wx: (sx / (TILE_W / 2) + sy / (_tileH / 2)) / 2,
    wy: (sy / (_tileH / 2) - sx / (TILE_W / 2)) / 2,
  };
}

export function tileToScreen(col, row) {
  return worldToScreen(col, row);
}

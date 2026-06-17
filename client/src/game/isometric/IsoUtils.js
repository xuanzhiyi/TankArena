import { TILE_W, TILE_H as DEFAULT_TILE_H } from '@tank-arena/shared';

let _tileH    = DEFAULT_TILE_H;
let _azimuth  = 0; // camera orbit angle in radians

export function getTileH()    { return _tileH; }
export function setTileH(h)   { _tileH = h; }
export function getAzimuth()  { return _azimuth; }
export function setAzimuth(a) { _azimuth = a; }

export function worldToScreen(wx, wy) {
  // Rotate world coords by azimuth, then apply isometric projection
  const cos = Math.cos(_azimuth), sin = Math.sin(_azimuth);
  const cx = wx * cos - wy * sin;
  const cy = wx * sin + wy * cos;
  return {
    sx: (cx - cy) * (TILE_W / 2),
    sy: (cx + cy) * (_tileH / 2),
  };
}

export function screenToWorld(sx, sy) {
  // Inverse isometric, then inverse azimuth rotation
  const cx = (sx / (TILE_W / 2) + sy / (_tileH / 2)) / 2;
  const cy = (sy / (_tileH / 2) - sx / (TILE_W / 2)) / 2;
  const cos = Math.cos(-_azimuth), sin = Math.sin(-_azimuth);
  return {
    wx: cx * cos - cy * sin,
    wy: cx * sin + cy * cos,
  };
}

export function tileToScreen(col, row) {
  return worldToScreen(col, row);
}

import * as PIXI from 'pixi.js';

export function createBulletSprite() {
  const g = new PIXI.Graphics();
  g.circle(0, 0, 4).fill({ color: 0xffd60a });
  return g;
}

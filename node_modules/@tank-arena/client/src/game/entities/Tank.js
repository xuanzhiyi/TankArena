import * as PIXI from 'pixi.js';
import { TILE_W, TILE_H } from '@tank-arena/shared';

const TEAM_COLORS = {
  red: { body: 0xe63946, outline: 0xc1121f },
  blue: { body: 0x457b9d, outline: 0x1d3557 },
};

export function createTankSprite(team) {
  const colors = TEAM_COLORS[team] || TEAM_COLORS.blue;
  const container = new PIXI.Container();

  // Body: isometric diamond shape
  const body = new PIXI.Graphics();
  const hw = TILE_W / 4;
  const hh = TILE_H / 4;
  body.poly([hw, 0, hw * 2, hh, hw, hh * 2, 0, hh])
    .fill({ color: colors.body })
    .stroke({ color: colors.outline, width: 2 });
  container.addChild(body);

  // Turret: rectangle pointing right by default
  const turret = new PIXI.Graphics();
  turret.rect(-3, -10, 6, 14).fill({ color: 0x2b2d42 });
  turret.label = 'turret';
  turret.x = hw;
  turret.y = hh;
  container.addChild(turret);

  // Shield ring (hidden by default)
  const shield = new PIXI.Graphics();
  shield.circle(hw, hh, hw + 6).stroke({ color: 0x48cae4, width: 3, alpha: 0.8 });
  shield.label = 'shield';
  shield.visible = false;
  container.addChild(shield);

  return container;
}

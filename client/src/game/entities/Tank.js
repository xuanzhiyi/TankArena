import * as PIXI from 'pixi.js';

export const TEAM_COLORS = {
  red:  { body: 0xe63946, outline: 0xc1121f },
  blue: { body: 0x457b9d, outline: 0x1d3557 },
};

export function createTankSprite(team) {
  const colors = TEAM_COLORS[team] ?? TEAM_COLORS.blue;
  const container = new PIXI.Container();

  // ── Vehicle: empty Graphics redrawn each frame by Renderer ──
  const vehicle = new PIXI.Graphics();
  vehicle.label = 'vehicle';
  // Store team colors so Renderer can use them without knowing the team
  vehicle._bodyColor   = colors.body;
  vehicle._outlineColor = colors.outline;
  container.addChild(vehicle);

  // ── Turret: empty Graphics redrawn each frame by Renderer ──
  const turret = new PIXI.Graphics();
  turret.label = 'turret';
  container.addChild(turret);

  // ── Shield ring ──
  const shield = new PIXI.Graphics();
  shield.circle(0, 0, 36).stroke({ color: 0x48cae4, width: 3, alpha: 0.85 });
  shield.label = 'shield';
  shield.visible = false;
  container.addChild(shield);

  return container;
}

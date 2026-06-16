import * as PIXI from 'pixi.js';
import { OVAL_MAP, TILE_W, TILE_H, MAP_COLS, MAP_ROWS } from '@tank-arena/shared';
import { worldToScreen, tileToScreen } from './isometric/IsoUtils.js';
import { createTankSprite } from './entities/Tank.js';
import { createBulletSprite } from './entities/Bullet.js';

export class Renderer {
  constructor(container) {
    this.container = container;
    this.app = null;
    this.tankSprites = new Map();
    this.bulletSprites = new Map();
    this.mapContainer = null;
    this.entityContainer = null;
    this.viewportX = 0;
    this.viewportY = 0;
    this._ready = false;
    this._init();
  }

  async _init() {
    this.app = new PIXI.Application();
    await this.app.init({
      resizeTo: this.container,
      background: '#1a1a2e',
      antialias: true,
    });
    this.container.appendChild(this.app.canvas);
    this.mapContainer = new PIXI.Container();
    this.entityContainer = new PIXI.Container();
    this.app.stage.addChild(this.mapContainer);
    this.app.stage.addChild(this.entityContainer);
    this._buildMap();
    this._ready = true;
  }

  _buildMap() {
    // Find screen coords of map center tile so we can offset to screen center
    const centerCol = MAP_COLS / 2;
    const centerRow = MAP_ROWS / 2;
    const { sx: csx, sy: csy } = tileToScreen(centerCol, centerRow);
    const offsetX = this.app.screen.width / 2 - csx;
    const offsetY = this.app.screen.height / 2 - csy;
    this.viewportX = offsetX;
    this.viewportY = offsetY;

    OVAL_MAP.forEach((row, r) => {
      row.forEach((tile, c) => {
        if (!tile) return;
        const { sx, sy } = tileToScreen(c, r);
        const g = new PIXI.Graphics();
        const color = tile === 2 ? 0x1b4332 : 0x2d6a4f;
        const borderColor = tile === 2 ? 0x40916c : 0x52b788;
        g.poly([
          TILE_W / 2, 0,
          TILE_W, TILE_H / 2,
          TILE_W / 2, TILE_H,
          0, TILE_H / 2,
        ]).fill({ color }).stroke({ color: borderColor, width: 1, alpha: 0.4 });
        g.x = sx + offsetX;
        g.y = sy + offsetY;
        this.mapContainer.addChild(g);
      });
    });
  }

  // Called by StateSync when a new tank joins
  addTank(sessionId, tankState) {
    if (this.tankSprites.has(sessionId)) return;
    const sprite = createTankSprite(tankState.team);
    this.entityContainer.addChild(sprite);
    this.tankSprites.set(sessionId, sprite);
  }

  removeTank(sessionId) {
    const sprite = this.tankSprites.get(sessionId);
    if (sprite) {
      this.entityContainer.removeChild(sprite);
      sprite.destroy();
      this.tankSprites.delete(sessionId);
    }
  }

  addBullet(bulletId, bulletState) {
    if (this.bulletSprites.has(bulletId)) return;
    const sprite = createBulletSprite();
    this.entityContainer.addChild(sprite);
    this.bulletSprites.set(bulletId, sprite);
  }

  removeBullet(bulletId) {
    const sprite = this.bulletSprites.get(bulletId);
    if (sprite) {
      this.entityContainer.removeChild(sprite);
      sprite.destroy();
      this.bulletSprites.delete(bulletId);
    }
  }

  // Returns tank screen position for input handler (turret aiming)
  getTankScreenPos(sessionId) {
    const sprite = this.tankSprites.get(sessionId);
    if (!sprite) return { x: 0, y: 0 };
    return { x: sprite.x + TILE_W / 4, y: sprite.y + TILE_H / 4 };
  }

  // Re-center viewport on local player's position each frame
  _updateViewport(localTank, myId, serverState) {
    let wx, wy;
    if (localTank) {
      wx = localTank.x;
      wy = localTank.y;
    } else if (serverState && serverState.tanks && serverState.tanks.get) {
      const t = serverState.tanks.get(myId);
      if (t) { wx = t.x; wy = t.y; }
    }
    if (wx != null) {
      const { sx, sy } = worldToScreen(wx, wy);
      const newVX = this.app.screen.width / 2 - sx;
      const newVY = this.app.screen.height / 2 - sy;
      // Shift map container by the delta from initial build offset
      this.mapContainer.x += newVX - this.viewportX;
      this.mapContainer.y += newVY - this.viewportY;
      this.viewportX = newVX;
      this.viewportY = newVY;
    }
  }

  render(serverState, localTank, myId) {
    if (!this._ready || !serverState) return;

    this._updateViewport(localTank, myId, serverState);

    // Update tank sprites
    serverState.tanks.forEach((tank, sid) => {
      let sprite = this.tankSprites.get(sid);
      if (!sprite) return;

      const useLocal = sid === myId && localTank;
      const wx = useLocal ? localTank.x : tank.x;
      const wy = useLocal ? localTank.y : tank.y;
      const angle = useLocal ? localTank.angle : tank.angle;
      const turretAngle = tank.turretAngle;

      const { sx, sy } = worldToScreen(wx, wy);
      sprite.x = sx + this.viewportX;
      sprite.y = sy + this.viewportY;

      // Body rotation (isometric: visual angle is half of world angle)
      const bodyChild = sprite.getChildAt(0);
      if (bodyChild) bodyChild.rotation = angle;

      // Turret rotation
      const turretChild = sprite.getChildByLabel('turret');
      if (turretChild) turretChild.rotation = turretAngle;

      // Shield visual
      const shieldChild = sprite.getChildByLabel('shield');
      if (shieldChild) shieldChild.visible = tank.shieldActive;

      sprite.visible = tank.alive;
    });

    // Update bullet sprites
    serverState.bullets.forEach((bullet, bid) => {
      const sprite = this.bulletSprites.get(bid);
      if (!sprite) return;
      const { sx, sy } = worldToScreen(bullet.x, bullet.y);
      sprite.x = sx + this.viewportX;
      sprite.y = sy + this.viewportY;
    });
  }

  destroy() {
    if (this.app) this.app.destroy(true);
  }
}

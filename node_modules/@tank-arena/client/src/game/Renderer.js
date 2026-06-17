import * as PIXI from 'pixi.js';
import { OVAL_MAP, TILE_W } from '@tank-arena/shared';
import { worldToScreen, tileToScreen, getTileH, setTileH } from './isometric/IsoUtils.js';
import { createTankSprite } from './entities/Tank.js';
import { createBulletSprite } from './entities/Bullet.js';

const ZOOM = 3.0;

const ANGLE_MIN  = 5;
const ANGLE_MAX  = 50;
const ANGLE_RATE = 25; // degrees per second while key is held
const SCROLL_SENSITIVITY = 0.05; // degrees per pixel of scroll delta

const TANK_L = 0.38;
const TANK_W = 0.22;
const VEHICLE_ELEV = 8;  // screen px — prism height

const DOME_R    = 0.22;
const DOME_ELEV = 14;

// ---------- drawing helpers ----------

function _isoSquare(S, angle, dy = 0) {
  const cos = Math.cos(angle), sin = Math.sin(angle);
  const H = getTileH();
  const p = (wx, wy) => [(wx - wy) * (TILE_W / 2), (wx + wy) * (H / 2) + dy];
  return [
    ...p( S * cos - S * sin,  S * sin + S * cos),
    ...p( S * cos + S * sin,  S * sin - S * cos),
    ...p(-S * cos + S * sin, -S * sin - S * cos),
    ...p(-S * cos - S * sin, -S * sin + S * cos),
  ];
}

function drawIsoTurret(g, angle) {
  const H = getTileH();
  const proj = (wx, wy) => [(wx - wy) * (TILE_W / 2), (wx + wy) * (H / 2)];
  const cos = Math.cos(angle), sin = Math.sin(angle);

  const CL = 0.44, CW = 0.055;
  const [cbl0, cbl1] = proj(-CW * sin,  CW * cos);
  const [cbr0, cbr1] = proj( CW * sin, -CW * cos);
  const [ctr0, ctr1] = proj(CL * cos + CW * sin, CL * sin - CW * cos);
  const [ctl0, ctl1] = proj(CL * cos - CW * sin, CL * sin + CW * cos);

  const E = DOME_ELEV;
  g.clear();
  g.poly([cbl0, cbl1, cbr0, cbr1, cbr0, cbr1 - E, cbl0, cbl1 - E]).fill({ color: 0x0d0d1a });
  g.poly([cbl0, cbl1 - E, cbr0, cbr1 - E, ctr0, ctr1 - E, ctl0, ctl1 - E]).fill({ color: 0x1a1a2e });
  g.poly(_isoSquare(DOME_R * 1.08, angle, E * 0.6)).fill({ color: 0x0d0d1a });
  g.poly(_isoSquare(DOME_R, angle, -E)).fill({ color: 0x3d405b });
}

function drawIsoVehicle(g, angle) {
  const H = getTileH();
  const proj = (wx, wy) => [(wx - wy) * (TILE_W / 2), (wx + wy) * (H / 2)];
  const cos = Math.cos(angle), sin = Math.sin(angle);

  const fl  = proj( TANK_L * cos - TANK_W * sin,  TANK_L * sin + TANK_W * cos);
  const fr  = proj( TANK_L * cos + TANK_W * sin,  TANK_L * sin - TANK_W * cos);
  const br  = proj(-TANK_L * cos + TANK_W * sin, -TANK_L * sin - TANK_W * cos);
  const bl  = proj(-TANK_L * cos - TANK_W * sin, -TANK_L * sin + TANK_W * cos);
  const tip = proj(TANK_L * 1.55 * cos, TANK_L * 1.55 * sin);

  const E = VEHICLE_ELEV;
  // Ground-level (dark) — visible below the raised top creates the prism side faces
  const gBody = [fl, fr, br, bl].flatMap(p => p);
  const gNose = [fl, fr, tip].flatMap(p => p);
  // Elevated top face
  const tBody = [fl, fr, br, bl].flatMap(([x, y]) => [x, y - E]);
  const tNose = [fl, fr, tip].flatMap(([x, y]) => [x, y - E]);

  g.clear();
  g.poly(gBody).fill({ color: g._outlineColor });
  g.poly(gNose).fill({ color: g._outlineColor });
  g.poly(tBody).fill({ color: g._bodyColor }).stroke({ color: g._outlineColor, width: 1.5 });
  g.poly(tNose).fill({ color: g._outlineColor });
}

// ---------- tile helpers ----------

function _tileShape(H) {
  return [TILE_W / 2, 0, TILE_W, H / 2, TILE_W / 2, H, 0, H / 2];
}

// ---------- Renderer ----------

export class Renderer {
  constructor(container) {
    this.container = container;
    this.app = null;
    this.tankSprites = new Map();
    this.bulletSprites = new Map();
    this.worldContainer = null;
    this.mapContainer = null;
    this.entityContainer = null;
    this._ready = false;
    this._angleDeg = ANGLE_MIN;
    this._arrowUp   = false;
    this._arrowDown = false;
    this._tileGraphics = []; // store refs for in-place angle updates
    this._onAngleKey   = this._onAngleKey.bind(this);
    this._onScroll     = this._onScroll.bind(this);
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

    this.worldContainer = new PIXI.Container();
    this.worldContainer.scale.set(ZOOM);
    this.app.stage.addChild(this.worldContainer);

    this.mapContainer    = new PIXI.Container();
    this.entityContainer = new PIXI.Container();
    this.worldContainer.addChild(this.mapContainer);
    this.worldContainer.addChild(this.entityContainer);

    this._buildMap();
    this._ready = true;

    window.addEventListener('keydown', this._onAngleKey);
    window.addEventListener('keyup',   this._onAngleKey);
    window.addEventListener('wheel',   this._onScroll, { passive: false });

    this._angleDirty = false;

    // Smooth angle update: runs every frame; handles held arrow keys and scroll dirty flag.
    this.app.ticker.add((ticker) => {
      let changed = this._angleDirty;
      this._angleDirty = false;
      const delta = ticker.deltaMS / 1000;
      if (this._arrowUp)   { this._angleDeg = Math.min(ANGLE_MAX, this._angleDeg + ANGLE_RATE * delta); changed = true; }
      if (this._arrowDown) { this._angleDeg = Math.max(ANGLE_MIN, this._angleDeg - ANGLE_RATE * delta); changed = true; }
      if (!changed) return;
      setTileH(TILE_W * Math.tan(this._angleDeg * Math.PI / 180));
      this._updateMapAngle();
    });
  }

  _onScroll(e) {
    e.preventDefault();
    // scroll up (deltaY < 0) → increase angle, scroll down → decrease
    this._angleDeg = Math.min(ANGLE_MAX, Math.max(ANGLE_MIN,
      this._angleDeg - e.deltaY * SCROLL_SENSITIVITY));
    this._angleDirty = true; // actual redraw deferred to next ticker frame
  }

  _onAngleKey(e) {
    if (e.code !== 'ArrowUp' && e.code !== 'ArrowDown') return;
    e.preventDefault();
    const down = e.type === 'keydown';
    if (e.code === 'ArrowUp')   this._arrowUp   = down;
    if (e.code === 'ArrowDown') this._arrowDown = down;
  }

  _buildMap() {
    this._tileGraphics = [];
    OVAL_MAP.forEach((row, r) => {
      row.forEach((tile, c) => {
        if (!tile) return;
        const { sx, sy } = tileToScreen(c, r);
        const g = new PIXI.Graphics();
        g._tileCol = c;
        g._tileRow = r;
        g._fillColor   = tile === 2 ? 0x1b4332 : 0x2d6a4f;
        g._borderColor = tile === 2 ? 0x40916c : 0x52b788;
        const H = getTileH();
        g.poly(_tileShape(H)).fill({ color: g._fillColor })
         .stroke({ color: g._borderColor, width: 0.5, alpha: 0.5 });
        g.x = sx;
        g.y = sy;
        this.mapContainer.addChild(g);
        this._tileGraphics.push(g);
      });
    });
  }

  // Update tile positions and shapes in-place (no destroy) for smooth angle changes.
  _updateMapAngle() {
    const H = getTileH();
    const shape = _tileShape(H);
    for (const g of this._tileGraphics) {
      const { sx, sy } = tileToScreen(g._tileCol, g._tileRow);
      g.clear();
      g.poly(shape).fill({ color: g._fillColor })
       .stroke({ color: g._borderColor, width: 0.5, alpha: 0.5 });
      g.x = sx;
      g.y = sy;
    }
  }

  _updateCamera(localTankWx, localTankWy) {
    const H = getTileH();
    const { sx, sy } = worldToScreen(localTankWx, localTankWy);
    this.worldContainer.x = this.app.screen.width  / 2 - (sx + TILE_W / 2) * ZOOM;
    this.worldContainer.y = this.app.screen.height / 2 - (sy + H / 2) * ZOOM;
  }

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

  addBullet(bulletId) {
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

  getTankScreenPos(sessionId) {
    const sprite = this.tankSprites.get(sessionId);
    if (!sprite || !this.worldContainer) return { x: 0, y: 0 };
    return {
      x: sprite.x * ZOOM + this.worldContainer.x,
      y: sprite.y * ZOOM + this.worldContainer.y,
    };
  }

  render(serverState, localTank, myId) {
    if (!this._ready || !serverState) return;

    const H = getTileH();

    const camSource = localTank ?? (() => {
      const t = serverState.tanks.get(myId);
      return t ? { x: t.x, y: t.y } : null;
    })();
    if (camSource) this._updateCamera(camSource.x, camSource.y);

    serverState.tanks.forEach((tank, sid) => {
      const sprite = this.tankSprites.get(sid);
      if (!sprite) return;

      const useLocal = sid === myId && localTank;
      const wx = useLocal ? localTank.x : tank.x;
      const wy = useLocal ? localTank.y : tank.y;

      const { sx, sy } = worldToScreen(wx, wy);
      sprite.x = sx + TILE_W / 2;
      sprite.y = sy + H / 2;

      const angle = useLocal ? localTank.angle : tank.angle;
      const vehicleChild = sprite.getChildByLabel('vehicle');
      if (vehicleChild) drawIsoVehicle(vehicleChild, angle);

      const turretChild = sprite.getChildByLabel('turret');
      if (turretChild) drawIsoTurret(turretChild, tank.turretAngle);

      const shieldChild = sprite.getChildByLabel('shield');
      if (shieldChild) shieldChild.visible = tank.shieldActive;

      sprite.visible = tank.alive;
    });

    serverState.bullets.forEach((bullet, bid) => {
      const sprite = this.bulletSprites.get(bid);
      if (!sprite) return;
      const { sx, sy } = worldToScreen(bullet.x, bullet.y);
      sprite.x = sx;
      sprite.y = sy;
    });
  }

  destroy() {
    window.removeEventListener('keydown', this._onAngleKey);
    window.removeEventListener('keyup',   this._onAngleKey);
    window.removeEventListener('wheel',   this._onScroll);
    if (this.app) this.app.destroy(true);
  }
}

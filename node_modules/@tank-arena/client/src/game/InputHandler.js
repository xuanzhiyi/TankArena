import { screenToWorld } from './isometric/IsoUtils.js';

export class InputHandler {
  constructor(canvas) {
    this.keys = { w: false, a: false, s: false, d: false, q: false, e: false };
    this.mouse = { x: 0, y: 0, shooting: false };
    this._canvas = canvas;
    this._onKey = this._onKey.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseDown = this._onMouseDown.bind(this);
    this._onMouseUp = this._onMouseUp.bind(this);
    window.addEventListener('keydown', this._onKey);
    window.addEventListener('keyup', this._onKey);
    canvas.addEventListener('mousemove', this._onMouseMove);
    canvas.addEventListener('mousedown', this._onMouseDown);
    canvas.addEventListener('mouseup', this._onMouseUp);
    // Prevent right-click menu on canvas
    canvas.addEventListener('contextmenu', e => e.preventDefault());
  }

  _onKey(e) {
    const down = e.type === 'keydown';
    switch (e.code) {
      case 'KeyW': this.keys.w = down; break;
      case 'KeyA': this.keys.a = down; break;
      case 'KeyS': this.keys.s = down; break;
      case 'KeyD': this.keys.d = down; break;
      case 'KeyQ': this.keys.q = down; break;
      case 'KeyE': this.keys.e = down; break;
    }
  }

  _onMouseMove(e) {
    const rect = this._canvas.getBoundingClientRect();
    this.mouse.x = e.clientX - rect.left;
    this.mouse.y = e.clientY - rect.top;
  }

  _onMouseDown(e) {
    if (e.button === 0) this.mouse.shooting = true;
  }

  _onMouseUp(e) {
    if (e.button === 0) this.mouse.shooting = false;
  }

  // tankScreenPos: {x, y} screen coords of local tank center
  getInputPacket(tankScreenPos) {
    // Compute mouse delta from tank in screen space, then convert to world space
    // This gives the correct turret angle in world coordinates
    const dsx = this.mouse.x - tankScreenPos.x;
    const dsy = this.mouse.y - tankScreenPos.y;
    const { wx, wy } = screenToWorld(dsx, dsy);
    const turretAngle = Math.atan2(wy, wx);

    return {
      w: this.keys.w,
      a: this.keys.a,
      s: this.keys.s,
      d: this.keys.d,
      turretAngle,
      shoot: this.mouse.shooting,
      shield: this.keys.q,
      turbo: this.keys.e,
    };
  }

  destroy() {
    window.removeEventListener('keydown', this._onKey);
    window.removeEventListener('keyup', this._onKey);
    this._canvas.removeEventListener('mousemove', this._onMouseMove);
    this._canvas.removeEventListener('mousedown', this._onMouseDown);
    this._canvas.removeEventListener('mouseup', this._onMouseUp);
  }
}

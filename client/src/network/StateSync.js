export class StateSync {
  constructor(room, renderer) {
    this.room = room;
    this.renderer = renderer;

    room.state.tanks.onAdd((tank, sessionId) => {
      renderer.addTank(sessionId, tank);
    });

    room.state.tanks.onRemove((tank, sessionId) => {
      renderer.removeTank(sessionId);
    });

    room.state.bullets.onAdd((bullet, bulletId) => {
      renderer.addBullet(bulletId, bullet);
    });

    room.state.bullets.onRemove((bullet, bulletId) => {
      renderer.removeBullet(bulletId);
    });
  }
}

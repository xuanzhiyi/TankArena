import pkg from 'colyseus';
const { Room } = pkg;

// Minimal lobby room — just a holding area before joining GameRoom.
// For MVP, clients join GameRoom directly; this can be extended later.
export class LobbyRoom extends Room {
  onCreate() {
    this.onMessage('chat', (client, msg) => {
      this.broadcast('chat', { from: client.sessionId, text: msg });
    });
  }

  onJoin(client, options = {}) {
    this.broadcast('playerJoined', { name: options.name ?? 'unknown' });
  }

  onLeave(client) {
    this.broadcast('playerLeft', { id: client.sessionId });
  }
}

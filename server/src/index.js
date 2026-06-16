import pkg from 'colyseus';
const { Server } = pkg;
import { createServer } from 'http';
import { GameRoom } from './rooms/GameRoom.js';
import { LobbyRoom } from './rooms/LobbyRoom.js';

const port = 2567;
const httpServer = createServer();
const gameServer = new Server({ server: httpServer });

gameServer.define('game', GameRoom);
gameServer.define('lobby', LobbyRoom);

httpServer.listen(port, () => {
  console.log(`Colyseus listening on ws://localhost:${port}`);
});

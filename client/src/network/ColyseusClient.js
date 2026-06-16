import * as Colyseus from 'colyseus.js';

let _client = null;

function getClient() {
  if (!_client) {
    _client = new Colyseus.Client('ws://localhost:2567');
  }
  return _client;
}

export async function joinGame(playerName) {
  return getClient().joinOrCreate('game', { name: playerName });
}

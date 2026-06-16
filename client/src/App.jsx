import React, { useState, useRef, useCallback } from 'react';
import GameCanvas from './game/GameCanvas.jsx';
import Lobby from './ui/Lobby.jsx';
import HUD from './ui/HUD.jsx';
import { joinGame } from './network/ColyseusClient.js';
import { StateSync } from './network/StateSync.js';
import { InputHandler } from './game/InputHandler.js';
import { GameEngine } from './game/GameEngine.js';

export default function App() {
  const [phase, setPhase] = useState('lobby'); // lobby | game
  const [room, setRoom] = useState(null);
  const roomRef = useRef(null);          // always has the current room, safe in closures
  const rendererRef = useRef(null);
  const engineRef = useRef(null);
  const inputRef = useRef(null);

  const handleRendererReady = useCallback((renderer) => {
    rendererRef.current = renderer;
  }, []);

  async function handleJoin(playerName) {
    const r = await joinGame(playerName);
    roomRef.current = r;
    setRoom(r);

    // Wire state sync (tank/bullet add/remove → renderer)
    new StateSync(r, rendererRef.current);

    // Wait for PixiJS renderer to be ready, then start engine
    async function startEngine() {
      let canvas = rendererRef.current?.app?.canvas;
      if (!canvas) {
        await new Promise(resolve => {
          const id = setInterval(() => {
            canvas = rendererRef.current?.app?.canvas;
            if (canvas) { clearInterval(id); resolve(); }
          }, 50);
        });
      }
      inputRef.current = new InputHandler(canvas);
      engineRef.current = new GameEngine(rendererRef.current, inputRef.current, r);
      engineRef.current.start();
      setPhase('game');
    }

    r.onMessage('matchStarted', startEngine);

    // If match already playing (late join), start immediately
    if (r.state.phase === 'playing') startEngine();
  }

  function handleDevStart() {
    roomRef.current?.send('devStart');
  }

  function handleRestart() {
    engineRef.current?.stop();
    inputRef.current?.destroy();
    roomRef.current?.leave();
    roomRef.current = null;
    setRoom(null);
    setPhase('lobby');
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <GameCanvas onRendererReady={handleRendererReady} />
      {phase === 'lobby' && <Lobby onJoin={handleJoin} onDevStart={handleDevStart} />}
      {phase === 'game' && <HUD room={room} onRestart={handleRestart} />}
    </div>
  );
}

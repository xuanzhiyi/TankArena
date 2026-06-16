import React, { useEffect, useRef } from 'react';
import { Renderer } from './Renderer.js';

export default function GameCanvas({ onRendererReady }) {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const renderer = new Renderer(containerRef.current);
    rendererRef.current = renderer;
    if (onRendererReady) onRendererReady(renderer);
    return () => renderer.destroy();
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: '100vw', height: '100vh', position: 'absolute', top: 0, left: 0 }}
    />
  );
}

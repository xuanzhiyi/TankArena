import React, { useState } from 'react';

const styles = {
  overlay: {
    position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: 'rgba(10, 10, 30, 0.92)', color: '#e0e0e0', fontFamily: 'monospace', zIndex: 10,
  },
  title: { fontSize: 48, fontWeight: 'bold', color: '#ffd60a', marginBottom: 8, letterSpacing: 2 },
  subtitle: { fontSize: 16, color: '#aaa', marginBottom: 40 },
  input: {
    padding: '12px 20px', fontSize: 18, borderRadius: 6, border: '2px solid #457b9d',
    background: '#1a1a2e', color: '#e0e0e0', marginBottom: 20, width: 260, textAlign: 'center',
    outline: 'none',
  },
  btn: {
    padding: '14px 40px', fontSize: 18, fontWeight: 'bold', borderRadius: 6, border: 'none',
    background: '#e63946', color: '#fff', cursor: 'pointer', letterSpacing: 1,
    transition: 'background 0.2s',
  },
  waiting: { marginTop: 20, color: '#aaa', fontSize: 14 },
  error: { color: '#e63946', marginTop: 12, fontSize: 13 },
};

export default function Lobby({ onJoin, onDevStart }) {
  const [name, setName] = useState('');
  const [status, setStatus] = useState('idle'); // idle | connecting | waiting
  const [error, setError] = useState('');

  async function handleJoin() {
    if (!name.trim()) { setError('Enter a name to join'); return; }
    setStatus('connecting');
    setError('');
    try {
      await onJoin(name.trim());
      setStatus('waiting');
    } catch (e) {
      setError('Could not connect to server. Is it running?');
      setStatus('idle');
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleJoin();
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.title}>TANK ARENA</div>
      <div style={styles.subtitle}>3v3 isometric tank combat</div>
      {status === 'idle' || status === 'connecting' ? (
        <>
          <input
            style={styles.input}
            placeholder="Enter your name"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={16}
            autoFocus
          />
          <button
            style={styles.btn}
            onClick={handleJoin}
            disabled={status === 'connecting'}
          >
            {status === 'connecting' ? 'Connecting...' : 'JOIN GAME'}
          </button>
          {error && <div style={styles.error}>{error}</div>}
        </>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <div style={styles.waiting}>⏳ Waiting for players… (need 6 to auto-start)</div>
          <button
            style={{ ...styles.btn, marginTop: 20, background: '#2d6a4f', fontSize: 14 }}
            onClick={() => onDevStart && onDevStart()}
          >
            ▶ Start Now (Dev)
          </button>
        </div>
      )}
    </div>
  );
}

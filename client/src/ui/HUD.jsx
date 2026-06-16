import React, { useEffect, useState } from 'react';

const S = {
  hud: {
    position: 'absolute', inset: 0, pointerEvents: 'none',
    fontFamily: 'monospace', color: '#e0e0e0', zIndex: 5,
  },
  scores: {
    position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
    display: 'flex', gap: 40, fontSize: 24, fontWeight: 'bold',
  },
  red: { color: '#e63946' },
  blue: { color: '#457b9d' },
  bottomBar: {
    position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
    display: 'flex', gap: 20, alignItems: 'center',
  },
  hpBar: { width: 160, height: 14, background: '#333', borderRadius: 7, overflow: 'hidden' },
  hpFill: (pct, team) => ({
    height: '100%', borderRadius: 7, transition: 'width 0.2s',
    width: `${pct}%`,
    background: team === 'red' ? '#e63946' : '#457b9d',
  }),
  ability: (ready) => ({
    padding: '4px 12px', borderRadius: 5, fontSize: 13, fontWeight: 'bold',
    background: ready ? '#2d6a4f' : '#333',
    color: ready ? '#52b788' : '#666',
    border: `1px solid ${ready ? '#52b788' : '#555'}`,
  }),
  winOverlay: {
    position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: 'rgba(10,10,30,0.85)', fontSize: 48, fontWeight: 'bold',
    letterSpacing: 2,
  },
  replayBtn: {
    marginTop: 24, padding: '12px 32px', fontSize: 18, borderRadius: 6,
    border: 'none', background: '#e63946', color: '#fff', cursor: 'pointer',
    pointerEvents: 'all',
  },
};

export default function HUD({ room, onRestart }) {
  const [snapshot, setSnapshot] = useState(null);

  useEffect(() => {
    if (!room) return;
    const interval = setInterval(() => {
      const state = room.state;
      const myTank = state.tanks.get(room.sessionId);
      setSnapshot({
        redScore: state.redScore,
        blueScore: state.blueScore,
        phase: state.phase,
        hp: myTank?.hp ?? 0,
        maxHp: 100,
        team: myTank?.team ?? 'red',
        shieldCooldown: myTank?.shieldCooldown ?? 0,
        turboCooldown: myTank?.turboCooldown ?? 0,
        shieldActive: myTank?.shieldActive ?? false,
        turboActive: myTank?.turboActive ?? false,
        respawnIn: myTank?.alive === false ? (myTank?.respawnIn ?? 0) : 0,
      });
    }, 50); // poll at 20Hz — cheap since state is already local
    return () => clearInterval(interval);
  }, [room]);

  if (!snapshot) return null;

  const { redScore, blueScore, phase, hp, maxHp, team, shieldCooldown, turboCooldown,
          shieldActive, turboActive, respawnIn } = snapshot;

  const hpPct = Math.max(0, (hp / maxHp) * 100);
  const shieldReady = shieldCooldown <= 0 && !shieldActive;
  const turboReady = turboCooldown <= 0 && !turboActive;

  return (
    <div style={S.hud}>
      {/* Scores */}
      <div style={S.scores}>
        <span style={S.red}>🔴 {redScore}</span>
        <span style={{ color: '#aaa', fontSize: 18, alignSelf: 'center' }}>vs</span>
        <span style={S.blue}>{blueScore} 🔵</span>
      </div>

      {/* Bottom bar: HP + abilities */}
      <div style={S.bottomBar}>
        <div>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 3 }}>HP</div>
          <div style={S.hpBar}>
            <div style={S.hpFill(hpPct, team)} />
          </div>
          <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{Math.max(0, hp)}/{maxHp}</div>
        </div>
        <div style={S.ability(shieldReady || shieldActive)}>
          Q {shieldActive ? 'ACTIVE' : shieldReady ? 'Ready' : `${shieldCooldown.toFixed(1)}s`}
        </div>
        <div style={S.ability(turboReady || turboActive)}>
          E {turboActive ? 'ACTIVE' : turboReady ? 'Ready' : `${turboCooldown.toFixed(1)}s`}
        </div>
      </div>

      {/* Respawn notice */}
      {respawnIn > 0 && (
        <div style={{ position: 'absolute', top: '45%', left: '50%', transform: 'translate(-50%,-50%)',
          fontSize: 22, color: '#ffd60a', fontWeight: 'bold' }}>
          Respawning in {Math.ceil(respawnIn)}s…
        </div>
      )}

      {/* Win overlay */}
      {phase === 'ended' && (
        <div style={S.winOverlay}>
          <div style={{ color: redScore > blueScore ? '#e63946' : '#457b9d' }}>
            {redScore > blueScore ? '🔴 RED' : '🔵 BLUE'} WINS!
          </div>
          <button style={S.replayBtn} onClick={onRestart}>Play Again</button>
        </div>
      )}
    </div>
  );
}

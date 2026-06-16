import { TURBO_DURATION, TURBO_COOLDOWN } from '@tank-arena/shared';

const turboDurations = new Map();
const turboCooldowns = new Map();

export function tryActivateTurbo(sessionId, tank, wantsTurbo) {
  const cooldown = turboCooldowns.get(sessionId) ?? 0;
  if (wantsTurbo && !tank.turboActive && cooldown <= 0) {
    tank.turboActive = true;
    turboDurations.set(sessionId, TURBO_DURATION);
  }
}

export function tickTurbo(sessionId, tank, dt) {
  if (tank.turboActive) {
    const remaining = (turboDurations.get(sessionId) ?? 0) - dt;
    if (remaining <= 0) {
      tank.turboActive = false;
      turboDurations.delete(sessionId);
      turboCooldowns.set(sessionId, TURBO_COOLDOWN);
      tank.turboCooldown = TURBO_COOLDOWN;
    } else {
      turboDurations.set(sessionId, remaining);
    }
  } else {
    const cooldown = (turboCooldowns.get(sessionId) ?? 0) - dt;
    if (cooldown <= 0) {
      turboCooldowns.delete(sessionId);
      tank.turboCooldown = 0;
    } else {
      turboCooldowns.set(sessionId, cooldown);
      tank.turboCooldown = cooldown;
    }
  }
}

export function removeTurboState(sessionId) {
  turboDurations.delete(sessionId);
  turboCooldowns.delete(sessionId);
}

export function isTurboActive(sessionId) {
  return turboDurations.has(sessionId);
}

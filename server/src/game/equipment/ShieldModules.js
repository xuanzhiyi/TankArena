import { SHIELD_DURATION, SHIELD_COOLDOWN } from '@tank-arena/shared';

// Server-side timers (not in schema)
const shieldDurations = new Map();  // sessionId → remaining active seconds
const shieldCooldowns = new Map();  // sessionId → remaining cooldown seconds

export function tryActivateShield(sessionId, tank, wantsShield) {
  const cooldown = shieldCooldowns.get(sessionId) ?? 0;
  if (wantsShield && !tank.shieldActive && cooldown <= 0) {
    tank.shieldActive = true;
    shieldDurations.set(sessionId, SHIELD_DURATION);
  }
}

export function tickShield(sessionId, tank, dt) {
  if (tank.shieldActive) {
    const remaining = (shieldDurations.get(sessionId) ?? 0) - dt;
    if (remaining <= 0) {
      tank.shieldActive = false;
      shieldDurations.delete(sessionId);
      shieldCooldowns.set(sessionId, SHIELD_COOLDOWN);
      tank.shieldCooldown = SHIELD_COOLDOWN;
    } else {
      shieldDurations.set(sessionId, remaining);
    }
  } else {
    const cooldown = (shieldCooldowns.get(sessionId) ?? 0) - dt;
    if (cooldown <= 0) {
      shieldCooldowns.delete(sessionId);
      tank.shieldCooldown = 0;
    } else {
      shieldCooldowns.set(sessionId, cooldown);
      tank.shieldCooldown = cooldown;
    }
  }
}

export function removeShieldState(sessionId) {
  shieldDurations.delete(sessionId);
  shieldCooldowns.delete(sessionId);
}

// Track physical input separately from the simulation's per-frame input state.
// Opening a result screen must not forget fingers or keys that are still held.
export function createTransitionGuard({ now = () => performance.now(), delayMs = 1000, settleMs = 200 } = {}) {
  const held = new Set();
  let active = false, armed = false, deadline = 0, quietUntil = 0;
  return {
    begin() { active = true; armed = false; deadline = now() + delayMs; quietUntil = now() + settleMs; },
    close() { active = false; armed = false; },
    hold(id) { held.add(id); },
    release(id) {
      if (held.delete(id) && active && !armed) quietUntil = now() + settleMs;
    },
    resetHeld() {
      held.clear();
      if (active && !armed) quietUntil = now() + settleMs;
    },
    isLocked() {
      if (active && !armed && !held.size && now() >= deadline && now() >= quietUntil) armed = true;
      return active && !armed;
    },
  };
}

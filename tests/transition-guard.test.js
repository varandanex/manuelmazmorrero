import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTransitionGuard } from '../src/transition-guard.js';

function clock() {
  let time = 0;
  return { guard: createTransitionGuard({ now: () => time }), at: value => { time = value; } };
}

test('result actions wait one second even when no input is held', () => {
  const { guard, at } = clock(); guard.begin();
  assert.equal(guard.isLocked(), true); at(999); assert.equal(guard.isLocked(), true);
  at(1000); assert.equal(guard.isLocked(), false);
});

test('holding attack across a transition never unlocks the result screen', () => {
  const { guard, at } = clock(); guard.hold('key:Space'); guard.begin();
  at(5000); assert.equal(guard.isLocked(), true);
  guard.release('key:Space'); assert.equal(guard.isLocked(), true);
  at(5199); assert.equal(guard.isLocked(), true); at(5200); assert.equal(guard.isLocked(), false);
});

test('both joystick and attack fingers must be released', () => {
  const { guard, at } = clock(); guard.hold('pointer:1'); guard.hold('pointer:2'); guard.begin();
  at(1500); guard.release('pointer:2'); at(1800); assert.equal(guard.isLocked(), true);
  guard.release('pointer:1'); at(2000); assert.equal(guard.isLocked(), false);
});

test('rapid taps during the delay require a quiet gap before menus accept input', () => {
  const { guard, at } = clock(); guard.begin();
  for (const time of [800, 950, 1100, 1250]) {
    at(time); guard.hold('pointer:2'); at(time + 30); guard.release('pointer:2');
    assert.equal(guard.isLocked(), true);
  }
  at(1480); assert.equal(guard.isLocked(), false);
});

test('a fresh deliberate press after unlocking remains allowed', () => {
  const { guard, at } = clock(); guard.begin(); at(1000); assert.equal(guard.isLocked(), false);
  guard.hold('pointer:3'); assert.equal(guard.isLocked(), false);
  guard.release('pointer:3'); assert.equal(guard.isLocked(), false);
});

test('closing and reopening a result uses a new delay without forgetting held input', () => {
  const { guard, at } = clock(); guard.hold('key:Space'); guard.begin(); guard.close();
  assert.equal(guard.isLocked(), false); at(3000); guard.begin(); at(5000);
  assert.equal(guard.isLocked(), true); guard.release('key:Space'); at(5200);
  assert.equal(guard.isLocked(), false);
});

test('lost focus clears missing releases but does not skip the transition delay', () => {
  const { guard, at } = clock(); guard.begin(); guard.hold('pointer:1'); at(100); guard.resetHeld();
  at(999); assert.equal(guard.isLocked(), true); at(1000); assert.equal(guard.isLocked(), false);
});
